// Durable sync queue: every accepted enquiry is already safe in SQLite; this worker pushes it to the
// spreadsheet service and retries with exponential back-off if that service is unavailable.
//   enquiry.sync_status: not_configured | pending | retrying | synced | failed (gave up — retry from the dashboard)
import { getById } from '../db.mjs';
import { microsoftAdapter } from './microsoft.mjs';
import { googleAdapter } from './google.mjs';

export function createSyncer(config, db, { fetchImpl = fetch, log = console } = {}) {
  const { provider, maxAttempts } = config.sync;
  let adapter = null;
  if (provider === 'microsoft' && !config.problems.some((p) => p.startsWith('SYNC_PROVIDER=microsoft'))) adapter = microsoftAdapter(config.sync.microsoft, fetchImpl);
  if (provider === 'google' && !config.problems.some((p) => p.startsWith('SYNC_PROVIDER=google'))) adapter = googleAdapter(config.sync.google, fetchImpl);

  const backoffMs = (attempts) => Math.min(30_000 * 2 ** (attempts - 1), 6 * 3600_000);
  // Runs are serialised: a call made while one is in flight waits for it, then runs again.
  let chain = Promise.resolve();
  const runDue = (now) => (chain = chain.then(() => runOnce(now || new Date()), () => runOnce(now || new Date())));

  async function runOnce(now) {
    if (!adapter) return { processed: 0 };
    let processed = 0;
    const jobs = db.prepare('SELECT * FROM sync_jobs WHERE done_at IS NULL AND attempts < ? AND next_attempt_at <= ? ORDER BY id LIMIT 25').all(maxAttempts, now.toISOString());
    for (const job of jobs) {
      // Keep per-enquiry order: an update waits until that enquiry's append has succeeded.
      const earlier = db.prepare('SELECT 1 FROM sync_jobs WHERE enquiry_id = ? AND done_at IS NULL AND id < ?').get(job.enquiry_id, job.id);
      if (earlier) continue;
      const row = getById(db, job.enquiry_id);
      processed++;
      try {
        if (!row) throw new Error('Enquiry no longer exists.');
        await adapter[job.action](row);
        const t = new Date().toISOString();
        db.prepare('UPDATE sync_jobs SET done_at = ?, last_error = \'\' WHERE id = ?').run(t, job.id);
        const more = db.prepare('SELECT 1 FROM sync_jobs WHERE enquiry_id = ? AND done_at IS NULL').get(job.enquiry_id);
        db.prepare('UPDATE enquiries SET sync_status = ?, sync_error = \'\', synced_at = ? WHERE enquiry_id = ?').run(more ? 'pending' : 'synced', t, job.enquiry_id);
      } catch (e) {
        const attempts = job.attempts + 1;
        const msg = String(e.message || e).slice(0, 500);
        const next = new Date(Date.now() + backoffMs(attempts)).toISOString();
        db.prepare('UPDATE sync_jobs SET attempts = ?, last_error = ?, next_attempt_at = ? WHERE id = ?').run(attempts, msg, next, job.id);
        db.prepare('UPDATE enquiries SET sync_status = ?, sync_error = ? WHERE enquiry_id = ?').run(attempts >= maxAttempts ? 'failed' : 'retrying', msg, job.enquiry_id);
        log.warn?.(`[sync] ${job.action} ${job.enquiry_id} failed (attempt ${attempts}/${maxAttempts}): ${msg}`);
      }
    }
    return { processed };
  }

  // Manual retry from the dashboard: reset attempts on every unfinished job.
  function retryAll() {
    const n = db.prepare('UPDATE sync_jobs SET attempts = 0, next_attempt_at = ? WHERE done_at IS NULL').run(new Date(0).toISOString()).changes;
    db.prepare("UPDATE enquiries SET sync_status = 'pending' WHERE sync_status IN ('failed','retrying')").run();
    return n;
  }

  let timer = null;
  return {
    enabled: !!adapter,
    provider: adapter ? adapter.name : 'none',
    runDue,
    retryAll,
    start() {
      if (!adapter || timer) return;
      timer = setInterval(() => runDue().catch((e) => log.error?.('[sync]', e)), config.sync.intervalSeconds * 1000);
      timer.unref?.();
    },
    stop() { clearInterval(timer); timer = null; },
  };
}
