// ASECON enquiry system (browser side).
// One reusable form, rendered in the site-wide modal and inline on the Contact page.
// Success is shown ONLY after the backend confirms acceptance; on any failure the visitor's input is kept.

const API = (document.querySelector('meta[name="asecon-enquiry-api"]')?.content || '').replace(/\/$/, '');
const FALLBACK = document.querySelector('meta[name="asecon-enquiry-fallback"]')?.content || '';
const DATA = (() => { try { return JSON.parse(document.getElementById('enquiry-data').textContent); } catch { return { kinds: {}, serviceSlugs: {} }; } })();
const TIMEOUT_MS = 20000;

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''));
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

function setupForm(form) {
  const root = form.parentElement;
  const success = root.querySelector('[data-form-success]');
  const banner = form.querySelector('[data-form-error]');
  const submitBtn = form.querySelector('[data-submit]');
  const serviceNote = form.querySelector('[data-service-note]');
  const el = (name) => form.elements.namedItem(name);
  const fieldBox = (name) => form.querySelector(`[data-field="${name}"]`);
  let busy = false;

  const kind = () => DATA.kinds[el('requirement').value] || null;

  function show(name, on) {
    const box = fieldBox(name);
    if (!box) return;
    box.hidden = !on;
    box.querySelectorAll('input, select, textarea').forEach((c) => { c.disabled = !on; });
    if (!on) clearError(name);
  }

  // Show/hide conditional and product-only fields.
  function sync() {
    const k = kind();
    const isService = k === 'service';
    show('industryOther', el('industry').value === 'Other');
    show('requirementOther', el('requirement').value.startsWith('Other'));
    ['quantity', 'unit', 'brand', 'material'].forEach((n) => show(n, !isService));
    show('unitOther', !isService && el('unit').value === 'Other');
    el('quantity').required = !isService;
    el('unit').required = !isService;
    serviceNote.hidden = !isService;
  }

  function clearError(name) {
    const box = fieldBox(name);
    if (!box) return;
    box.classList.remove('invalid');
    const c = box.querySelector('input, select, textarea');
    if (c) {
      c.removeAttribute('aria-invalid');
      const hint = box.querySelector('.field-hint');
      if (hint) c.setAttribute('aria-describedby', hint.id); else c.removeAttribute('aria-describedby');
    }
    box.querySelector('.field-msg')?.remove();
  }

  function setError(name, msg) {
    const box = fieldBox(name);
    if (!box || box.hidden) return false;
    const c = box.querySelector('input, select, textarea');
    box.classList.add('invalid');
    let m = box.querySelector('.field-msg');
    if (!m) { m = document.createElement('p'); m.className = 'field-msg'; m.id = `${c.id}-msg`; box.append(m); }
    m.textContent = msg;
    c.setAttribute('aria-invalid', 'true');
    const hint = box.querySelector('.field-hint');
    c.setAttribute('aria-describedby', hint ? `${m.id} ${hint.id}` : m.id);
    return true;
  }

  function validate() {
    const e = {};
    const v = (n) => (el(n).value || '').trim();
    if (v('name').length < 2) e.name = 'Enter your full name.';
    if (v('company').length < 2) e.company = 'Enter your company name.';
    if (!EMAIL.test(v('email'))) e.email = 'Enter a valid email address, for example name@company.com.';
    const digits = v('phone').replace(/\D/g, '');
    if (!/^[0-9+()\-.\s]+$/.test(v('phone')) || digits.length < 7 || digits.length > 15) e.phone = 'Enter a valid phone number (7–15 digits).';
    if (!v('industry')) e.industry = 'Select your industry.';
    else if (v('industry') === 'Other' && v('industryOther').length < 2) e.industryOther = 'Tell us your industry.';
    if (!v('requirement')) e.requirement = 'Select the product or service you need.';
    else if (v('requirement').startsWith('Other') && v('requirementOther').length < 2) e.requirementOther = 'Describe the product or service you need.';
    if (v('description').length < 10) e.description = 'Describe your requirement and specifications (at least 10 characters).';
    if (kind() === 'product') {
      const q = Number(v('quantity'));
      if (v('quantity') === '' || !Number.isFinite(q) || q <= 0) e.quantity = 'Enter a quantity greater than zero.';
      if (!v('unit')) e.unit = 'Select a unit.';
      else if (v('unit') === 'Other' && !v('unitOther')) e.unitOther = 'Enter the unit.';
    }
    return e;
  }

  function showErrors(errors, message) {
    Object.keys(errors).forEach((n) => setError(n, errors[n]));
    const first = Object.keys(errors).map(fieldBox).filter((b) => b && !b.hidden)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[0];
    showBanner(message || 'Please correct the highlighted fields.');
    first?.querySelector('input, select, textarea')?.focus();
  }

  function showBanner(msg) { banner.textContent = msg; banner.hidden = !msg; }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.setAttribute('aria-busy', String(on));
    submitBtn.querySelector('.btn-label').textContent = on ? 'Sending…' : 'Send enquiry';
    form.classList.toggle('is-busy', on);
  }

  function payload() {
    const out = {};
    new FormData(form).forEach((val, key) => { if (!['form-name', 'reference'].includes(key)) out[key] = typeof val === 'string' ? val.trim() : val; });
    return out;
  }

  async function submitToApi(body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API}/api/enquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal, credentials: 'omit' });
      let j = {};
      try { j = await res.json(); } catch { /* non-JSON error page */ }
      if (res.ok && j.ok && j.enquiryId) return { ok: true, ref: j.enquiryId };
      if (res.status === 422 && j.fields) return { ok: false, fields: j.fields, message: j.error };
      return { ok: false, message: j.error || `Our enquiry system returned an error (${res.status}). Your details are still here — please try again.` };
    } finally { clearTimeout(t); }
  }

  // Netlify Forms fallback (only when no backend URL is configured and the build enabled it).
  async function submitToNetlify(body) {
    const ref = `WEB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${body.idempotencyKey.slice(0, 6).toUpperCase()}`;
    el('reference').value = ref;
    const fd = new URLSearchParams(new FormData(form));
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fd.toString() });
    if (!res.ok) return { ok: false, message: 'Our enquiry system is not available right now. Your details are still here — please try again later.' };
    return { ok: true, ref };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return; // double-click / double-submit guard
    form.querySelectorAll('.field.invalid').forEach((b) => clearError(b.dataset.field));
    showBanner('');
    const errors = validate();
    if (Object.keys(errors).length) { showErrors(errors); return; }
    if (!el('idempotencyKey').value) el('idempotencyKey').value = uuid();
    el('sourceUrl').value = `${location.origin}${location.pathname}${location.search}`;
    if (!API && FALLBACK !== 'netlify') {
      showBanner('Online enquiries are not connected yet. Your details have not been sent — please contact us directly.');
      return;
    }
    setBusy(true);
    let result;
    try {
      result = API ? await submitToApi(payload()) : await submitToNetlify(payload());
    } catch (err) {
      result = { ok: false, message: err.name === 'AbortError'
        ? 'The request timed out before we could confirm your enquiry. Please try again — you won’t create a duplicate.'
        : 'We couldn’t reach our enquiry system. Check your connection and try again — your details are still here.' };
    } finally { setBusy(false); }
    if (!result.ok) { if (result.fields) showErrors(result.fields, result.message); else showBanner(result.message); return; }

    // Confirmed by the backend: show the reference, then reset for a possible next enquiry.
    success.querySelector('[data-ref]').textContent = result.ref;
    form.hidden = true;
    success.hidden = false;
    success.focus();
    form.reset();
    el('idempotencyKey').value = '';
    sync();
    form.dispatchEvent(new CustomEvent('enquiry:sent', { bubbles: true, detail: { ref: result.ref } }));
  });

  form.addEventListener('input', (e) => { const box = e.target.closest('[data-field]'); if (box?.classList.contains('invalid')) clearError(box.dataset.field); });
  form.addEventListener('change', (e) => { if (['industry', 'requirement', 'unit'].includes(e.target.name)) sync(); const box = e.target.closest('[data-field]'); if (box?.classList.contains('invalid')) clearError(box.dataset.field); });
  success.querySelector('[data-new-enquiry]').addEventListener('click', () => resetView(true));

  function resetView(focusFirst) {
    success.hidden = true;
    form.hidden = false;
    showBanner('');
    if (focusFirst) el('name').focus();
  }

  function prefill({ requirement } = {}) {
    if (requirement && DATA.kinds[requirement]) el('requirement').value = requirement;
    sync();
  }

  function focusFirstEmpty() {
    const order = ['name', 'company', 'email', 'phone', 'industry', 'requirement', 'description'];
    const n = order.find((x) => !el(x).value.trim()) || 'name';
    el(n).focus();
  }

  sync();
  return { form, prefill, resetView, focusFirstEmpty, isSuccess: () => !success.hidden };
}

// ---------- prefill from links: /contact.html?product=Ball%20Valves#enquiry, ?service=boiler-systems#enquiry
function prefillFrom(params) {
  const product = params.get('product');
  const service = params.get('service');
  const requirement = (product && DATA.kinds[product] && product) || (service && DATA.serviceSlugs[service]) || '';
  return { requirement };
}

const forms = [...document.querySelectorAll('[data-enquiry-form]')].map(setupForm);
const modal = document.querySelector('[data-enquiry-modal]');
const modalForm = forms.find((f) => modal?.contains(f.form));
const inlineForm = forms.find((f) => !modal?.contains(f.form));
let lastTrigger = null;

function openModal(trigger, data) {
  if (!modal || !modalForm) return false;
  document.querySelectorAll('dialog[open]').forEach((d) => { if (d !== modal) d.close(); });
  lastTrigger = trigger;
  if (modalForm.isSuccess()) modalForm.resetView(false);
  modalForm.prefill(data);
  const ctx = modal.querySelector('[data-enquiry-context]');
  ctx.textContent = data.requirement ? `Enquiry about: ${data.requirement}` : '';
  ctx.hidden = !data.requirement;
  document.documentElement.classList.add('em-open');
  modal.showModal();
  modalForm.focusFirstEmpty();
  return true;
}

if (modal) {
  modal.querySelector('[data-enquiry-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); }); // backdrop click
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('em-open');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  });
}

// Any "#enquiry" link (Request a Consultation, Enquire, Request a quote…) or [data-enquire] opens the form.
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href], [data-enquire]');
  if (!a || a.hasAttribute('data-no-modal')) return;
  let data;
  if (a.hasAttribute('data-enquire')) data = { requirement: a.getAttribute('data-enquire') || '' };
  else {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\/contact(\.html)?$/.test(url.pathname) || url.hash !== '#enquiry') return;
    data = prefillFrom(url.searchParams);
  }
  if (inlineForm) {
    // On the Contact page, use the inline form instead of a modal.
    e.preventDefault();
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    if (inlineForm.isSuccess()) inlineForm.resetView(false);
    inlineForm.prefill(data);
    document.getElementById('enquiry')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    inlineForm.focusFirstEmpty();
    return;
  }
  if (openModal(a, data)) e.preventDefault();
});

// Contact page opened with ?product= / ?service= (e.g. from search results or no-JS links)
if (inlineForm) {
  inlineForm.prefill(prefillFrom(new URLSearchParams(location.search)));
}
