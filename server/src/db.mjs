// Persistent storage: SQLite via Node's built-in node:sqlite (no native add-ons; works on Windows/Linux/macOS).
// SQLite serialises writes, and every multi-step write runs inside BEGIN IMMEDIATE, so concurrent
// submissions can never receive the same enquiry ID or overwrite each other.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  created_local TEXT NOT NULL,
  name TEXT NOT NULL, company TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
  industry TEXT NOT NULL, industry_other TEXT NOT NULL DEFAULT '',
  requirement TEXT NOT NULL, requirement_kind TEXT NOT NULL, requirement_other TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  quantity REAL, unit TEXT NOT NULL DEFAULT '', unit_other TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '', material TEXT NOT NULL DEFAULT '', timeline TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New', remarks TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  sync_status TEXT NOT NULL DEFAULT 'not_configured', sync_error TEXT NOT NULL DEFAULT '', synced_at TEXT,
  notify_status TEXT NOT NULL DEFAULT 'off',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enq_created ON enquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_enq_status ON enquiries(status);
CREATE TABLE IF NOT EXISTS sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('append','update')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  done_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_jobs_due ON sync_jobs(done_at, next_attempt_at);
CREATE TABLE IF NOT EXISTS counters (day TEXT PRIMARY KEY, seq INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires_at TEXT NOT NULL);
`;

export function openDb(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

export function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// Local date/time parts in the company's time zone (default Asia/Kolkata).
export function localParts(date, timeZone) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: `${p.year}${p.month}${p.day}`, local: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` };
}

export function getByKey(db, key) {
  return db.prepare('SELECT * FROM enquiries WHERE idempotency_key = ?').get(key);
}
export function getById(db, enquiryId) {
  return db.prepare('SELECT * FROM enquiries WHERE enquiry_id = ?').get(enquiryId);
}

/** Insert an accepted enquiry (or return the existing one for a repeated idempotency key). */
export function createEnquiry(db, v, { now = new Date(), timeZone, prefix, syncEnabled }) {
  return tx(db, () => {
    const existing = getByKey(db, v.idempotencyKey);
    if (existing) return { row: existing, duplicate: true };
    const { day, local } = localParts(now, timeZone);
    db.prepare('INSERT INTO counters(day, seq) VALUES(?, 1) ON CONFLICT(day) DO UPDATE SET seq = seq + 1').run(day);
    const { seq } = db.prepare('SELECT seq FROM counters WHERE day = ?').get(day);
    const enquiryId = `${prefix}-${day}-${String(seq).padStart(4, '0')}`;
    const iso = now.toISOString();
    db.prepare(`INSERT INTO enquiries (enquiry_id, idempotency_key, created_at, created_local, name, company, email, phone,
      industry, industry_other, requirement, requirement_kind, requirement_other, description, quantity, unit, unit_other,
      brand, material, timeline, notes, source_url, sync_status, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      enquiryId, v.idempotencyKey, iso, local, v.name, v.company, v.email, v.phone,
      v.industry, v.industryOther, v.requirement, v.kind, v.requirementOther, v.description, v.quantity, v.unit, v.unitOther,
      v.brand, v.material, v.timeline, v.notes, v.sourceUrl, syncEnabled ? 'pending' : 'not_configured', iso,
    );
    if (syncEnabled) enqueueJob(db, enquiryId, 'append', now);
    return { row: getById(db, enquiryId), duplicate: false };
  });
}

export function enqueueJob(db, enquiryId, action, now = new Date()) {
  if (action === 'update') {
    // An appended row picks up the latest values anyway; don't stack duplicate updates.
    const pending = db.prepare('SELECT 1 FROM sync_jobs WHERE enquiry_id = ? AND done_at IS NULL').get(enquiryId);
    if (pending) return;
  }
  db.prepare('INSERT INTO sync_jobs(enquiry_id, action, next_attempt_at, created_at) VALUES (?,?,?,?)').run(enquiryId, action, now.toISOString(), now.toISOString());
}

export function updateEnquiry(db, enquiryId, changes, { now = new Date(), syncEnabled }) {
  return tx(db, () => {
    const row = getById(db, enquiryId);
    if (!row) return null;
    const status = changes.status ?? row.status;
    const remarks = changes.remarks ?? row.remarks;
    db.prepare('UPDATE enquiries SET status = ?, remarks = ?, updated_at = ? WHERE enquiry_id = ?').run(status, remarks, now.toISOString(), enquiryId);
    if (syncEnabled) {
      enqueueJob(db, enquiryId, 'update', now);
      db.prepare("UPDATE enquiries SET sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END WHERE enquiry_id = ?").run(enquiryId);
    }
    return getById(db, enquiryId);
  });
}

export function listEnquiries(db, f = {}) {
  const where = [];
  const args = [];
  if (f.q) {
    where.push('(enquiry_id LIKE ? OR name LIKE ? OR company LIKE ? OR email LIKE ? OR requirement LIKE ? OR requirement_other LIKE ? OR description LIKE ?)');
    const like = `%${f.q}%`;
    args.push(like, like, like, like, like, like, like);
  }
  if (f.company) { where.push('company LIKE ?'); args.push(`%${f.company}%`); }
  if (f.industry) { where.push('industry = ?'); args.push(f.industry); }
  if (f.status) { where.push('status = ?'); args.push(f.status); }
  if (f.product) { where.push('(requirement = ? OR requirement_other LIKE ?)'); args.push(f.product, `%${f.product}%`); }
  if (f.from) { where.push('substr(created_local, 1, 10) >= ?'); args.push(f.from); }
  if (f.to) { where.push('substr(created_local, 1, 10) <= ?'); args.push(f.to); }
  if (f.sync) { where.push('sync_status = ?'); args.push(f.sync); }
  const sql = `SELECT * FROM enquiries ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at ${f.order === 'asc' ? 'ASC' : 'DESC'}, id ${f.order === 'asc' ? 'ASC' : 'DESC'} LIMIT ?`;
  args.push(Math.min(Math.max(Number(f.limit) || 500, 1), 5000));
  return db.prepare(sql).all(...args);
}

export function stats(db) {
  const one = (sql) => db.prepare(sql).get().n;
  return {
    total: one('SELECT COUNT(*) n FROM enquiries'),
    new: one("SELECT COUNT(*) n FROM enquiries WHERE status = 'New'"),
    syncPending: one("SELECT COUNT(*) n FROM enquiries WHERE sync_status IN ('pending','retrying')"),
    syncFailed: one("SELECT COUNT(*) n FROM enquiries WHERE sync_status = 'failed'"),
  };
}
