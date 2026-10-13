// Register columns, in order. Shared by the .xlsx export, Microsoft Excel and Google Sheets sync.
const productOrService = (r) => (r.requirement_other ? `${r.requirement}: ${r.requirement_other}` : r.requirement);
const industry = (r) => (r.industry_other ? `Other: ${r.industry_other}` : r.industry);
const unit = (r) => (r.unit === 'Other' && r.unit_other ? `Other: ${r.unit_other}` : r.unit || '');

export const COLUMNS = [
  { header: 'Enquiry ID', width: 18, get: (r) => r.enquiry_id },
  { header: 'Submitted', width: 18, get: (r) => r.created_local },
  { header: 'Contact Name', width: 22, get: (r) => r.name },
  { header: 'Company', width: 26, get: (r) => r.company },
  { header: 'Email', width: 28, get: (r) => r.email },
  { header: 'Phone', width: 16, get: (r) => r.phone },
  { header: 'Industry', width: 22, get: industry },
  { header: 'Product / Service', width: 30, get: productOrService },
  { header: 'Description & Specifications', width: 50, get: (r) => r.description },
  { header: 'Quantity', width: 10, get: (r) => (r.quantity === null || r.quantity === undefined ? '' : r.quantity) },
  { header: 'Unit', width: 12, get: unit },
  { header: 'Preferred Brand', width: 18, get: (r) => r.brand || '' },
  { header: 'Preferred Material', width: 18, get: (r) => r.material || '' },
  { header: 'Delivery Timeline', width: 18, get: (r) => r.timeline || '' },
  { header: 'Additional Notes', width: 40, get: (r) => r.notes || '' },
  { header: 'Status', width: 14, get: (r) => r.status },
  { header: 'Internal Remarks', width: 36, get: (r) => r.remarks || '' },
  { header: 'Source Page', width: 36, get: (r) => r.source_url || '' },
];

export const rowValues = (r) => COLUMNS.map((c) => c.get(r));
