// Writes an empty register workbook (table "Enquiries" with all columns) to upload to
// OneDrive/SharePoint for Microsoft Excel sync, or to import into Google Sheets.
import { writeFileSync } from 'node:fs';
import { workbookBuffer } from '../src/xlsx.mjs';

const out = process.argv[2] || 'ASECON-Enquiry-Register-template.xlsx';
writeFileSync(out, await workbookBuffer([]));
console.log(`Wrote ${out}`);
