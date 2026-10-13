// Admin authentication: scrypt password hash in an env var, random session tokens (stored hashed),
// HttpOnly + SameSite=Strict cookies, and a custom header on every state-changing request (CSRF guard).
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'asecon_admin';

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const got = scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, { N: Number(N), r: Number(r), p: Number(p) });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

const sha = (t) => createHash('sha256').update(t).digest('hex');

export function createSession(db, username, hours) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + hours * 3600_000).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  db.prepare('INSERT INTO sessions(token_hash, username, expires_at) VALUES (?,?,?)').run(sha(token), username, expires);
  return { token, expires };
}

export function getSession(db, token) {
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(sha(token));
  if (!s || s.expires_at < new Date().toISOString()) return null;
  return s;
}

export function deleteSession(db, token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
}

export function sessionCookie(token, { hours, secure }) {
  return `${COOKIE}=${token}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${hours * 3600}${secure ? '; Secure' : ''}`;
}
export const clearCookie = (secure) => `${COOKIE}=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
