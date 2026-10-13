// Server-side validation and sanitisation. The browser validates too, but this is the authority.
import { readFileSync } from 'node:fs';

export const options = JSON.parse(readFileSync(new URL('./enquiry-options.json', import.meta.url), 'utf8'));

const kindOf = (value) => {
  if (value === 'Other product') return 'product';
  if (value === 'Other service') return 'service';
  const g = options.requirementGroups.find((grp) => grp.options.includes(value));
  return g ? g.kind : null;
};

// Strip control characters (keep newlines/tabs in multi-line fields), normalise, trim, cap length.
export function clean(v, max, multiline = false) {
  if (v === undefined || v === null) return '';
  let s = String(v).normalize('NFC');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') : s.replace(/[\u0000-\u001F\u007F]/g, ' ');
  s = s.replace(/[​-‏‪-‮⁦-⁩]/g, '').trim();
  if (!multiline) s = s.replace(/\s{2,}/g, ' ');
  return s.slice(0, max);
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

export function validateEnquiry(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { form: 'Invalid request.' } };
  const v = {
    name: clean(input.name, 120),
    company: clean(input.company, 160),
    email: clean(input.email, 160).toLowerCase(),
    phone: clean(input.phone, 30),
    industry: clean(input.industry, 80),
    industryOther: clean(input.industryOther, 80),
    requirement: clean(input.requirement, 120),
    requirementOther: clean(input.requirementOther, 160),
    description: clean(input.description, 4000, true),
    quantity: null,
    unit: clean(input.unit, 20),
    unitOther: clean(input.unitOther, 40),
    brand: clean(input.brand, 120),
    material: clean(input.material, 120),
    timeline: clean(input.timeline, 60),
    notes: clean(input.notes, 2000, true),
    sourceUrl: clean(input.sourceUrl, 500),
    idempotencyKey: clean(input.idempotencyKey, 64),
  };

  if (clean(input.website, 200)) errors.form = 'Submission rejected.'; // honeypot
  if (!/^[A-Za-z0-9-]{16,64}$/.test(v.idempotencyKey)) errors.form = 'Invalid request. Please reload the page and try again.';

  if (v.name.length < 2) errors.name = 'Enter your full name.';
  if (v.company.length < 2) errors.company = 'Enter your company name.';
  if (!EMAIL.test(v.email)) errors.email = 'Enter a valid email address, for example name@company.com.';
  const digits = v.phone.replace(/\D/g, '');
  if (!/^[0-9+()\-.\s]+$/.test(v.phone) || digits.length < 7 || digits.length > 15) errors.phone = 'Enter a valid phone number (7–15 digits; +, spaces and dashes are fine).';

  if (!options.industries.includes(v.industry)) errors.industry = 'Select your industry.';
  else if (v.industry === 'Other' && v.industryOther.length < 2) errors.industryOther = 'Tell us your industry.';
  if (v.industry !== 'Other') v.industryOther = '';

  const kind = kindOf(v.requirement);
  if (!kind) errors.requirement = 'Select the product or service you need.';
  else if (v.requirement.startsWith('Other') && v.requirementOther.length < 2) errors.requirementOther = 'Describe the product or service you need.';
  if (!v.requirement.startsWith('Other')) v.requirementOther = '';
  v.kind = kind;

  if (v.description.length < 10) errors.description = 'Describe your requirement and specifications (at least 10 characters).';

  if (kind === 'product') {
    const raw = typeof input.quantity === 'number' ? input.quantity : clean(input.quantity, 20);
    const q = raw === '' ? NaN : Number(raw);
    if (!Number.isFinite(q) || q <= 0) errors.quantity = 'Enter a quantity greater than zero.';
    else if (q > 1e9) errors.quantity = 'Quantity is too large.';
    else v.quantity = Math.round(q * 1000) / 1000;
    if (!options.units.includes(v.unit)) errors.unit = 'Select a unit.';
    else if (v.unit === 'Other' && v.unitOther.length < 1) errors.unitOther = 'Enter the unit.';
  } else {
    // Consultancy / audit enquiries: no quantity, unit, brand or material.
    v.quantity = null; v.unit = ''; v.unitOther = ''; v.brand = ''; v.material = '';
  }
  if (v.unit !== 'Other') v.unitOther = '';

  if (v.timeline && !options.timelines.includes(v.timeline)) errors.timeline = 'Select a delivery timeline from the list.';
  if (v.sourceUrl && !/^https?:\/\/[^\s]+$/i.test(v.sourceUrl)) v.sourceUrl = '';

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: v };
}

export function validateUpdate(input) {
  const errors = {};
  const out = {};
  if (!input || typeof input !== 'object') return { ok: false, errors: { form: 'Invalid request.' } };
  if (input.status !== undefined) {
    if (!options.statuses.includes(input.status)) errors.status = 'Unknown status.';
    else out.status = input.status;
  }
  if (input.remarks !== undefined) out.remarks = clean(input.remarks, 2000, true);
  if (!Object.keys(out).length && !Object.keys(errors).length) errors.form = 'Nothing to update.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: out };
}
