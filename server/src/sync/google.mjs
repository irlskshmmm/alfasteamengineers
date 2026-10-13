// Google Sheets via a service account (JWT bearer flow, signed locally with node:crypto).
// Share the spreadsheet with the service-account email as Editor. Values are written RAW (never as formulas).
import { createSign } from 'node:crypto';
import { COLUMNS, rowValues } from '../columns.mjs';

const b64url = (s) => Buffer.from(s).toString('base64url');
const colLetter = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

export function googleAdapter(cfg, fetchImpl = fetch) {
  let token = null;
  let tokenExp = 0;
  let headersChecked = false;
  const lastCol = colLetter(COLUMNS.length);
  const sheet = `'${cfg.sheetName.replace(/'/g, "''")}'`;
  const values = (range) => `${cfg.apiBase}/v4/spreadsheets/${encodeURIComponent(cfg.spreadsheetId)}/values/${encodeURIComponent(`${sheet}!${range}`)}`;

  async function getToken() {
    if (token && Date.now() < tokenExp - 60_000) return token;
    const now = Math.floor(Date.now() / 1000);
    const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = b64url(JSON.stringify({ iss: cfg.clientEmail, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: cfg.tokenUrl, iat: now, exp: now + 3600 }));
    const sig = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(cfg.privateKey).toString('base64url');
    const res = await fetchImpl(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${sig}` }),
    });
    if (!res.ok) throw new Error(`Google sign-in failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    token = j.access_token;
    tokenExp = Date.now() + (j.expires_in || 3600) * 1000;
    return token;
  }

  async function call(method, url, body) {
    const res = await fetchImpl(url, { method, headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error(`Google Sheets ${method} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }

  async function ensureHeaders() {
    if (headersChecked) return;
    const j = await call('GET', values(`A1:${lastCol}1`));
    if (!j.values || !j.values.length) await call('PUT', `${values(`A1:${lastCol}1`)}?valueInputOption=RAW`, { values: [COLUMNS.map((c) => c.header)] });
    headersChecked = true;
  }

  async function findRow(enquiryId) {
    const j = await call('GET', values('A:A'));
    const i = (j.values || []).findIndex((r) => r[0] === enquiryId);
    return i < 0 ? -1 : i + 1; // 1-based sheet row
  }

  return {
    name: 'google',
    async append(row) {
      await ensureHeaders();
      if ((await findRow(row.enquiry_id)) > 0) return this.update(row); // idempotent retry
      await call('POST', `${values(`A1:${lastCol}1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { values: [rowValues(row)] });
    },
    async update(row) {
      const n = await findRow(row.enquiry_id);
      if (n < 0) throw new Error(`Row ${row.enquiry_id} not found in the sheet yet.`);
      await call('PUT', `${values(`A${n}:${lastCol}${n}`)}?valueInputOption=RAW`, { values: [rowValues(row)] });
    },
  };
}
