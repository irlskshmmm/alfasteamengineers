#!/usr/bin/env node
// Renders src/ templates into static HTML at the repository root.
// No dependencies — run with: node tools/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Optional .env (e.g. ENQUIRY_API_URL) — loaded before the site config is read
try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch { /* no .env file */ }
const { pages } = await import('../src/pages.mjs');
const { layout } = await import('../src/layout.mjs');
const { company, siteUrl, nav, products, services } = await import('../src/site.config.mjs');
const { enquiryOptions } = await import('../src/enquiry-options.mjs');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const page of pages) {
  const out = join(root, page.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, layout(page));
  console.log('wrote', page.path);
}

// Client-side search index (used by the header search)
const index = [
  ...pages.filter((p) => !p.noindex).map((p) => ({ t: p.title === 'Home' ? `${company.brand} home` : p.title, u: p.path, d: p.description })),
  ...nav.flatMap((n) => n.children.map((c) => ({ t: c.label, u: c.href, d: `${n.label}` }))),
  ...products.map((p) => ({ t: p.name, u: `/contact.html?product=${encodeURIComponent(p.name)}#enquiry`, d: p.desc })),
  ...services.flatMap((sv) => sv.scope.map(([t, d]) => ({ t, u: `/services/${sv.slug}.html`, d: `${sv.title}: ${d}` }))),
];
writeFileSync(join(root, 'js/search-index.json'), JSON.stringify(index));
console.log('wrote /js/search-index.json');

// Enquiry form choice lists for the backend's server-side validation (keeps form and server in step)
writeFileSync(join(root, 'server/src/enquiry-options.json'), `${JSON.stringify(enquiryOptions, null, 2)}\n`);
console.log('wrote /server/src/enquiry-options.json');

if (siteUrl) {
  const urls = pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${siteUrl}${p.path === '/index.html' ? '/' : p.path}</loc></url>`);
  writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  console.log('wrote /sitemap.xml');
}

const missing = ['phone', 'email', 'whatsapp', 'address'].filter((k) => !company[k]);
if (!siteUrl) missing.push('siteUrl');
if (missing.length) console.warn(`\nNote: not yet set in src/site.config.mjs (hidden on the site): ${missing.join(', ')}`);
