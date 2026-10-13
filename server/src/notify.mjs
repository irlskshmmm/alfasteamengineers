// Optional email notification for each new enquiry (SMTP: Microsoft 365, Google Workspace, Zoho, etc.).
// Sends only the essentials plus a link to the record in the password-protected dashboard.
export function createNotifier(config, { log = console, transportFactory } = {}) {
  const m = config.mail;
  const enabled = !!(m.host && m.to && m.from);
  let transport = null;

  async function getTransport() {
    if (transport) return transport;
    if (transportFactory) return (transport = transportFactory(m));
    const { default: nodemailer } = await import('nodemailer');
    transport = nodemailer.createTransport({ host: m.host, port: m.port, secure: m.secure, auth: m.user ? { user: m.user, pass: m.pass } : undefined });
    return transport;
  }

  return {
    enabled,
    async newEnquiry(row) {
      if (!enabled) return 'off';
      const link = config.admin.publicUrl ? `${config.admin.publicUrl}/#${encodeURIComponent(row.enquiry_id)}` : '(set PUBLIC_ADMIN_URL to include a dashboard link)';
      const product = row.requirement_other ? `${row.requirement}: ${row.requirement_other}` : row.requirement;
      const qty = row.quantity !== null && row.quantity !== undefined ? `\nQuantity:   ${row.quantity} ${row.unit === 'Other' ? row.unit_other : row.unit}` : '';
      const text = [
        `New website enquiry ${row.enquiry_id}`,
        '',
        `Company:    ${row.company}`,
        `Contact:    ${row.name}`,
        `Email:      ${row.email}`,
        `Phone:      ${row.phone}`,
        `Industry:   ${row.industry_other ? `Other: ${row.industry_other}` : row.industry}`,
        `Requested:  ${product}${qty}`,
        '',
        `Full details (login required): ${link}`,
      ].join('\n');
      try {
        const t = await getTransport();
        await t.sendMail({ from: m.from, to: m.to, replyTo: row.email, subject: `New enquiry ${row.enquiry_id} — ${row.company}`, text });
        return 'sent';
      } catch (e) {
        log.warn?.(`[notify] ${row.enquiry_id}: ${e.message}`);
        return 'failed';
      }
    },
  };
}
