#!/usr/bin/env node
// Renders src/ templates into static HTML at the repository root.
// No dependencies — run with: node tools/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/pages.mjs';
import { layout } from '../src/layout.mjs';
import { company, siteUrl } from '../src/site.config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const page of pages) {
  const out = join(root, page.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, layout(page));
  console.log('wrote', page.path);
}

if (siteUrl) {
  const urls = pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${siteUrl}${p.path === '/index.html' ? '/' : p.path}</loc></url>`);
  writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  console.log('wrote /sitemap.xml');
}

const missing = ['phone', 'email', 'whatsapp', 'address'].filter((k) => !company[k]);
if (!siteUrl) missing.push('siteUrl');
if (missing.length) console.warn(`\nNote: not yet set in src/site.config.mjs (hidden on the site): ${missing.join(', ')}`);
