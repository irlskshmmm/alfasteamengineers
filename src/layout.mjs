import { company, nav, services, siteUrl } from './site.config.mjs';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Line icons (24px grid, stroke = currentColor)
const ICONS = {
  steam: '<path d="M8 3c-1.5 1.5 1.5 3 0 4.5M12 3c-1.5 1.5 1.5 3 0 4.5M16 3c-1.5 1.5 1.5 3 0 4.5"/><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M4 15h16"/>',
  boiler: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 21v-3h6v3M12 6v3"/><circle cx="12" cy="12.5" r="2.5"/>',
  audit: '<path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="m9 14 2 2 4-4"/>',
  energy: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  consult: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chat: '<path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z"/>',
  gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  power: '<path d="M3 21h18M5 21l1.5-11h5L13 21"/><path d="M15 21v-6h4v6"/><path d="M7 7c0-2 2-2 2-4M10 7c0-2 2-2 2-4"/>',
  agro: '<path d="M12 21V9"/><path d="M12 13c-3 0-4.5-2-4.5-4.5C10.5 8.5 12 10 12 13zM12 13c3 0 4.5-2 4.5-4.5C13.5 8.5 12 10 12 13zM12 9c-2.5 0-3.5-2-3.5-4C11 5 12 6.5 12 9zM12 9c2.5 0 3.5-2 3.5-4C13 5 12 6.5 12 9z"/>',
  pharma: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
  gears: '<circle cx="9" cy="9" r="2.5"/><path d="M9 3v2M9 13v2M3 9h2M13 9h2M4.8 4.8l1.4 1.4M11.8 11.8l1.4 1.4M4.8 13.2l1.4-1.4M11.8 6.2l1.4-1.4"/><circle cx="17" cy="17" r="2"/><path d="M17 13v1.5M17 19.5V21M13 17h1.5M19.5 17H21"/>',
  rig: '<path d="M8 21 12 5l4 16M9.5 15h5M10.5 11h3M6 21h12"/><path d="M12 5V3M15 4c1-1 1-2 0-3 2 1 2.5 2.5 1.5 4"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M14.5 6.5 17 4"/>',
};

export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

export const logo = () => `
<a class="brand" href="/index.html" aria-label="${esc(company.name)} — home">
  <img class="brand-mark" src="/images/asecon-mark.webp" alt="${esc(company.brand)}" width="288" height="120">
  <span class="brand-text"><strong>Alfa Steam Engineers</strong><small>and Consultants Pvt Ltd</small></span>
</a>`;

const hasContact = () => company.phone || company.email || company.whatsapp;

function header(current) {
  const items = nav.map((n) => {
    const active = current === n.href || (n.children === 'services' && current.startsWith('/services')) ? ' aria-current="page"' : '';
    if (n.children === 'services') {
      return `<li class="has-sub">
        <a href="${n.href}"${active}>${n.label}</a>
        <ul class="sub">${services.map((s) => `<li><a href="/services/${s.slug}.html">${icon(s.icon)}<span>${s.title}</span></a></li>`).join('')}</ul>
      </li>`;
    }
    return `<li><a href="${n.href}"${active}>${n.label}</a></li>`;
  }).join('');
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="container header-inner">
    ${logo()}
    <nav class="main-nav" aria-label="Main">
      <ul>${items}</ul>
    </nav>
    <div class="header-cta">
      ${company.phone ? `<a class="header-phone" href="tel:${esc(company.phoneHref)}">${icon('phone')}<span>${esc(company.phone)}</span></a>` : ''}
      <a class="btn btn-accent btn-sm" href="/contact.html">Request a Consultation</a>
    </div>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu" data-nav-toggle>${icon('menu')}</button>
  </div>
  <div class="mobile-nav" id="mobile-nav" hidden>
    <ul>
      ${nav.map((n) => `<li><a href="${n.href}">${n.label}</a>${n.children === 'services' ? `<ul>${services.map((s) => `<li><a href="/services/${s.slug}.html">${s.title}</a></li>`).join('')}</ul>` : ''}</li>`).join('')}
    </ul>
    <a class="btn btn-accent" href="/contact.html">Request a Consultation</a>
  </div>
</header>`;
}

export function contactList(cls = 'contact-list') {
  const rows = [];
  if (company.phone) rows.push(`<li>${icon('phone')}<a href="tel:${esc(company.phoneHref)}">${esc(company.phone)}</a></li>`);
  if (company.whatsapp) rows.push(`<li>${icon('chat')}<a href="https://wa.me/${esc(company.whatsapp)}" rel="noopener" target="_blank">WhatsApp us</a></li>`);
  if (company.email) rows.push(`<li>${icon('mail')}<a href="mailto:${esc(company.email)}">${esc(company.email)}</a></li>`);
  if (company.address) rows.push(`<li>${icon('pin')}<span>${esc(company.address)}</span></li>`);
  if (company.hours) rows.push(`<li>${icon('clock')}<span>${esc(company.hours)}</span></li>`);
  return rows.length ? `<ul class="${cls}">${rows.join('')}</ul>` : '';
}

function footer() {
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a href="/index.html" class="footer-logo"><img src="/images/asecon-logo-640.webp" alt="${esc(company.brand)} — ${esc(company.name)}" width="640" height="318" loading="lazy"></a>
      <p>${esc(company.tagline)}</p>
      <a class="btn btn-outline btn-sm" href="/contact.html">Send an enquiry ${icon('arrow')}</a>
    </div>
    <div>
      <h2 class="footer-h">Services</h2>
      <ul class="footer-links">${services.map((s) => `<li><a href="/services/${s.slug}.html">${s.title}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="footer-h">Company</h2>
      <ul class="footer-links">
        <li><a href="/about.html">About</a></li>
        <li><a href="/industries.html">Industries</a></li>
        <li><a href="/products.html">Components</a></li>
        <li><a href="/contact.html">Contact</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-h">Get in touch</h2>
      ${contactList('contact-list contact-list-footer') || '<p class="muted-light">Use our <a href="/contact.html">enquiry form</a> and our engineers will respond.</p>'}
    </div>
  </div>
  <div class="container footer-bottom">
    <span>&copy; ${year} ${esc(company.name)}. All rights reserved.</span>
    ${company.gstin ? `<span>GSTIN: ${esc(company.gstin)}</span>` : ''}
  </div>
</footer>
${company.whatsapp ? `<a class="wa-float" href="https://wa.me/${esc(company.whatsapp)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon('chat')}</a>` : ''}`;
}

export function ctaBand({ title = 'Have a steam system challenge?', text = 'Tell us about your plant. An engineer will review your enquiry and get back to you with next steps.', service = '' } = {}) {
  const href = service ? `/contact.html?service=${service}` : '/contact.html';
  return `
<section class="cta-band">
  <div class="container cta-inner">
    <div>
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-accent btn-lg" href="${href}">Request a Consultation ${icon('arrow')}</a>
      ${company.phone ? `<a class="btn btn-outline-light btn-lg" href="tel:${esc(company.phoneHref)}">${icon('phone')} ${esc(company.phone)}</a>` : ''}
    </div>
  </div>
</section>`;
}

export function pageHero({ eyebrow, title, lead, crumbs = [] }) {
  const bc = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/index.html">Home</a></li>${crumbs.map((c, i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(c.label)}</li>` : `<li><a href="${c.href}">${esc(c.label)}</a></li>`).join('')}</ol></nav>`
    : '';
  return `
<section class="page-hero">
  <div class="blueprint" aria-hidden="true"></div>
  <div class="container">
    ${bc}
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h1>${esc(title)}</h1>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
  </div>
</section>`;
}

export function layout({ path, title, description, body, bodyClass = '', noindex = false }) {
  const fullTitle = path === '/index.html' ? `${company.brand} | Steam Engineering, Boiler Systems & Energy Audits` : `${title} | ${company.brand} — Alfa Steam Engineers and Consultants`;
  const canonicalPath = path === '/index.html' ? '/' : path;
  const canonical = siteUrl ? `${siteUrl}${canonicalPath}` : '';
  const ogImage = siteUrl ? `${siteUrl}/images/og-asecon.jpg` : '/images/og-asecon.jpg';
  const ld = path === '/index.html' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: company.name,
    alternateName: company.brand,
    logo: siteUrl ? `${siteUrl}/images/asecon-logo.png` : undefined,
    description: company.tagline,
    ...(siteUrl && { url: siteUrl }),
    ...(company.phone && { telephone: company.phone }),
    ...(company.email && { email: company.email }),
    ...(company.address && { address: company.address }),
    knowsAbout: services.map((s) => s.title),
  })}</script>` : '';
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow">'}
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
  <meta name="theme-color" content="#034c9b">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(company.name)}">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${ogImage}">
  ${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500&family=Fira+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
  <script src="/js/main.js" defer></script>
  ${ld}
</head>
<body class="${bodyClass}">
${header(path)}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>
`;
}

// Animated steam loop: real component photos placed on a live flow path — used in the home hero.
const loopNodes = [
  // [image, label, cx, cy, size, big]
  ['boiler-tubes', 'BOILER', 70, 240, 116, true],
  ['pressure-gauges', 'GAUGE', 185, 110, 88],
  ['globe-valves', 'ISOLATION', 300, 110, 88],
  ['control-valves', 'CONTROL', 415, 110, 88],
  ['temperature-sensors', 'PROCESS', 530, 240, 116, true],
  ['float-steam-trap', 'STEAM TRAP', 415, 370, 88],
  ['water-meters', 'METERING', 300, 370, 88],
  ['level-switches', 'FEED TANK', 185, 370, 88],
];

const loopNode = ([img, label, cx, cy, size, big], i) => {
  const h = size / 2;
  const x = cx - h, y = cy - h;
  const pad = big ? 14 : 10;
  const imgH = big ? size - pad - 30 : size - pad * 2;
  const caption = big
    ? `<text x="${cx}" y="${y + size - 12}" class="node-cap" text-anchor="middle">${label}</text>`
    : `<text x="${cx}" y="${y + size + 17}" class="lbl" text-anchor="middle">${label}</text>`;
  return `
  <g class="node${big ? ' node-big' : ''}" style="--d:${i * 0.12}s">
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${big ? 16 : 12}" class="node-card"/>
    <image href="/images/products/${img}.webp" x="${x + pad}" y="${y + pad}" width="${size - pad * 2}" height="${imgH}" preserveAspectRatio="xMidYMid meet"/>
    ${caption}
  </g>`;
};

export const steamLoopSvg = () => `
<svg class="loop-svg" viewBox="0 0 600 470" role="img" aria-labelledby="loop-title loop-desc">
  <title id="loop-title">Steam system loop</title>
  <desc id="loop-desc">Steam flows from the boiler through a pressure gauge, isolation valve and control valve to the process. Condensate drains through a steam trap, metering and the feed tank back to the boiler.</desc>
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--grid-line)" stroke-width="1"/></pattern>
  </defs>
  <rect width="600" height="470" fill="url(#grid)"/>

  <g class="pipe">
    <path d="M70 182V140Q70 110 100 110H500Q530 110 530 140V182"/>
    <path d="M530 298V340Q530 370 500 370H100Q70 370 70 340V298"/>
  </g>
  <path class="flow flow-steam" d="M70 182V140Q70 110 100 110H500Q530 110 530 140V182"/>
  <path class="flow flow-cond" d="M530 298V340Q530 370 500 370H100Q70 370 70 340V298"/>

  <text x="300" y="196" class="lbl lbl-steam" text-anchor="middle">STEAM →</text>
  <text x="300" y="296" class="lbl lbl-cond" text-anchor="middle">← CONDENSATE RETURN</text>
  <g class="loop-core">
    <circle cx="300" cy="246" r="26"/>
    <path d="M300 226a20 20 0 1 1-19.6 24" />
    <path d="m276 244 4.4 6.6 6.6-4.4"/>
  </g>
${loopNodes.map(loopNode).join('')}
  <g transform="translate(40 456)" class="legend">
    <line x1="0" y1="0" x2="22" y2="0" class="leg-steam"/><text x="30" y="4" class="lbl">STEAM</text>
    <line x1="100" y1="0" x2="122" y2="0" class="leg-cond"/><text x="130" y="4" class="lbl">CONDENSATE</text>
  </g>
</svg>`;
