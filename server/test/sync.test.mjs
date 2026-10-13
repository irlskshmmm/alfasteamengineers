import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { startServer, sample, post, login, adminFetch, mockServer } from './helpers.mjs';

test('Microsoft Excel sync: failure keeps the enquiry safe, retries, then syncs; formulas are neutralised', async () => {
  let failAdds = true;
  const table = [];
  const graph = await mockServer(({ method, url, body }) => {
    if (url.startsWith('/token')) return { json: { access_token: 'tok', expires_in: 3600 } };
    if (url.includes('/columns/itemAt(index=0)/dataBodyRange')) return { json: { values: table.map((r) => [r[0]]) } };
    if (url.endsWith('/rows/add') && method === 'POST') {
      if (failAdds) return { status: 503, json: { error: 'Service unavailable' } };
      table.push(JSON.parse(body).values[0]);
      return { status: 201, json: {} };
    }
    const m = url.match(/rows\/itemAt\(index=(\d+)\)/);
    if (m && method === 'PATCH') { table[Number(m[1])] = JSON.parse(body).values[0]; return { json: {} }; }
    return { status: 404, json: {} };
  });
  const s = await startServer({
    SYNC_PROVIDER: 'microsoft', MS_TENANT_ID: 't', MS_CLIENT_ID: 'c', MS_CLIENT_SECRET: 'secret',
    MS_WORKBOOK_URL: `${graph.base}/v1.0/drives/d/items/i`, MS_TOKEN_URL: `${graph.base}/token`,
  });
  try {
    assert.equal(s.syncer.enabled, true);
    const r = await post(s.base, sample({ company: '=HYPERLINK("http://evil")', notes: '+cmd' }));
    assert.equal(r.status, 201, 'visitor is told the enquiry was received even though Excel is down');
    const { enquiryId } = await r.json();
    await s.syncer.runDue();
    let row = s.db.prepare('SELECT * FROM enquiries WHERE enquiry_id = ?').get(enquiryId);
    assert.equal(row.sync_status, 'retrying');
    assert.match(row.sync_error, /503/);

    failAdds = false;
    const { cookie } = await login(s.base);
    const retry = await (await adminFetch(s.base, cookie, 'sync/retry', { method: 'POST' })).json();
    assert.equal(retry.ok, true);
    row = s.db.prepare('SELECT * FROM enquiries WHERE enquiry_id = ?').get(enquiryId);
    assert.equal(row.sync_status, 'synced');
    assert.equal(table.length, 1);
    assert.equal(table[0][0], enquiryId);
    assert.equal(table[0][3], '\'=HYPERLINK("http://evil")', 'formula-like input is stored as text');
    assert.equal(table[0][14], "'+cmd");

    // Status changes in the dashboard flow through to the Excel row
    await adminFetch(s.base, cookie, `enquiries/${enquiryId}`, { method: 'PATCH', body: JSON.stringify({ status: 'Contacted' }) });
    await s.syncer.runDue();
    assert.equal(table[0][15], 'Contacted');
    assert.equal(table.length, 1, 'update did not append a duplicate row');
    const auth = graph.calls.find((c) => c.url.endsWith('/rows/add')).headers.authorization;
    assert.equal(auth, 'Bearer tok');
  } finally { await s.close(); await graph.close(); }
});

test('Google Sheets sync: writes header + RAW row using a signed service-account token', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
  const sheet = [];
  const g = await mockServer(({ method, url, body }) => {
    if (url.startsWith('/token')) {
      const assertion = new URLSearchParams(body).get('assertion');
      assert.equal(assertion.split('.').length, 3);
      return { json: { access_token: 'gtok', expires_in: 3600 } };
    }
    const u = decodeURIComponent(url);
    if (method === 'GET' && u.includes('!A1:R1')) return { json: sheet.length ? { values: [sheet[0]] } : {} };
    if (method === 'PUT' && u.includes('!A1:R1')) { sheet[0] = JSON.parse(body).values[0]; return { json: {} }; }
    if (method === 'GET' && u.includes('!A:A')) return { json: { values: sheet.map((r) => [r[0]]) } };
    if (method === 'POST' && u.includes(':append')) { assert.match(u, /valueInputOption=RAW/); sheet.push(JSON.parse(body).values[0]); return { json: {} }; }
    return { status: 404, json: {} };
  });
  const s = await startServer({
    SYNC_PROVIDER: 'google', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'svc@test.iam.gserviceaccount.com', GOOGLE_PRIVATE_KEY: privateKey.replace(/\n/g, '\\n'),
    GOOGLE_SPREADSHEET_ID: 'sheet123', GOOGLE_TOKEN_URL: `${g.base}/token`, GOOGLE_SHEETS_BASE: g.base,
  });
  try {
    const { enquiryId } = await (await post(s.base, sample())).json();
    await s.syncer.runDue();
    assert.equal(sheet[0][0], 'Enquiry ID');
    assert.equal(sheet[1][0], enquiryId);
    assert.equal(s.db.prepare('SELECT sync_status FROM enquiries').get().sync_status, 'synced');
  } finally { await s.close(); await g.close(); }
});

test('misconfigured sync provider is reported, not silently treated as working', async () => {
  const s = await startServer({ SYNC_PROVIDER: 'microsoft' });
  try {
    assert.equal(s.syncer.enabled, false);
    assert.ok(s.config.problems.some((p) => p.includes('MS_TENANT_ID')));
    const j = await (await post(s.base, sample())).json();
    assert.equal(j.spreadsheet, 'not_configured');
  } finally { await s.close(); }
});

test('email notification includes the reference and contact, not the full specification', async () => {
  const sent = [];
  const s = await startServer({ SMTP_HOST: 'smtp.test', NOTIFY_EMAIL_TO: 'sales@asecon.test', NOTIFY_EMAIL_FROM: 'web@asecon.test', PUBLIC_ADMIN_URL: 'https://enquiries.asecon.test/admin' },
    { transportFactory: () => ({ sendMail: async (m) => { sent.push(m); } }) });
  try {
    const { enquiryId } = await (await post(s.base, sample())).json();
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(sent.length, 1);
    assert.match(sent[0].subject, new RegExp(enquiryId));
    assert.match(sent[0].text, /test\.contact@example\.com/);
    assert.match(sent[0].text, /enquiries\.asecon\.test\/admin\/#ASE-/);
    assert.doesNotMatch(sent[0].text, /SS316, PN40/);
    assert.equal(s.db.prepare('SELECT notify_status FROM enquiries').get().notify_status, 'sent');
  } finally { await s.close(); }
});
