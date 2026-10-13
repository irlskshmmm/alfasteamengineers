// End-to-end test of the enquiry modal, contact form and admin dashboard in a real browser.
// Prerequisites: the site built with ENQUIRY_API_URL pointing at a TEST backend, both servers running.
//   SITE_URL=http://localhost:4173 API_URL=http://127.0.0.1:8787 ADMIN_USER=admin ADMIN_PASS=... node tests/enquiry.e2e.mjs
// Uses clearly-marked TEST data; point it at a throwaway DATA_DIR, never the production register.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const SITE = process.env.SITE_URL || 'http://localhost:4173';
const API = process.env.API_URL || 'http://127.0.0.1:8787';
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n').slice(0, 6).join(' | ')]); }
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
const modal = page.locator('#enquiry-modal');
const m = (n) => page.locator(`#m-${n}`);

async function fillContact(p = 'm', over = {}) {
  const v = { name: 'Test Contact', company: 'TEST — E2E Industries', email: 'e2e.test@example.com', phone: '+91 98765 43210', ...over };
  for (const [k, val] of Object.entries(v)) await page.fill(`#${p}-${k}`, val);
}

await page.goto(`${SITE}/products.html`, { waitUntil: 'networkidle' });

await check('product "Enquire" opens the modal pre-filled, without navigating', async () => {
  const link = page.locator('.prod-card a[aria-label="Enquire about Ball Valves"]');
  await link.click();
  await assert.doesNotReject(modal.waitFor({ state: 'visible' }));
  assert.equal(new URL(page.url()).pathname, '/products.html');
  assert.equal(await m('requirement').inputValue(), 'Ball Valves');
  assert.match(await page.locator('[data-enquiry-context]').textContent(), /Ball Valves/);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('em-open')), true, 'background scroll locked');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'm-name', 'focus moves into the form');
});

await check('empty submit shows inline errors and keeps the modal open', async () => {
  await page.click('#enquiry-modal [data-submit]');
  for (const f of ['name', 'company', 'email', 'phone', 'industry', 'description', 'quantity', 'unit']) {
    assert.equal(await page.locator(`#enquiry-modal [data-field="${f}"]`).getAttribute('class').then((c) => c.includes('invalid')), true, `${f} flagged`);
  }
  assert.equal(await m('requirement').inputValue(), 'Ball Valves', 'selection retained');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'm-name');
});

await check('invalid email and zero quantity are rejected with messages', async () => {
  await fillContact('m', { email: 'not-an-email' });
  await m('industry').selectOption('Dairy');
  await m('description').fill('TEST RECORD — 2 inch ball valves, SS316, PN40.');
  await m('quantity').fill('0');
  await m('unit').selectOption('Pieces');
  await page.click('#enquiry-modal [data-submit]');
  assert.match(await page.locator('#enquiry-modal [data-field="email"] .field-msg').textContent(), /valid email/);
  assert.match(await page.locator('#enquiry-modal [data-field="quantity"] .field-msg').textContent(), /greater than zero/);
  assert.equal(await m('description').inputValue(), 'TEST RECORD — 2 inch ball valves, SS316, PN40.', 'input preserved');
});

let firstRef = '';
await check('valid product enquiry is accepted by the backend and shows a reference (double-click safe)', async () => {
  await m('email').fill('e2e.test@example.com');
  await m('quantity').fill('12');
  const responses = [];
  page.on('response', (r) => { if (r.url().endsWith('/api/enquiries') && r.request().method() === 'POST') responses.push(r.status()); });
  await page.locator('#enquiry-modal [data-submit]').dblclick();
  await page.locator('#enquiry-modal [data-form-success]').waitFor({ state: 'visible' });
  firstRef = (await page.locator('#enquiry-modal [data-ref]').textContent()).trim();
  assert.match(firstRef, /^ASE-\d{8}-\d{4}$/);
  await page.waitForTimeout(300);
  assert.equal(responses.length, 1, `exactly one POST sent (got ${responses.length})`);
});

await check('Escape closes the modal and returns focus to the trigger', async () => {
  await page.keyboard.press('Escape');
  await modal.waitFor({ state: 'hidden' });
  // The dialog's "close" event is dispatched as a task after it hides, so wait for the handler to run.
  await page.waitForFunction(() => !document.documentElement.classList.contains('em-open'), null, { timeout: 2000 });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Enquire about Ball Valves');
});

await check('consultancy enquiry hides quantity fields and submits without a quantity', async () => {
  await page.goto(`${SITE}/services/industrial-audits.html`, { waitUntil: 'networkidle' });
  await page.click('.svc-aside a.btn-accent');
  await modal.waitFor({ state: 'visible' });
  assert.equal(await m('requirement').inputValue(), 'Industrial Audits');
  assert.equal(await page.locator('#enquiry-modal [data-field="quantity"]').isHidden(), true);
  assert.equal(await page.locator('#enquiry-modal [data-service-note]').isVisible(), true);
  await fillContact('m', { company: 'TEST — Audit Client' });
  await m('industry').selectOption('Textiles');
  await m('description').fill('TEST RECORD — steam and condensate audit for a dyeing unit, 2 boilers.');
  await page.click('#enquiry-modal [data-submit]');
  await page.locator('#enquiry-modal [data-form-success]').waitFor({ state: 'visible' });
});

await check('header "Request a Consultation" (Contact menu) opens the same modal', async () => {
  await page.keyboard.press('Escape');
  await page.hover('[data-menu]:nth-child(6) .nav-link');
  await page.click('[data-menu]:nth-child(6) .dropdown a[href="/contact.html#enquiry"]');
  await modal.waitFor({ state: 'visible' });
  assert.equal(await page.locator('#enquiry-modal [data-form-success]').isHidden(), true, 'form view reset after success');
  await page.keyboard.press('Escape');
});

await check('backend failure shows an error, keeps input, and no success is shown', async () => {
  await page.route(`${API}/api/enquiries`, (r) => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'We could not record your enquiry right now. Nothing was saved — please try again shortly.' }) }));
  await page.click('.cta-band a.btn-accent');
  await modal.waitFor({ state: 'visible' });
  await fillContact('m', { company: 'TEST — Failure Case' });
  await m('industry').selectOption('Dairy');
  await m('requirement').selectOption('Steam Engineering');
  await m('description').fill('TEST RECORD — this submission must fail.');
  await page.click('#enquiry-modal [data-submit]');
  await page.locator('#enquiry-modal [data-form-error]').waitFor({ state: 'visible' });
  assert.match(await page.locator('#enquiry-modal [data-form-error]').textContent(), /Nothing was saved/);
  assert.equal(await page.locator('#enquiry-modal [data-form-success]').isHidden(), true);
  assert.equal(await m('company').inputValue(), 'TEST — Failure Case');
  await page.unroute(`${API}/api/enquiries`);
  await page.keyboard.press('Escape');
});

await check('contact page uses the same form inline, pre-filled from the link', async () => {
  await page.goto(`${SITE}/contact.html?service=boiler-systems#enquiry`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#c-requirement').inputValue(), 'Boiler Systems');
  assert.equal(await modal.isHidden(), true);
});

await check('mobile: modal fills the screen and the page does not scroll sideways', async () => {
  const mp = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
  await mp.goto(`${SITE}/products.html`, { waitUntil: 'networkidle' });
  await mp.locator('.prod-card a[aria-label="Enquire about Steam Traps"]').tap();
  await mp.locator('#enquiry-modal').waitFor({ state: 'visible' });
  await mp.waitForTimeout(400); // let the open animation finish
  const box = await mp.locator('#enquiry-modal').boundingBox();
  assert.ok(box.width >= 389 && box.height >= 800, `modal ${box.width}x${box.height}`);
  assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mp.close();
});

await check('admin dashboard: login, see the enquiries, update status, export .xlsx', async () => {
  const ap = await (await browser.newContext({ acceptDownloads: true })).newPage();
  await ap.goto(`${API}/admin/`);
  await ap.fill('#username', process.env.ADMIN_USER || 'admin');
  await ap.fill('#password', process.env.ADMIN_PASS || '');
  await ap.click('#login-form button[type=submit]');
  await ap.locator('#app-view').waitFor({ state: 'visible' });
  await ap.locator('#rows tr').first().waitFor();
  assert.ok(await ap.locator('#rows tr').count() >= 2);
  await ap.click(`#rows button:text("${firstRef}")`);
  await ap.selectOption('#d-status', 'Contacted');
  await ap.fill('#d-remarks', 'TEST — called the customer');
  await ap.click('#d-form button[type=submit]');
  await ap.locator('#d-saved:text("Saved.")').waitFor();
  await ap.keyboard.press('Escape');
  const [dl] = await Promise.all([ap.waitForEvent('download'), ap.click('#export')]);
  assert.match(dl.suggestedFilename(), /^ASECON-Enquiries-.*\.xlsx$/);
  await ap.screenshot({ path: process.env.ADMIN_SHOT || '/tmp/admin.png', fullPage: true });
  await ap.close();
});

await check('no JavaScript errors on the pages', async () => { assert.deepEqual(pageErrors, []); });

await browser.close();
for (const r of results) console.log(r.join(' — '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
