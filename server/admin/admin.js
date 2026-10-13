// ASECON enquiry dashboard. All data comes from /admin/api (session cookie, same origin).
// Rendering uses textContent only — enquiry text is never interpreted as HTML.
const $ = (s) => document.querySelector(s);
const api = async (path, opts = {}) => {
  const res = await fetch(`/admin/api/${path}`, { credentials: 'same-origin', ...opts, headers: { 'X-ASECON-Admin': '1', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } });
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (res.status === 401 && path !== 'login') showLogin();
  return { ok: res.ok, status: res.status, data };
};
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
const fillSelect = (sel, values, keepFirst = true) => { if (!keepFirst) sel.textContent = ''; values.forEach((v) => sel.append(new Option(v, v))); };

let options = null;
let rows = [];
let current = null;

const SYNC_LABEL = { not_configured: '—', pending: 'Pending', retrying: 'Retrying', synced: 'Synced', failed: 'Failed' };
const SYNC_LABEL_LONG = { not_configured: 'Recorded in the database and the server Excel register. No live spreadsheet service is configured.', pending: 'Recorded; waiting to sync to the live spreadsheet.', retrying: 'Recorded; the spreadsheet service failed — retrying automatically.', synced: 'Recorded and synced to the live spreadsheet.', failed: 'Recorded, but syncing to the live spreadsheet failed repeatedly. Use “Retry spreadsheet sync”.' };

function showLogin() {
  $('#app-view').hidden = true; $('#who').hidden = true; $('#login-view').hidden = false;
  $('#username').focus();
}

async function boot() {
  const r = await api('session');
  if (!r.ok) return showLogin();
  options = r.data.options;
  $('#login-view').hidden = true; $('#app-view').hidden = false; $('#who').hidden = false;
  $('#user').textContent = r.data.user;
  fillSelect($('#f-industry'), options.industries);
  fillSelect($('#f-status'), options.statuses);
  options.requirementGroups.forEach((g) => { const og = document.createElement('optgroup'); og.label = g.label; g.options.forEach((o) => og.append(new Option(o, o))); $('#f-product').append(og); });
  fillSelect($('#d-status'), options.statuses, false);
  $('#s-sync').textContent = r.data.sync === 'none' ? 'Not connected' : r.data.sync === 'microsoft' ? 'Microsoft Excel' : 'Google Sheets';
  $('#s-notify').textContent = r.data.notifications ? 'On' : 'Off';
  $('#retry-sync').hidden = r.data.sync === 'none';
  const n = $('#notices'); n.textContent = '';
  r.data.problems.forEach((p) => n.append(el('p', p, 'notice')));
  await load();
  if (location.hash.length > 1) openDetail(decodeURIComponent(location.hash.slice(1)));
}

function filterParams() {
  const p = new URLSearchParams();
  new FormData($('#filters')).forEach((v, k) => { if (v) p.set(k, v); });
  return p;
}

async function load() {
  const p = filterParams();
  $('#export').href = `/admin/api/export.xlsx${p.toString() ? `?${p}` : ''}`;
  const r = await api(`enquiries?${p}`);
  if (!r.ok) return;
  rows = r.data.enquiries;
  const s = r.data.stats;
  $('#s-total').textContent = s.total;
  $('#s-new').textContent = s.new;
  if (s.syncFailed) $('#notices').append(el('p', `${s.syncFailed} enquiry(ies) failed to sync to the spreadsheet. They are safe in the database — use “Retry spreadsheet sync”.`, 'notice'));
  render();
}

function render() {
  const tb = $('#rows'); tb.textContent = '';
  $('#empty').hidden = rows.length > 0;
  for (const r of rows) {
    const tr = document.createElement('tr');
    if (r.status === 'New') tr.className = 'is-new';
    const idCell = el('td'); const btn = el('button', r.enquiry_id, 'link'); btn.type = 'button'; btn.addEventListener('click', () => openDetail(r.enquiry_id)); idCell.append(btn);
    tr.append(idCell, el('td', r.created_local), el('td', r.company), el('td', r.name), el('td', r.industry_other ? `Other: ${r.industry_other}` : r.industry),
      el('td', r.requirement_other ? `${r.requirement}: ${r.requirement_other}` : r.requirement), el('td', r.quantity === null ? '—' : `${r.quantity} ${r.unit === 'Other' ? r.unit_other : r.unit}`));
    const st = el('td'); st.append(el('span', r.status, `pill pill-${r.status.toLowerCase().replace(/\s+/g, '-')}`)); tr.append(st);
    const sy = el('td', SYNC_LABEL[r.sync_status] || r.sync_status, `sync sync-${r.sync_status}`); sy.title = SYNC_LABEL_LONG[r.sync_status] || ''; tr.append(sy);
    tb.append(tr);
  }
}

const FIELDS = [
  ['Enquiry ID', 'enquiry_id'], ['Submitted', 'created_local'], ['Contact', 'name'], ['Company', 'company'], ['Email', 'email'], ['Phone', 'phone'],
  ['Industry', (r) => (r.industry_other ? `Other: ${r.industry_other}` : r.industry)],
  ['Product / service', (r) => (r.requirement_other ? `${r.requirement}: ${r.requirement_other}` : r.requirement)],
  ['Description & specifications', 'description'],
  ['Quantity', (r) => (r.quantity === null ? '—' : `${r.quantity} ${r.unit === 'Other' ? r.unit_other : r.unit}`)],
  ['Preferred brand', 'brand'], ['Preferred material', 'material'], ['Delivery timeline', 'timeline'], ['Additional notes', 'notes'],
  ['Source page', 'source_url'], ['Spreadsheet', (r) => SYNC_LABEL_LONG[r.sync_status] + (r.sync_error ? ` Last error: ${r.sync_error}` : '')],
];

async function openDetail(id) {
  const r = await api(`enquiries/${encodeURIComponent(id)}`);
  if (!r.ok) return;
  current = r.data.enquiry;
  $('#d-title').textContent = `${current.enquiry_id} — ${current.company}`;
  const dl = $('#d-fields'); dl.textContent = '';
  for (const [label, key] of FIELDS) {
    const val = typeof key === 'function' ? key(current) : current[key];
    dl.append(el('dt', label), el('dd', val === '' || val === null || val === undefined ? '—' : String(val)));
  }
  $('#d-status').value = current.status;
  $('#d-remarks').value = current.remarks;
  $('#d-error').hidden = true; $('#d-saved').textContent = '';
  history.replaceState(null, '', `#${encodeURIComponent(current.enquiry_id)}`);
  $('#detail').showModal();
}

$('#detail').addEventListener('close', () => history.replaceState(null, '', location.pathname));

$('#d-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await api(`enquiries/${encodeURIComponent(current.enquiry_id)}`, { method: 'PATCH', body: JSON.stringify({ status: $('#d-status').value, remarks: $('#d-remarks').value }) });
  if (!r.ok) { $('#d-error').textContent = r.data.error || 'Could not save.'; $('#d-error').hidden = false; return; }
  current = r.data.enquiry;
  $('#d-saved').textContent = 'Saved.';
  load();
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await api('login', { method: 'POST', body: JSON.stringify({ username: $('#username').value, password: $('#password').value }) });
  if (!r.ok) { $('#login-error').textContent = r.data.error || 'Sign-in failed.'; $('#login-error').hidden = false; return; }
  $('#password').value = '';
  boot();
});

$('#logout').addEventListener('click', async () => { await api('logout', { method: 'POST' }); showLogin(); });
$('#filters').addEventListener('submit', (e) => { e.preventDefault(); load(); });
$('#filters').addEventListener('reset', () => setTimeout(load, 0));
$('#retry-sync').addEventListener('click', async () => {
  const r = await api('sync/retry', { method: 'POST' });
  $('#notices').append(el('p', r.ok ? `Retried ${r.data.requeued} pending sync job(s).` : r.data.error || 'Retry failed.', 'notice'));
  load();
});

boot();
