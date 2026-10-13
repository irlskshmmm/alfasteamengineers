// All settings come from environment variables (see .env.example). No secrets live in code.
import { resolve } from 'node:path';

const bool = (v, d) => (v === undefined || v === '' ? d : /^(1|true|yes|on)$/i.test(v));
const int = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function loadConfig(env = process.env) {
  const dataDir = resolve(env.DATA_DIR || './data');
  const syncProvider = (env.SYNC_PROVIDER || 'none').toLowerCase();
  const cfg = {
    port: int(env.PORT, 8787),
    host: env.HOST || '0.0.0.0',
    dataDir,
    dbPath: resolve(env.DB_PATH || `${dataDir}/enquiries.sqlite`),
    registerPath: resolve(env.REGISTER_PATH || `${dataDir}/ASECON-Enquiry-Register.xlsx`),
    allowedOrigins: list(env.ALLOWED_ORIGINS),
    trustProxy: bool(env.TRUST_PROXY, false),
    timezone: env.TIMEZONE || 'Asia/Kolkata',
    idPrefix: (env.ENQUIRY_ID_PREFIX || 'ASE').replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'ASE',
    rateLimitPer10Min: int(env.RATE_LIMIT_PER_10MIN, 10),
    admin: {
      username: env.ADMIN_USERNAME || '',
      passwordHash: env.ADMIN_PASSWORD_HASH || '',
      sessionHours: int(env.SESSION_TTL_HOURS, 8),
      cookieSecure: bool(env.COOKIE_SECURE, true),
      publicUrl: (env.PUBLIC_ADMIN_URL || '').replace(/\/$/, ''),
    },
    sync: {
      provider: ['microsoft', 'google'].includes(syncProvider) ? syncProvider : 'none',
      intervalSeconds: int(env.SYNC_INTERVAL_SECONDS, 60),
      maxAttempts: int(env.SYNC_MAX_ATTEMPTS, 12),
      microsoft: {
        tenantId: env.MS_TENANT_ID || '',
        clientId: env.MS_CLIENT_ID || '',
        clientSecret: env.MS_CLIENT_SECRET || '',
        // e.g. https://graph.microsoft.com/v1.0/drives/{drive-id}/items/{item-id}
        workbookUrl: (env.MS_WORKBOOK_URL || '').replace(/\/$/, ''),
        tableName: env.MS_TABLE_NAME || 'Enquiries',
        tokenUrl: env.MS_TOKEN_URL || '',
      },
      google: {
        clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        privateKey: (env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        spreadsheetId: env.GOOGLE_SPREADSHEET_ID || '',
        sheetName: env.GOOGLE_SHEET_NAME || 'Enquiries',
        tokenUrl: env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
        apiBase: (env.GOOGLE_SHEETS_BASE || 'https://sheets.googleapis.com').replace(/\/$/, ''),
      },
    },
    mail: {
      host: env.SMTP_HOST || '',
      port: int(env.SMTP_PORT, 587),
      secure: bool(env.SMTP_SECURE, false),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      to: env.NOTIFY_EMAIL_TO || '',
      from: env.NOTIFY_EMAIL_FROM || '',
    },
  };
  cfg.problems = configProblems(cfg);
  return cfg;
}

// Human-readable list of what is missing — logged at start-up and shown in the admin dashboard.
function configProblems(c) {
  const p = [];
  if (!c.allowedOrigins.length) p.push('ALLOWED_ORIGINS is empty: browsers on your website cannot submit enquiries until your site URL is listed.');
  if (!c.admin.username || !c.admin.passwordHash) p.push('ADMIN_USERNAME / ADMIN_PASSWORD_HASH not set: the admin dashboard is locked.');
  if (c.sync.provider === 'microsoft') {
    const m = c.sync.microsoft;
    if (!m.tenantId || !m.clientId || !m.clientSecret || !m.workbookUrl) p.push('SYNC_PROVIDER=microsoft but MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET / MS_WORKBOOK_URL are incomplete.');
  }
  if (c.sync.provider === 'google') {
    const g = c.sync.google;
    if (!g.clientEmail || !g.privateKey || !g.spreadsheetId) p.push('SYNC_PROVIDER=google but GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SPREADSHEET_ID are incomplete.');
  }
  if (c.mail.host && (!c.mail.to || !c.mail.from)) p.push('SMTP_HOST is set but NOTIFY_EMAIL_TO / NOTIFY_EMAIL_FROM are missing: notifications are off.');
  return p;
}
