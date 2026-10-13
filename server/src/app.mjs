// HTTP routes. Public: POST /api/enquiries, GET /api/health. Everything under /admin requires login.
import { readFileSync } from 'node:fs';
import { createEnquiry, getById, listEnquiries, stats, updateEnquiry } from './db.mjs';
import { validateEnquiry, validateUpdate, options } from './validate.mjs';
import { COOKIE, clearCookie, createSession, deleteSession, getSession, sessionCookie, verifyPassword } from './auth.mjs';
import { workbookBuffer, writeRegister } from './xlsx.mjs';

const MAX_BODY = 32 * 1024;
const ADMIN_FILES = { '/admin/': ['index.html', 'text/html; charset=utf-8'], '/admin/admin.js': ['admin.js', 'text/javascript; charset=utf-8'], '/admin/admin.css': ['admin.css', 'text/css; charset=utf-8'] };
const ADMIN_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

function rateLimiter(limit, windowMs) {
  const hits = new Map();
  // record=false only checks the budget; the caller records later (e.g. only failed logins count).
  return (key, { record = true } = {}) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= limit) { hits.set(key, arr); return false; }
    if (record) arr.push(now);
    hits.set(key, arr);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    return true;
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Request too large.'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, v.join('=')]));

export function createApp({ config, db, syncer, notifier, log = console }) {
  const enquiryLimit = rateLimiter(config.rateLimitPer10Min, 10 * 60_000);
  const loginLimit = rateLimiter(5, 15 * 60_000); // failed attempts only
  const adminDir = new URL('../admin/', import.meta.url);

  // Keep the on-disk Excel register in step with the database (debounced; failures are logged and retried).
  let registerTimer = null;
  let registerDirty = false;
  const scheduleRegister = () => {
    registerDirty = true;
    clearTimeout(registerTimer);
    registerTimer = setTimeout(async () => {
      registerDirty = false;
      try { await writeRegister(config.registerPath, listEnquiries(db, { limit: 100000, order: 'asc' })); }
      catch (e) { registerDirty = true; log.warn?.(`[register] could not write ${config.registerPath}: ${e.message}`); }
    }, 1500);
    registerTimer.unref?.();
  };
  const flushRegister = async () => { clearTimeout(registerTimer); if (registerDirty) { registerDirty = false; await writeRegister(config.registerPath, listEnquiries(db, { limit: 100000, order: 'asc' })); } };

  const ip = (req) => (config.trustProxy && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';

  function send(res, status, body, headers = {}) {
    const isBuf = Buffer.isBuffer(body);
    res.writeHead(status, { 'Content-Type': isBuf ? 'application/octet-stream' : 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...headers });
    res.end(isBuf || typeof body === 'string' ? body : JSON.stringify(body));
  }

  function cors(req, res) {
    const origin = req.headers.origin;
    if (!origin) return true; // server-to-server / same-origin tools
    if (!config.allowedOrigins.includes(origin)) return false;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    return true;
  }

  const publicRecord = (r) => ({ enquiryId: r.enquiry_id, submittedAt: r.created_at, recorded: true, spreadsheet: r.sync_status });

  async function postEnquiry(req, res) {
    if (!cors(req, res)) return send(res, 403, { ok: false, error: 'This website is not allowed to submit enquiries.' });
    if (!/application\/json/i.test(req.headers['content-type'] || '')) return send(res, 415, { ok: false, error: 'Send JSON.' });
    if (!enquiryLimit(ip(req))) return send(res, 429, { ok: false, error: 'Too many enquiries from this connection. Please wait a few minutes and try again.' });
    let input;
    try { input = JSON.parse(await readBody(req)); }
    catch (e) { return send(res, e.status || 400, { ok: false, error: e.status === 413 ? 'Enquiry is too large.' : 'Invalid request.' }); }
    const result = validateEnquiry(input);
    if (!result.ok) return send(res, 422, { ok: false, error: 'Please correct the highlighted fields.', fields: result.errors });

    let created;
    try {
      created = createEnquiry(db, result.value, { timeZone: config.timezone, prefix: config.idPrefix, syncEnabled: syncer.enabled });
    } catch (e) {
      log.error?.('[enquiry] database write failed', e);
      return send(res, 503, { ok: false, error: 'We could not record your enquiry right now. Nothing was saved — please try again shortly.' });
    }
    const { row, duplicate } = created;
    if (!duplicate) {
      scheduleRegister();
      if (syncer.enabled) setImmediate(() => syncer.runDue().catch((e) => log.error?.('[sync]', e)));
      if (notifier.enabled) {
        notifier.newEnquiry(row).then((s) => db.prepare('UPDATE enquiries SET notify_status = ? WHERE enquiry_id = ?').run(s, row.enquiry_id)).catch(() => {});
      }
    }
    return send(res, duplicate ? 200 : 201, { ok: true, duplicate, ...publicRecord(row) });
  }

  // ---------- admin
  const session = (req) => getSession(db, cookies(req)[COOKIE]);
  const needsCsrf = (req) => req.method !== 'GET' && req.headers['x-asecon-admin'] !== '1';

  async function admin(req, res, url) {
    const path = url.pathname;
    if (path === '/admin') return send(res, 301, '', { Location: '/admin/' });
    if (ADMIN_FILES[path] && req.method === 'GET') {
      const [file, type] = ADMIN_FILES[path];
      return send(res, 200, readFileSync(new URL(file, adminDir)), { ...ADMIN_HEADERS, 'Content-Type': type });
    }
    if (!path.startsWith('/admin/api/')) return send(res, 404, { ok: false, error: 'Not found.' }, ADMIN_HEADERS);
    if (needsCsrf(req)) return send(res, 403, { ok: false, error: 'Missing admin header.' }, ADMIN_HEADERS);
    const secure = config.admin.cookieSecure;

    if (path === '/admin/api/login' && req.method === 'POST') {
      if (!config.admin.username || !config.admin.passwordHash) return send(res, 503, { ok: false, error: 'Admin login is not configured on the server (ADMIN_USERNAME / ADMIN_PASSWORD_HASH).' }, ADMIN_HEADERS);
      if (!loginLimit(ip(req), { record: false })) return send(res, 429, { ok: false, error: 'Too many login attempts. Try again in 15 minutes.' }, ADMIN_HEADERS);
      let body = {};
      try { body = JSON.parse(await readBody(req)); } catch { /* treated as bad credentials */ }
      const ok = body.username === config.admin.username && verifyPassword(body.password || '', config.admin.passwordHash);
      if (!ok) { loginLimit(ip(req)); return send(res, 401, { ok: false, error: 'Incorrect username or password.' }, ADMIN_HEADERS); }
      const s = createSession(db, body.username, config.admin.sessionHours);
      return send(res, 200, { ok: true }, { ...ADMIN_HEADERS, 'Set-Cookie': sessionCookie(s.token, { hours: config.admin.sessionHours, secure }) });
    }

    const s = session(req);
    if (!s) return send(res, 401, { ok: false, error: 'Please sign in.' }, ADMIN_HEADERS);

    if (path === '/admin/api/logout' && req.method === 'POST') {
      deleteSession(db, cookies(req)[COOKIE]);
      return send(res, 200, { ok: true }, { ...ADMIN_HEADERS, 'Set-Cookie': clearCookie(secure) });
    }
    if (path === '/admin/api/session' && req.method === 'GET') {
      return send(res, 200, { ok: true, user: s.username, options, sync: syncer.provider, notifications: notifier.enabled, problems: config.problems, stats: stats(db) }, ADMIN_HEADERS);
    }
    const filters = Object.fromEntries(['q', 'company', 'industry', 'status', 'product', 'from', 'to', 'sync', 'limit'].map((k) => [k, url.searchParams.get(k) || '']));
    if (path === '/admin/api/enquiries' && req.method === 'GET') {
      return send(res, 200, { ok: true, stats: stats(db), enquiries: listEnquiries(db, filters) }, ADMIN_HEADERS);
    }
    const m = path.match(/^\/admin\/api\/enquiries\/([A-Z0-9-]{6,40})$/);
    if (m && req.method === 'PATCH') {
      let body;
      try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { ok: false, error: 'Invalid request.' }, ADMIN_HEADERS); }
      const v = validateUpdate(body);
      if (!v.ok) return send(res, 422, { ok: false, error: 'Invalid update.', fields: v.errors }, ADMIN_HEADERS);
      const row = updateEnquiry(db, m[1], v.value, { syncEnabled: syncer.enabled });
      if (!row) return send(res, 404, { ok: false, error: 'Enquiry not found.' }, ADMIN_HEADERS);
      scheduleRegister();
      if (syncer.enabled) setImmediate(() => syncer.runDue().catch(() => {}));
      return send(res, 200, { ok: true, enquiry: row }, ADMIN_HEADERS);
    }
    if (m && req.method === 'GET') {
      const row = getById(db, m[1]);
      return row ? send(res, 200, { ok: true, enquiry: row }, ADMIN_HEADERS) : send(res, 404, { ok: false, error: 'Enquiry not found.' }, ADMIN_HEADERS);
    }
    if (path === '/admin/api/export.xlsx' && req.method === 'GET') {
      const buf = await workbookBuffer(listEnquiries(db, { ...filters, limit: 100000, order: 'asc' }));
      const day = new Date().toISOString().slice(0, 10);
      return send(res, 200, buf, { ...ADMIN_HEADERS, 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="ASECON-Enquiries-${day}.xlsx"` });
    }
    if (path === '/admin/api/sync/retry' && req.method === 'POST') {
      if (!syncer.enabled) return send(res, 409, { ok: false, error: 'No spreadsheet service is configured.' }, ADMIN_HEADERS);
      const n = syncer.retryAll();
      await syncer.runDue();
      return send(res, 200, { ok: true, requeued: n, stats: stats(db) }, ADMIN_HEADERS);
    }
    return send(res, 404, { ok: false, error: 'Not found.' }, ADMIN_HEADERS);
  }

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/api/enquiries') {
        if (req.method === 'OPTIONS') return cors(req, res) ? send(res, 204, '') : send(res, 403, '');
        if (req.method === 'POST') return await postEnquiry(req, res);
        return send(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST, OPTIONS' });
      }
      if (url.pathname === '/api/health' && req.method === 'GET') {
        cors(req, res);
        return send(res, 200, { ok: true, sync: syncer.provider, notifications: notifier.enabled });
      }
      if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) return await admin(req, res, url);
      return send(res, 404, { ok: false, error: 'Not found.' });
    } catch (e) {
      log.error?.('[http]', e);
      if (!res.headersSent) send(res, 500, { ok: false, error: 'Server error.' });
    }
  };
  handler.flushRegister = flushRegister;
  return handler;
}

