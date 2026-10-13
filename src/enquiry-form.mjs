// Reusable enquiry form. Rendered once inside the site-wide modal and once inline on the Contact page;
// js/enquiry.js powers every instance (validation, prefill, submission, states).
import { enquiryOptions, requirementKind } from './enquiry-options.mjs';
import { services } from './site.config.mjs';
import { esc, icon } from './layout.mjs';

const opt = (v, label = v) => `<option value="${esc(v)}">${esc(label)}</option>`;

// Data the browser needs: which requirements are products (quantity needed) and service slug → title.
export const enquiryClientData = () => JSON.stringify({
  kinds: Object.fromEntries(enquiryOptions.requirementGroups.flatMap((g) => g.options.map((o) => [o, requirementKind(o)]))),
  serviceSlugs: { ...Object.fromEntries(services.map((s) => [s.slug, s.title])), 'industrial-audits': 'Industrial Audits' },
}).replace(/</g, '\\u003c');

export function enquiryForm(p, { inline = false } = {}) {
  const f = (name) => `${p}-${name}`;
  const field = (name, label, control, { req = false, full = false, hint = '', cls = '' } = {}) => `
      <div class="field${full ? ' field-full' : ''}${cls ? ` ${cls}` : ''}" data-field="${name}">
        <label for="${f(name)}">${label}${req ? ' <span aria-hidden="true">*</span>' : ' <span class="opt">(optional)</span>'}</label>
        ${control}
        ${hint ? `<p class="field-hint" id="${f(name)}-hint">${hint}</p>` : ''}
      </div>`;
  const input = (name, attrs = '') => `<input id="${f(name)}" name="${name}" ${attrs}>`;
  const reqGroups = enquiryOptions.requirementGroups.map((g) => `<optgroup label="${esc(g.label)}">${g.options.map((o) => opt(o)).join('')}</optgroup>`).join('');

  return `
<form class="enquiry-form${inline ? ' enquiry-form-inline' : ''}" name="enquiry" method="POST" action="/thank-you.html" data-netlify="true" netlify-honeypot="website" data-enquiry-form novalidate>
  <input type="hidden" name="form-name" value="enquiry">
  <input type="hidden" name="idempotencyKey" value="">
  <input type="hidden" name="sourceUrl" value="">
  <input type="hidden" name="reference" value="">
  <p class="hp" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></p>
  <p class="form-banner" role="alert" hidden data-form-error></p>

  <fieldset class="ef-group">
    <legend>Your details</legend>
    <div class="form-grid">
      ${field('name', 'Full name', input('name', 'autocomplete="name" required maxlength="120"'), { req: true })}
      ${field('company', 'Company', input('company', 'autocomplete="organization" required maxlength="160"'), { req: true })}
      ${field('email', 'Company email', input('email', 'type="email" autocomplete="email" required maxlength="160"'), { req: true })}
      ${field('phone', 'Phone', input('phone', 'type="tel" autocomplete="tel" required maxlength="30" inputmode="tel"'), { req: true })}
      ${field('industry', 'Industry', `<select id="${f('industry')}" name="industry" required><option value="">Select your industry</option>${enquiryOptions.industries.map((o) => opt(o)).join('')}</select>`, { req: true })}
      ${field('industryOther', 'Your industry', input('industryOther', 'maxlength="80"'), { req: true, cls: 'is-conditional' })}
    </div>
  </fieldset>

  <fieldset class="ef-group">
    <legend>Your requirement</legend>
    <div class="form-grid">
      ${field('requirement', 'Product or service required', `<select id="${f('requirement')}" name="requirement" required><option value="">Select a product or service</option>${reqGroups}</select>`, { req: true, full: true })}
      ${field('requirementOther', 'Describe the product or service', input('requirementOther', 'maxlength="160"'), { req: true, full: true, cls: 'is-conditional' })}
      ${field('description', 'Description &amp; technical specifications', `<textarea id="${f('description')}" name="description" rows="4" maxlength="4000" required aria-describedby="${f('description')}-hint"></textarea>`, { req: true, full: true, hint: 'Size, pressure and temperature rating, end connections, standards, or the problem you want solved.' })}
      ${field('quantity', 'Quantity', input('quantity', 'type="number" min="0" step="any" inputmode="decimal"'), { req: true, cls: 'product-only' })}
      ${field('unit', 'Unit', `<select id="${f('unit')}" name="unit"><option value="">Select unit</option>${enquiryOptions.units.map((o) => opt(o)).join('')}</select>`, { req: true, cls: 'product-only' })}
      ${field('unitOther', 'Specify unit', input('unitOther', 'maxlength="40"'), { req: true, cls: 'is-conditional product-only' })}
      ${field('brand', 'Preferred brand / manufacturer', input('brand', 'maxlength="120"'), { cls: 'product-only' })}
      ${field('material', 'Preferred material / grade', input('material', 'maxlength="120" placeholder="e.g. SS316, WCB, CI"'), { cls: 'product-only' })}
      ${field('timeline', 'Required delivery / start', `<select id="${f('timeline')}" name="timeline"><option value="">Select timeline</option>${enquiryOptions.timelines.map((o) => opt(o)).join('')}</select>`)}
      ${field('notes', 'Additional notes or special requirements', `<textarea id="${f('notes')}" name="notes" rows="3" maxlength="2000"></textarea>`, { full: true })}
    </div>
    <p class="service-note" hidden data-service-note>${icon('check')} Consultancy and audit enquiries don’t need a quantity — tell us about your plant and objectives in the description.</p>
  </fieldset>

  <div class="ef-actions">
    <button class="btn btn-accent btn-lg" type="submit" data-submit><span class="btn-label">Send enquiry</span> ${icon('arrow')}</button>
    <p class="small muted">Fields marked * are required. We use your details only to respond to this enquiry.</p>
  </div>
</form>
<div class="enquiry-success" hidden data-form-success tabindex="-1">
  <span class="success-icon">${icon('check')}</span>
  <h2 class="h3">Thank you — your enquiry has been received.</h2>
  <p>Your reference number is <strong class="ref" data-ref></strong>. Please quote it in any correspondence.</p>
  <p class="muted" data-success-note>An ASECON engineer will review your requirement and contact you.</p>
  <button type="button" class="btn btn-outline" data-new-enquiry>Send another enquiry</button>
</div>`;
}

export const enquiryModal = () => `
<dialog class="enquiry-modal" id="enquiry-modal" aria-labelledby="enquiry-modal-title" data-enquiry-modal>
  <div class="em-head">
    <div>
      <p class="eyebrow">Enquiry</p>
      <h2 id="enquiry-modal-title">Request a quote or consultation</h2>
      <p class="em-context" data-enquiry-context hidden></p>
    </div>
    <button type="button" class="em-close" aria-label="Close enquiry form" data-enquiry-close>${icon('close')}</button>
  </div>
  <div class="em-body">${enquiryForm('m')}</div>
</dialog>
<script type="application/json" id="enquiry-data">${enquiryClientData()}</script>`;
