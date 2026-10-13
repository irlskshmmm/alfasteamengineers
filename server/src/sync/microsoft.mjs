// Microsoft 365 Excel (OneDrive / SharePoint) via Microsoft Graph, app-only (client credentials).
// The workbook must contain a table named MS_TABLE_NAME (default "Enquiries") with the register columns —
// generate a starter file with `npm run make-template` and upload it to OneDrive/SharePoint.
import { rowValues } from '../columns.mjs';

// Excel evaluates values that start with = + - @ as formulas; prefix them so user input stays plain text.
export const excelSafe = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

export function microsoftAdapter(cfg, fetchImpl = fetch) {
  let token = null;
  let tokenExp = 0;
  const tokenUrl = cfg.tokenUrl || `https://login.microsoftonline.com/${encodeURIComponent(cfg.tenantId)}/oauth2/v2.0/token`;
  const table = `${cfg.workbookUrl}/workbook/tables/${encodeURIComponent(cfg.tableName)}`;

  async function getToken() {
    if (token && Date.now() < tokenExp - 60_000) return token;
    const res = await fetchImpl(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
    });
    if (!res.ok) throw new Error(`Microsoft sign-in failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    token = j.access_token;
    tokenExp = Date.now() + (j.expires_in || 3600) * 1000;
    return token;
  }

  async function call(method, url, body) {
    const res = await fetchImpl(url, {
      method,
      headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Microsoft Graph ${method} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
  }

  async function findIndex(enquiryId) {
    // Enquiry ID is the table's first column.
    const j = await call('GET', `${table}/columns/itemAt(index=0)/dataBodyRange?$select=values`);
    const values = (j && j.values) || [];
    return values.findIndex((r) => r[0] === enquiryId);
  }

  return {
    name: 'microsoft',
    async append(row) {
      // Idempotent: if a previous attempt reached Excel but the response was lost, don't add a second row.
      if ((await findIndex(row.enquiry_id)) >= 0) return this.update(row);
      await call('POST', `${table}/rows/add`, { index: null, values: [rowValues(row).map(excelSafe)] });
    },
    async update(row) {
      const i = await findIndex(row.enquiry_id);
      if (i < 0) throw new Error(`Row ${row.enquiry_id} not found in the Excel table yet.`);
      await call('PATCH', `${table}/rows/itemAt(index=${i})`, { values: [rowValues(row).map(excelSafe)] });
    },
  };
}
