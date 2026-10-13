// Excel register: builds an .xlsx workbook with a structured table named "Enquiries".
import { renameSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import ExcelJS from 'exceljs';
import { COLUMNS, rowValues } from './columns.mjs';
import { options } from './validate.mjs';

export async function buildWorkbook(rows, { title = 'ASECON Enquiry Register' } = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ASECON enquiry system';
  wb.title = title;
  wb.created = new Date();
  const ws = wb.addWorksheet('Enquiries', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map((c) => ({ key: c.header, width: c.width }));
  ws.addTable({
    name: 'Enquiries',
    ref: 'A1',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: COLUMNS.map((c) => ({ name: c.header, filterButton: true })),
    // ExcelJS needs at least one row to write a valid table; an empty register gets one blank row.
    rows: rows.length ? rows.map(rowValues) : [COLUMNS.map(() => '')],
  });
  const statusCol = COLUMNS.findIndex((c) => c.header === 'Status') + 1;
  const last = Math.max(rows.length, 1) + 1;
  for (let r = 2; r <= last; r++) {
    ws.getCell(r, statusCol).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${options.statuses.join(',')}"`] };
    for (const i of [9, 15, 17]) ws.getCell(r, i).alignment = { wrapText: true, vertical: 'top' };
  }
  ws.getRow(1).font = { bold: true };
  return wb;
}

export async function workbookBuffer(rows, opts) {
  const wb = await buildWorkbook(rows, opts);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// Rewrite the on-disk register atomically (temp file + rename) so a crash never leaves a half-written file.
// If the file is locked (e.g. open in Excel on Windows) the write fails, is logged and retried on the next change.
export async function writeRegister(path, rows) {
  mkdirSync(dirname(path), { recursive: true });
  const buf = await workbookBuffer(rows);
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, buf);
  renameSync(tmp, path);
}
