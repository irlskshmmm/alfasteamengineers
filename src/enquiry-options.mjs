// Single source of truth for the enquiry form's choice lists.
// Built from the site's real content (industries, products, services) so the form,
// the server-side validator and the Excel register always agree.
// tools/build.mjs writes this to server/src/enquiry-options.json for the backend.
import { industries, products, productCategories, services } from './site.config.mjs';

const extraProducts = {
  steam: ['Condensate Recovery Equipment'],
  boiler: ['Boiler Accessories', 'Pipes & Fittings'],
};

export const enquiryOptions = {
  industries: [...industries.map((i) => i.name), 'Other'],
  requirementGroups: [
    ...productCategories.map((c) => ({
      label: c.label,
      kind: 'product',
      options: [...products.filter((p) => p.cat === c.key).map((p) => p.name), ...(extraProducts[c.key] || [])],
    })),
    { label: 'Engineering services', kind: 'service', options: [...services.map((s) => s.title), 'Technical Support & Troubleshooting'] },
    { label: 'Other', kind: 'other', options: ['Other product', 'Other service'] },
  ],
  units: ['Pieces', 'Sets', 'Metres', 'Kilograms', 'Lots', 'Other'],
  timelines: ['Urgent (within 1 week)', 'Within 2 weeks', 'Within 1 month', '1–3 months', 'More than 3 months', 'Not decided yet'],
  statuses: ['New', 'Contacted', 'Quotation Sent', 'Won', 'Lost', 'Closed'],
};

// Map a requirement to its kind: 'product' needs a quantity; 'service' does not.
export const requirementKind = (value) => {
  if (value === 'Other product') return 'product';
  if (value === 'Other service') return 'service';
  const g = enquiryOptions.requirementGroups.find((grp) => grp.options.includes(value));
  return g ? g.kind : null;
};
