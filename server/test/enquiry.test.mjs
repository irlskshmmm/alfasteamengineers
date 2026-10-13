import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { startServer, sample, post, login, adminFetch, ORIGIN } from './helpers.mjs';

test('accepts a valid product enquiry and returns a reference ID', async () => {
  const s = await startServer();
  try {
    const r = await post(s.base, sample());
    assert.equal(r.status, 201);
    const j = await r.json();
    assert.equal(j.ok, true);
    assert.match(j.enquiryId, /^ASE-\d{8}-0001$/);
    assert.equal(j.recorded, true);
    assert.equal(j.spreadsheet, 'not_configured');
    assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
    const row = s.db.prepare('SELECT * FROM enquiries').get();
    assert.equal(row.status, 'New');
    assert.equal(row.quantity, 12);
  } finally { await s.close(); }
});

test('rejects missing/invalid fields with field-level messages and stores nothing', async () => {
  const s = await startServer();
  try {
    const r = await post(s.base, sample({ name: '', company: 'x', email: 'not-an-email', phone: '12', industry: 'Space mining', requirement: 'Unicorns', description: 'short' }));
    assert.equal(r.status, 422);
    const j = await r.json();
    for (const f of ['name', 'company', 'email', 'phone', 'industry', 'requirement', 'description']) assert.ok(j.fields[f], `expected error for ${f}`);
    assert.equal(s.db.prepare('SELECT COUNT(*) n FROM enquiries').get().n, 0);
  } finally { await s.close(); }
});

test('product enquiries need a positive quantity and a unit', async () => {
  const s = await startServer();
  try {
    for (const q of [0, -3, 'abc', '']) {
      const r = await post(s.base, sample({ quantity: q }));
      assert.equal(r.status, 422, `quantity ${q}`);
      assert.ok((await r.json()).fields.quantity);
    }
    const r2 = await post(s.base, sample({ unit: '' }));
    assert.ok((await r2.json()).fields.unit);
    const r3 = await post(s.base, sample({ quantity: '2.5', unit: 'Metres' }));
    assert.equal(r3.status, 201);
  } finally { await s.close(); }
});

test('consultancy enquiries do not require (or store) a quantity', async () => {
  const s = await startServer();
  try {
    const r = await post(s.base, sample({ requirement: 'Industrial Audits', quantity: '', unit: '', brand: 'ignored', material: 'ignored' }));
    assert.equal(r.status, 201);
    const row = s.db.prepare('SELECT * FROM enquiries').get();
    assert.equal(row.requirement_kind, 'service');
    assert.equal(row.quantity, null);
    assert.equal(row.brand, '');
  } finally { await s.close(); }
});

test('"Other" choices require a description', async () => {
  const s = await startServer();
  try {
    const r = await post(s.base, sample({ requirement: 'Other product', requirementOther: '', industry: 'Other', industryOther: '' }));
    const j = await r.json();
    assert.ok(j.fields.requirementOther && j.fields.industryOther);
    const ok = await post(s.base, sample({ requirement: 'Other product', requirementOther: 'Desuperheater', industry: 'Other', industryOther: 'Cement' }));
    assert.equal(ok.status, 201);
  } finally { await s.close(); }
});

test('repeated submissions with the same key create one enquiry (double-click protection)', async () => {
  const s = await startServer();
  try {
    const body = sample();
    const [a, b, c] = await Promise.all([post(s.base, body), post(s.base, body), post(s.base, body)]);
    const ids = await Promise.all([a, b, c].map((r) => r.json()));
    assert.equal(new Set(ids.map((x) => x.enquiryId)).size, 1);
    assert.equal(ids.filter((x) => x.duplicate).length, 2);
    assert.equal(s.db.prepare('SELECT COUNT(*) n FROM enquiries').get().n, 1);
  } finally { await s.close(); }
});

test('concurrent submissions get unique, sequential IDs', async () => {
  const s = await startServer();
  try {
    const res = await Promise.all(Array.from({ length: 30 }, () => post(s.base, sample()).then((r) => r.json())));
    const ids = res.map((r) => r.enquiryId);
    assert.equal(new Set(ids).size, 30);
    const seqs = ids.map((id) => Number(id.slice(-4))).sort((a, b) => a - b);
    assert.deepEqual(seqs, Array.from({ length: 30 }, (_, i) => i + 1));
  } finally { await s.close(); }
});

test('blocks other websites, honeypot spam and floods', async () => {
  const s = await startServer({ RATE_LIMIT_PER_10MIN: '3' });
  try {
    assert.equal((await post(s.base, sample(), { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await post(s.base, sample({ website: 'http://spam' }))).status, 422);
    const codes = [];
    for (let i = 0; i < 3; i++) codes.push((await post(s.base, sample())).status);
    assert.ok(codes.includes(429));
  } finally { await s.close(); }
});

test('admin login locks out after repeated wrong passwords, but successful logins are not limited', async () => {
  const s = await startServer();
  try {
    for (let i = 0; i < 6; i++) assert.equal((await login(s.base)).status, 200, `successful login ${i + 1}`);
    const wrong = () => fetch(`${s.base}/admin/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ASECON-Admin': '1' }, body: JSON.stringify({ username: 'admin', password: 'wrong' }) });
    for (let i = 0; i < 5; i++) assert.equal((await wrong()).status, 401);
    assert.equal((await wrong()).status, 429);
    assert.equal((await login(s.base)).status, 429, 'locked out even with the right password');
  } finally { await s.close(); }
});

test('enquiry data is not accessible without signing in', async () => {
  const s = await startServer();
  try {
    await post(s.base, sample());
    assert.equal((await fetch(`${s.base}/admin/api/enquiries`, { headers: { 'X-ASECON-Admin': '1' } })).status, 401);
    assert.equal((await fetch(`${s.base}/admin/api/export.xlsx`, { headers: { 'X-ASECON-Admin': '1' } })).status, 401);
    assert.equal((await fetch(`${s.base}/admin/api/enquiries/ASE-20260101-0001`, { headers: { 'X-ASECON-Admin': '1' } })).status, 401);
    const bad = await fetch(`${s.base}/admin/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ASECON-Admin': '1' }, body: JSON.stringify({ username: 'admin', password: 'wrong' }) });
    assert.equal(bad.status, 401);
    // State-changing requests without the admin header are refused (CSRF guard)
    const { cookie } = await login(s.base);
    const noHeader = await fetch(`${s.base}/admin/api/logout`, { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(noHeader.status, 403);
    // Admin page itself is served with strict security headers
    const page = await fetch(`${s.base}/admin/`);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  } finally { await s.close(); }
});

test('admin can list, filter, update status/remarks and export a valid .xlsx register', async () => {
  const s = await startServer();
  try {
    const a = await (await post(s.base, sample({ company: 'TEST Alpha Dairy' }))).json();
    await post(s.base, sample({ company: 'TEST Beta Paper', industry: 'Paper & Packaging', requirement: 'Industrial Audits', quantity: '' }));
    const { status, cookie } = await login(s.base);
    assert.equal(status, 200);
    assert.match(cookie, /^asecon_admin=/);

    let list = await (await adminFetch(s.base, cookie, 'enquiries')).json();
    assert.equal(list.enquiries.length, 2);
    assert.equal(list.stats.new, 2);
    list = await (await adminFetch(s.base, cookie, 'enquiries?industry=Paper%20%26%20Packaging')).json();
    assert.equal(list.enquiries.length, 1);
    list = await (await adminFetch(s.base, cookie, 'enquiries?q=Alpha')).json();
    assert.equal(list.enquiries[0].enquiry_id, a.enquiryId);

    const bad = await adminFetch(s.base, cookie, `enquiries/${a.enquiryId}`, { method: 'PATCH', body: JSON.stringify({ status: 'Maybe' }) });
    assert.equal(bad.status, 422);
    const upd = await (await adminFetch(s.base, cookie, `enquiries/${a.enquiryId}`, { method: 'PATCH', body: JSON.stringify({ status: 'Quotation Sent', remarks: 'TEST — quoted 2 options' }) })).json();
    assert.equal(upd.enquiry.status, 'Quotation Sent');

    const x = await adminFetch(s.base, cookie, 'export.xlsx');
    assert.equal(x.status, 200);
    assert.match(x.headers.get('content-type'), /spreadsheetml/);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(await x.arrayBuffer()));
    const ws = wb.getWorksheet('Enquiries');
    assert.ok(ws.getTable('Enquiries'), 'workbook has a table named Enquiries');
    assert.equal(ws.getCell('A1').value, 'Enquiry ID');
    assert.equal(ws.getCell('R1').value, 'Source Page');
    const ids = [ws.getCell('A2').value, ws.getCell('A3').value];
    assert.ok(ids.includes(a.enquiryId));
    const statusOfA = ws.getCell(ids.indexOf(a.enquiryId) + 2, 16).value;
    assert.equal(statusOfA, 'Quotation Sent');

    await s.app.flushRegister();
    assert.ok(existsSync(s.config.registerPath), 'server-side register file written');
  } finally { await s.close(); }
});
