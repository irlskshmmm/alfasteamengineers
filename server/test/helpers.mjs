// Test helpers: every test gets its own temporary data directory, so no test record ever touches a real register.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config.mjs';
import { openDb } from '../src/db.mjs';
import { createSyncer } from '../src/sync/index.mjs';
import { createNotifier } from '../src/notify.mjs';
import { createApp } from '../src/app.mjs';
import { hashPassword } from '../src/auth.mjs';

export const ORIGIN = 'https://www.asecon.test';
export const ADMIN_PW = 'test-password-123456';
const quiet = { log() {}, warn() {}, error() {} };

export async function startServer(env = {}, { fetchImpl, transportFactory } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'asecon-test-'));
  const config = loadConfig({
    DATA_DIR: dir, ALLOWED_ORIGINS: ORIGIN, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD_HASH: hashPassword(ADMIN_PW),
    COOKIE_SECURE: 'false', RATE_LIMIT_PER_10MIN: '1000', ...env,
  });
  const db = openDb(config.dbPath);
  const syncer = createSyncer(config, db, { fetchImpl, log: quiet });
  const notifier = createNotifier(config, { log: quiet, transportFactory });
  const app = createApp({ config, db, syncer, notifier, log: quiet });
  const server = createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base, db, config, syncer, app, dir,
    async close() { await new Promise((r) => server.close(r)); try { await app.flushRegister(); } catch { /* ignore */ } db.close(); rmSync(dir, { recursive: true, force: true }); },
  };
}

// A clearly-marked TEST enquiry.
export const sample = (over = {}) => ({
  name: 'Test Contact', company: 'TEST — Example Industries', email: 'test.contact@example.com', phone: '+91 98765 43210',
  industry: 'Dairy', requirement: 'Ball Valves', description: 'TEST RECORD — 2" ball valves, SS316, PN40, flanged ends.',
  quantity: 12, unit: 'Pieces', brand: '', material: 'SS316', timeline: 'Within 1 month', notes: 'Automated test record.',
  sourceUrl: 'https://www.asecon.test/products.html', idempotencyKey: randomUUID(), ...over,
});

export const post = (base, body, headers = {}) => fetch(`${base}/api/enquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers }, body: JSON.stringify(body) });

export async function login(base) {
  const r = await fetch(`${base}/admin/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ASECON-Admin': '1' }, body: JSON.stringify({ username: 'admin', password: ADMIN_PW }) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  return { status: r.status, cookie };
}
export const adminFetch = (base, cookie, path, opts = {}) => fetch(`${base}/admin/api/${path}`, { ...opts, headers: { Cookie: cookie, 'X-ASECON-Admin': '1', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } });

// Minimal mock HTTP server for Microsoft Graph / Google APIs.
export async function mockServer(handler) {
  const calls = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const c of req) body += c;
    const call = { method: req.method, url: req.url, body, headers: req.headers };
    calls.push(call);
    const out = await handler(call);
    res.writeHead(out.status || 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out.json ?? {}));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, calls, close: () => new Promise((r) => server.close(r)) };
}
