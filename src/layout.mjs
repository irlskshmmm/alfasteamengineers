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
  wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M14.5 6.5 17 4"/>',
};

export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

export const logo = () => `
<a class="brand" href="/index.html" aria-label="${esc(company.name)} — home">
  <svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="var(--brand-mark-bg)"/>
    <path d="M11 30 20 9l9 21" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M14.5 23h11" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
  </svg>
  <span class="brand-text"><strong>ALFA STEAM</strong><small>Engineers &amp; Consultants</small></span>
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
      ${logo()}
      <p>${esc(company.tagline)}</p>
      <a class="btn btn-outline-light btn-sm" href="/contact.html">Send an enquiry ${icon('arrow')}</a>
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
  const fullTitle = path === '/index.html' ? `${company.name} | Steam Engineering & Boiler Consultancy` : `${title} | ${company.name}`;
  const canonicalPath = path === '/index.html' ? '/' : path;
  const canonical = siteUrl ? `${siteUrl}${canonicalPath}` : '';
  const ogImage = siteUrl ? `${siteUrl}/images/og-alfa-steam.jpg` : '/images/og-alfa-steam.jpg';
  const ld = path === '/index.html' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: company.name,
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
  <meta name="theme-color" content="#0a1622">
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
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
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

// Animated schematic of a steam loop — used in the home hero.
export const steamLoopSvg = () => `
<svg class="loop-svg" viewBox="0 0 600 440" role="img" aria-labelledby="loop-title loop-desc">
  <title id="loop-title">Steam system schematic</title>
  <desc id="loop-desc">Boiler generating steam to a distribution header, pressure reducing station and process users, with steam traps returning condensate to the feed tank and back to the boiler.</desc>
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--grid-line)" stroke-width="1"/></pattern>
  </defs>
  <rect width="600" height="440" fill="url(#grid)"/>

  <!-- Static pipework -->
  <g class="pipe">
    <path d="M110 200V70h460"/>
    <path d="M330 70v80M480 70v80"/>
    <path d="M330 230v50M480 230v50"/>
    <path d="M480 310v20H255v15"/>
    <path d="M330 310v20"/>
    <path d="M200 370H120V300"/>
  </g>
  <!-- Animated flows -->
  <path class="flow flow-steam" d="M110 200V70h460"/>
  <path class="flow flow-steam" d="M330 70v80M480 70v80"/>
  <path class="flow flow-cond" d="M480 310v20H255v15M330 310v20"/>
  <path class="flow flow-cond" d="M200 370H120V300"/>

  <!-- Boiler -->
  <g class="equip">
    <rect x="40" y="200" width="140" height="100" rx="14"/>
    <path d="M60 222h100M60 240h100M60 258h100" class="thin"/>
    <path class="flame" d="M135 288c4-10 10-8 9-16 8 6 10 12 6 18 6-2 8-8 8-8 4 8 0 14-6 16H141c-6-2-8-6-6-10z"/>
  </g>
  <text x="60" y="190" class="lbl">BOILER</text>

  <!-- Pressure gauge on main -->
  <g class="equip"><path d="M180 70v-18"/><circle cx="180" cy="38" r="14"/></g>
  <path d="M180 38l7-6" class="needle"/>
  <text x="180" y="16" class="lbl" text-anchor="middle">PG</text>

  <!-- PRV station -->
  <g class="equip valve"><path d="M240 60v20l20-10zM280 60v20l-20-10z"/><path d="M260 70V50h-8h16"/></g>
  <text x="260" y="104" class="lbl" text-anchor="middle">PRV</text>

  <!-- Separator -->
  <g class="equip"><rect x="390" y="56" width="22" height="28" rx="6"/></g>
  <text x="401" y="104" class="lbl" text-anchor="middle">SEP</text>

  <!-- Process users -->
  <g class="equip">
    <rect x="290" y="150" width="80" height="80" rx="10"/>
    <path d="M300 170c10 8 50-8 60 0M300 190c10 8 50-8 60 0M300 210c10 8 50-8 60 0" class="thin"/>
    <rect x="440" y="150" width="80" height="80" rx="40"/>
    <path d="M450 190h60" class="thin"/>
  </g>
  <text x="330" y="144" class="lbl" text-anchor="middle">HEAT EXCHANGER</text>
  <text x="480" y="144" class="lbl" text-anchor="middle">VESSEL</text>

  <!-- Traps -->
  <g class="equip trap"><circle cx="330" cy="295" r="15"/><circle cx="480" cy="295" r="15"/></g>
  <text x="330" y="300" class="lbl lbl-t" text-anchor="middle">T</text>
  <text x="480" y="300" class="lbl lbl-t" text-anchor="middle">T</text>
  <text x="535" y="300" class="lbl" text-anchor="middle">TRAPS</text>

  <!-- Feed tank + pump -->
  <g class="equip"><rect x="200" y="345" width="110" height="50" rx="8"/><circle cx="120" cy="370" r="12"/></g>
  <text x="255" y="374" class="lbl" text-anchor="middle">FEED TANK</text>
  <text x="102" y="374" class="lbl" text-anchor="end">PUMP</text>
  <text x="410" y="352" class="lbl lbl-cond" text-anchor="middle">CONDENSATE RETURN</text>
  <text x="400" y="62" class="lbl lbl-steam" text-anchor="middle" dx="80">STEAM MAIN</text>

  <!-- Legend -->
  <g transform="translate(40 418)" class="legend">
    <line x1="0" y1="0" x2="22" y2="0" class="leg-steam"/><text x="30" y="4" class="lbl">STEAM</text>
    <line x1="100" y1="0" x2="122" y2="0" class="leg-cond"/><text x="130" y="4" class="lbl">CONDENSATE</text>
  </g>
</svg>`;
