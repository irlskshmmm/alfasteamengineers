import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { company, services, industries, products, productCategories, process, heroVideo } from './site.config.mjs';
import { esc, icon, ctaBand, pageHero, contactList } from './layout.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const hasFile = (p) => p && existsSync(root + p.replace(/^\//, ''));
const heroVideoHtml = () => hasFile(heroVideo.mp4) ? `
  <div class="hero-media" aria-hidden="true">
    <video class="hero-video" autoplay muted loop playsinline preload="metadata"${hasFile(heroVideo.poster) ? ` poster="${heroVideo.poster}"` : ''} data-hero-video>
      ${hasFile(heroVideo.webm) ? `<source src="${heroVideo.webm}" type="video/webm">` : ''}
      <source src="${heroVideo.mp4}" type="video/mp4">
    </video>
  </div>
  ${heroVideo.credit ? `<p class="hero-credit">${esc(heroVideo.credit)}</p>` : ''}` : '';

const heroSlides = [
  {
    label: 'Steam engineering',
    title: 'Engineering Reliable Steam Systems. <span class="hl-blue">Powering Industrial Performance.</span>',
    text: 'Steam engineering, boiler consultancy, industrial audits, and mechanical engineering solutions tailored to your operations.',
    primary: ['Explore Our Expertise', '/services.html'],
    secondary: ['Request a Consultation', '/contact.html#enquiry'],
  },
  {
    label: 'Industrial audits',
    title: 'Audits That Turn Plant Data Into <span class="hl-blue">Clear, Prioritised Action.</span>',
    text: 'On-site assessment of steam, boiler and utility systems, with findings and recommendations you can plan and budget against.',
    primary: ['Explore Industrial Audits', '/services/industrial-audits.html'],
    secondary: ['Request a Consultation', '/contact.html?service=industrial-audits#enquiry'],
  },
  {
    label: 'Products',
    title: 'The Right Component <span class="hl-blue">for Every Steam Duty.</span>',
    text: 'Steam traps, valves, gauges, boiler accessories and condensate recovery components, specified and supplied for your plant.',
    primary: ['View Products', '/products.html'],
    secondary: ['Product Assistance', '/contact.html?service=components#enquiry'],
  },
];

const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const productById = Object.fromEntries(products.map((p) => [p.id, p]));

const img = (id, alt, cls = '') =>
  `<img class="${cls}" src="/images/products/${id}.webp" alt="${esc(alt)}" width="800" height="800" loading="lazy" decoding="async">`;

const serviceCard = (s) => `
<a class="svc-card reveal" href="/services/${s.slug}.html">
  <span class="svc-icon">${icon(s.icon)}</span>
  <h3>${s.title}</h3>
  <p>${s.short}</p>
  <span class="link-arrow">Learn more ${icon('arrow')}</span>
</a>`;

const productCard = (p) => `
<article class="prod-card reveal" data-cat="${p.cat}">
  <div class="prod-img">${img(p.id, p.name)}</div>
  <div class="prod-body">
    <p class="prod-cat">${productCategories.find((c) => c.key === p.cat).label}</p>
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    <a class="link-arrow" href="/contact.html?product=${encodeURIComponent(p.name)}">Enquire ${icon('arrow')}</a>
  </div>
</article>`;

const indFeature = (ind, tag = 'h3') => `
<li class="reveal" id="${slugify(ind.name)}">
  <span class="ind-icon">${icon(ind.icon)}</span>
  <${tag} class="h3">${ind.name}</${tag}>
  <p>${ind.note}</p>
</li>`;

const processSteps = () => `
<ol class="process">
  ${process.map(([t, d], i) => `<li class="reveal"><span class="step-no">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
</ol>`;

// ---------------------------------------------------------------- Home
const stages = [
  ['Generation', 'Boilers, burners, feed water and blowdown.', ['boiler-systems', 'energy-efficiency']],
  ['Distribution', 'Mains, headers, pressure reduction and drainage.', ['steam-engineering', 'industrial-audits']],
  ['Utilisation', 'Heat exchangers, vessels, dryers and process users.', ['steam-engineering', 'engineering-consultancy']],
  ['Recovery', 'Steam traps, condensate return and flash steam.', ['energy-efficiency', 'industrial-audits']],
];
const svcBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

const home = {
  path: '/index.html',
  title: 'Home',
  description: `${company.brand} — Alfa Steam Engineers and Consultants Pvt Ltd: steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy for process industries.`,
  bodyClass: 'home',
  body: `
<section class="hero hero-carousel" aria-roledescription="carousel" aria-label="${esc(company.brand)} highlights" data-carousel>
  ${heroVideoHtml()}
  <div class="container hero-stage">
    <div class="hero-content">
      <div class="hero-brand">
        <p class="hero-wordmark"><span class="wm-a">ASE</span><span class="wm-b">CON</span></p>
        <p class="hero-tagline">Alfa Steam Engineers &amp; Consultants Pvt Ltd</p>
      </div>
      <div class="hero-slides" aria-live="off" data-slides>
        ${heroSlides.map((sl, i) => `
        <div class="hero-slide${i === 0 ? ' is-active' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${heroSlides.length}: ${esc(sl.label)}"${i === 0 ? '' : ' inert'} data-slide>
          ${i === 0 ? `<h1>${sl.title}</h1>` : `<h2 class="hero-title">${sl.title}</h2>`}
          <p class="lead">${esc(sl.text)}</p>
          <div class="hero-actions">
            <a class="btn btn-hero" href="${sl.primary[1]}">${sl.primary[0]} ${icon('arrow')}</a>
            <a class="hero-link" href="${sl.secondary[1]}">${sl.secondary[0]} ${icon('arrow')}</a>
          </div>
        </div>`).join('')}
      </div>
      <div class="hero-dots">${heroSlides.map((sl, i) => `<button type="button" class="hero-dot" aria-label="Show slide ${i + 1}: ${esc(sl.label)}"${i === 0 ? ' aria-current="true"' : ''} data-dot="${i}"></button>`).join('')}</div>
    </div>
  </div>
  <button type="button" class="hero-arrow hero-prev" aria-label="Previous slide" data-prev>${icon('prev')}</button>
  <button type="button" class="hero-arrow hero-next" aria-label="Next slide" data-next>${icon('next')}</button>
</section>

<section class="section intro-section" aria-labelledby="about-intro-title">
  <div class="container intro-split">
    <div class="intro-copy">
      <h2 id="about-intro-title">About Alfa Steam Engineers</h2>
      <p>${esc(company.name)} (${esc(company.brand)}) is a mechanical engineering company based in Nagpur, India, specialising in steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy.</p>
      <p>We help plants generate, distribute and use steam more efficiently and safely, from the boiler house to condensate return, and we supply the components our recommendations call for.</p>
      <a class="more-link" href="/about.html">More about ${esc(company.brand)} ${icon('arrow')}</a>
    </div>
    <figure class="world-map">
      <div class="map-inner">
        <img src="/images/world-dots.svg" alt="World map with ${esc(company.brand)}'s location marked in Nagpur, India" width="1000" height="383" loading="lazy">
        <span class="map-pin" style="left: 69.19%; top: 42.65%;" aria-hidden="true">
          <svg viewBox="0 0 24 32"><path d="M12 31s10-11.2 10-19A10 10 0 0 0 2 12c0 7.8 10 19 10 19z"/><circle cx="12" cy="12" r="4"/></svg>
        </span>
        <span class="map-label" style="left: 69.19%; top: 42.65%;">Nagpur, India</span>
      </div>
    </figure>
  </div>
</section>

<section class="section intro-section intro-section-alt" aria-labelledby="industry-intro-title">
  <div class="container intro-split intro-split-media">
    <figure class="intro-media">
      <img src="/images/industry-plant.webp" alt="Aerial view of an operating industrial plant releasing steam" width="1280" height="720" loading="lazy">
    </figure>
    <div class="intro-copy">
      <h2 id="industry-intro-title">Meeting Industry Requirements in India</h2>
      <p>Steam traps, valves and gauges, boiler accessories and condensate recovery equipment are core components in refineries, power plants and chemical, pharmaceutical, food and manufacturing plants.</p>
      <p>From Nagpur, ${esc(company.brand)} provides engineering support, industrial audits and component supply to help keep these operations running smoothly.</p>
      <p>Read about our work for each industry.</p>
      <a class="more-link" href="/industries.html">Explore industries ${icon('arrow')}</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">What we do</p>
      <h2>Five disciplines. One steam system.</h2>
      <p>Each service can be engaged on its own, but they are strongest together — because losses in one part of a steam system usually show up somewhere else.</p>
    </div>
    <div class="svc-grid">${services.map(serviceCard).join('')}</div>
  </div>
</section>

<section class="section section-dark">
  <div class="blueprint" aria-hidden="true"></div>
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Across the steam loop</p>
      <h2>Where we work in your plant</h2>
      <p>Steam is generated, distributed, used and returned. We engineer every stage — and the connections between them.</p>
    </div>
    <ol class="stages">
      ${stages.map(([t, d, sv], i) => `
      <li class="stage reveal">
        <span class="stage-no">${String(i + 1).padStart(2, '0')}</span>
        <h3>${t}</h3>
        <p>${d}</p>
        <ul>${sv.map((slug) => `<li><a href="/services/${slug}.html">${svcBySlug[slug].title}</a></li>`).join('')}</ul>
      </li>`).join('')}
    </ol>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div>
      <p class="eyebrow">How we work</p>
      <h2>From first enquiry to measurable result</h2>
      <p>Every engagement follows the same disciplined path: understand the system, engineer the answer, and stay involved until it works on the plant floor.</p>
      <a class="btn btn-primary" href="/about.html">About our approach ${icon('arrow')}</a>
    </div>
    ${processSteps()}
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="section-head section-head-row">
      <div>
        <p class="eyebrow">Components</p>
        <h2>The right component for the duty</h2>
        <p>We help specify and source the valves, traps, instruments and fittings our recommendations call for.</p>
      </div>
      <a class="btn btn-outline" href="/products.html">View all components ${icon('arrow')}</a>
    </div>
    <div class="prod-grid prod-grid-home">${['steam-traps', 'control-valves', 'pressure-gauges', 'globe-valves', 'float-steam-trap', 'boiler-tubes', 'strainers', 'temperature-sensors'].map((id) => productCard(productById[id])).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Industries</p>
      <h2>Industries that run on steam</h2>
      <p>Our services apply wherever process heat is generated and distributed as steam.</p>
    </div>
    <ul class="ind-feature">${industries.filter((i) => i.featured).map((i) => indFeature(i)).join('')}</ul>
    <p class="center"><a class="link-arrow" href="/industries.html">See all industries ${icon('arrow')}</a></p>
  </div>
</section>
${ctaBand()}`,
};

// ---------------------------------------------------------------- About
const about = {
  path: '/about.html',
  title: 'About Us',
  description: `About ${company.brand} (${company.name}) — a steam and boiler engineering consultancy focused on efficient, safe and reliable steam systems.`,
  body: `
${pageHero({ eyebrow: 'About us', title: 'Engineering partners for steam-dependent plants', lead: `${company.brand} helps industrial plants generate, distribute and use steam better — with practical engineering, honest assessment and hands-on support.`, crumbs: [{ label: 'About' }] })}
<section class="section" id="who-we-are">
  <div class="container split split-top">
    <div class="prose">
      <h2>Who we are</h2>
      <p>${esc(company.name)} (${esc(company.brand)}) is an engineering and consultancy firm focused on steam and thermal utility systems. We work with plant owners, utility managers and project teams who need steam to be available, efficient and safe.</p>
      <p>Our work spans the full steam loop — boilers and boiler house auxiliaries, distribution networks, process heating equipment, steam traps and condensate recovery. Because these parts affect one another, we look at them as one system rather than in isolation.</p>
      <p>Alongside engineering and audits, we help clients specify and source the components our recommendations call for, so there is a straight line from finding to fix.</p>
    </div>
    <aside class="values">
      <h2 class="h4">What clients can expect</h2>
      <ul>
        <li>${icon('gauge')}<div><h3>Evidence first</h3><p>Recommendations based on site observations and your operating data — not assumptions.</p></div></li>
        <li>${icon('shield')}<div><h3>Safety in every decision</h3><p>Pressure systems demand care. Safe operation is designed in, not added later.</p></div></li>
        <li>${icon('doc')}<div><h3>Clear documentation</h3><p>Reports, drawings and specifications your team can act on and keep.</p></div></li>
        <li>${icon('wrench')}<div><h3>Practical implementation</h3><p>Solutions that fit your plant, your budget and your shutdown windows.</p></div></li>
      </ul>
    </aside>
  </div>
</section>
<section class="section section-alt" id="vision">
  <div class="container vm-grid">
    <div class="vm-card">
      <p class="eyebrow">Vision</p>
      <p class="vm-text">Steam systems that run efficiently, safely and reliably in every plant we work with.</p>
    </div>
    <div class="vm-card">
      <p class="eyebrow">Mission</p>
      <p class="vm-text">To engineer, audit and support steam and thermal utility systems with evidence-based recommendations and practical, hands-on implementation.</p>
    </div>
  </div>
</section>
<section class="section" id="history">
  <div class="container narrow">
    <p class="eyebrow">Company history</p>
    <h2>Our story</h2>
    <p class="muted">The ${esc(company.brand)} company history and milestones will be published here.</p>
  </div>
</section>
<section class="section section-alt">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Our approach</p>
      <h2>How an engagement runs</h2>
    </div>
    ${processSteps()}
  </div>
</section>
${ctaBand({ title: 'Let’s talk about your steam system', text: 'Share a few details about your plant and requirement. We will come back with the right next step.' })}`,
};

// ---------------------------------------------------------------- Services overview
const servicesPage = {
  path: '/services.html',
  title: 'Services',
  description: 'Steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy services.',
  body: `
${pageHero({ eyebrow: 'Services', title: 'Engineering services for the complete steam loop', lead: 'From a single trap survey to a full utility project, choose the service you need — or combine them for a whole-system result.', crumbs: [{ label: 'Services' }] })}
<section class="section">
  <div class="container">
    <div class="svc-list">
      ${services.map((s, i) => `
      <article class="svc-row reveal">
        <div class="svc-row-head">
          <span class="svc-icon">${icon(s.icon)}</span>
          <span class="svc-no">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <div>
          <h2><a href="/services/${s.slug}.html">${s.title}</a></h2>
          <p>${s.short}</p>
          <ul class="tags">${s.scope.slice(0, 4).map(([t]) => `<li>${t}</li>`).join('')}</ul>
        </div>
        <a class="btn btn-outline" href="/services/${s.slug}.html">Details ${icon('arrow')}</a>
      </article>`).join('')}
    </div>
  </div>
</section>
${ctaBand()}`,
};

// ---------------------------------------------------------------- Service detail pages
const servicePages = services.map((s) => ({
  path: `/services/${s.slug}.html`,
  title: s.title,
  description: `${s.title} — ${s.short}`,
  body: `
${pageHero({ eyebrow: 'Service', title: s.title, lead: s.short, crumbs: [{ label: 'Services', href: '/services.html' }, { label: s.title }] })}
<section class="section">
  <div class="container svc-detail">
    <div class="svc-main">
      <p class="intro">${s.lead}</p>
      <h2>Scope of work</h2>
      <ul class="scope">
        ${s.scope.map(([t, d]) => `<li class="reveal"><h3>${t}</h3><p>${d}</p></li>`).join('')}
      </ul>
      <h2>When to call us</h2>
      <ul class="checks">${s.signs.map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>
    </div>
    <aside class="svc-aside">
      <div class="aside-card">
        <h2 class="h4">What you receive</h2>
        <ul class="checks">${s.deliverables.map((x) => `<li>${icon('doc')}<span>${x}</span></li>`).join('')}</ul>
        <a class="btn btn-accent btn-block" href="/contact.html?service=${s.slug}">Enquire about ${s.title}</a>
      </div>
      <div class="aside-card aside-nav">
        <h2 class="h4">Other services</h2>
        <ul>${services.filter((o) => o.slug !== s.slug).map((o) => `<li><a href="/services/${o.slug}.html">${icon(o.icon)}<span>${o.title}</span></a></li>`).join('')}</ul>
      </div>
    </aside>
  </div>
</section>
<section class="section section-alt">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Related components</p>
      <h2>Components we specify and supply</h2>
    </div>
    <div class="prod-grid prod-grid-compact">${s.products.map((id) => productCard(productById[id])).join('')}</div>
  </div>
</section>
${ctaBand({ title: `Discuss your ${s.title.toLowerCase()} requirement`, service: s.slug })}`,
}));

// ---------------------------------------------------------------- Industries
const industriesPage = {
  path: '/industries.html',
  title: 'Industries',
  description: 'Steam engineering and boiler consultancy for steam-intensive industries including food, dairy, pharmaceuticals, chemicals, textiles and paper.',
  body: `
${pageHero({ eyebrow: 'Industries', title: 'Industries that run on steam', lead: 'Steam is the workhorse of process heating. Wherever it is generated and used, the same engineering principles decide cost, quality and safety.', crumbs: [{ label: 'Industries' }] })}
<section class="section">
  <div class="container">
    <ul class="ind-feature ind-feature-lg">${industries.filter((i) => i.featured).map((i) => indFeature(i, 'h2')).join('')}</ul>
    <h2 class="sub-h">Also serving</h2>
    <ul class="ind-grid">${industries.filter((i) => !i.featured).map((ind) => `<li class="reveal" id="${slugify(ind.name)}"><h3>${ind.name}</h3><p>${ind.note}</p></li>`).join('')}</ul>
    <p class="note">Don’t see your industry? If your plant uses steam or thermal utilities, <a href="/contact.html">tell us about it</a>.</p>
  </div>
</section>
${ctaBand()}`,
};

// ---------------------------------------------------------------- Products
const productsPage = {
  path: '/products.html',
  title: 'Steam System Components',
  description: 'Steam traps, valves, instrumentation, boiler tubes, flanges, gaskets and panel components for steam and utility systems.',
  body: `
${pageHero({ eyebrow: 'Components', title: 'Steam system components', lead: 'Valves, traps, instruments and fittings selected for the duty — specified as part of our engineering, or supplied against your requirement.', crumbs: [{ label: 'Components' }] })}
<section class="section">
  <div class="container">
    <div class="filters" role="toolbar" aria-label="Filter components" data-filters>
      <button type="button" class="chip" aria-pressed="true" data-filter="all">All</button>
      ${productCategories.map((c) => `<button type="button" class="chip" aria-pressed="false" data-filter="${c.key}">${c.label}</button>`).join('')}
    </div>
    <div class="prod-grid" data-products>${products.map(productCard).join('')}</div>
    <div class="note-card">
      <h2 class="h4">Need a specific size, rating or make?</h2>
      <p>Send us your specification, datasheet or a photo of the existing item. Sizes, pressure ratings, materials and makes are confirmed against each enquiry.</p>
      <a class="btn btn-primary" href="/contact.html?service=components">Send a component enquiry ${icon('arrow')}</a>
    </div>
  </div>
</section>
${ctaBand({ title: 'Not sure which component you need?', text: 'Tell us the application and operating conditions — our engineers will recommend the right selection.' })}`,
};

// ---------------------------------------------------------------- Contact
const serviceOptions = [...services.map((s) => [s.slug, s.title]), ['components', 'Components / spares'], ['other', 'Something else']];
const contact = {
  path: '/contact.html',
  title: 'Contact & Enquiry',
  description: `Contact ${company.brand} for steam engineering, boiler, audit, energy efficiency and consultancy enquiries.`,
  body: `
${pageHero({ eyebrow: 'Contact', title: 'Request a consultation', lead: 'Tell us about your plant and requirement. The more detail you share, the more useful our first response will be.', crumbs: [{ label: 'Contact' }] })}
<section class="section">
  <div class="container contact-grid">
    <form class="enquiry" id="enquiry" name="enquiry" method="POST" action="/thank-you.html" data-netlify="true" netlify-honeypot="bot-field" data-enquiry-form novalidate>
      <input type="hidden" name="form-name" value="enquiry">
      <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="form-grid">
        <div class="field"><label for="f-name">Full name <span aria-hidden="true">*</span></label><input id="f-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="f-company">Company <span aria-hidden="true">*</span></label><input id="f-company" name="company" autocomplete="organization" required></div>
        <div class="field"><label for="f-email">Email <span aria-hidden="true">*</span></label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="f-phone">Phone <span aria-hidden="true">*</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
        <div class="field"><label for="f-location">Plant location</label><input id="f-location" name="location" placeholder="City, State"></div>
        <div class="field"><label for="f-service">Service required</label>
          <select id="f-service" name="service">
            <option value="">Select a service</option>
            ${serviceOptions.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="field field-full"><label for="f-system">System details <span class="opt">(optional)</span></label><input id="f-system" name="system" placeholder="e.g. boiler type and capacity, steam pressure, fuel"></div>
        <div class="field field-full"><label for="f-message">Your requirement <span aria-hidden="true">*</span></label><textarea id="f-message" name="message" rows="5" required></textarea></div>
      </div>
      <p class="form-error" role="alert" hidden data-form-error></p>
      <button class="btn btn-accent btn-lg" type="submit">Send Enquiry ${icon('arrow')}</button>
      <p class="small muted">Fields marked * are required. We use your details only to respond to this enquiry.</p>
    </form>
    <div class="form-success" hidden data-form-success tabindex="-1">
      <span class="success-icon">${icon('check')}</span>
      <h2>Thank you — your enquiry has been sent.</h2>
      <p>One of our engineers will review your requirement and get back to you.</p>
      <a class="btn btn-outline" href="/services.html">Browse our services</a>
    </div>
    <aside class="contact-aside">
      <div class="aside-card aside-dark">
        <h2 class="h4">Talk to an engineer</h2>
        ${contactList() || '<p>Use the form and our team will contact you.</p>'}
      </div>
      <div class="aside-card">
        <h2 class="h4">Helpful to include</h2>
        <ul class="checks">
          <li>${icon('check')}<span>Boiler type, capacity and fuel</span></li>
          <li>${icon('check')}<span>Steam pressure and main process users</span></li>
          <li>${icon('check')}<span>The problem you are seeing, or the project scope</span></li>
          <li>${icon('check')}<span>Photos, drawings or datasheets (we can request these by email)</span></li>
        </ul>
      </div>
    </aside>
  </div>
</section>`,
};

const thankYou = {
  path: '/thank-you.html',
  title: 'Thank You',
  description: 'Your enquiry has been received.',
  noindex: true,
  body: `
${pageHero({ eyebrow: 'Enquiry received', title: 'Thank you for contacting us', lead: 'One of our engineers will review your requirement and get back to you.' })}
<section class="section"><div class="container center"><a class="btn btn-primary" href="/index.html">Back to home</a> <a class="btn btn-outline" href="/services.html">Browse services</a></div></section>`,
};

const notFound = {
  path: '/404.html',
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
  noindex: true,
  body: `
${pageHero({ eyebrow: 'Error 404', title: 'This page could not be found', lead: 'The link may be out of date, or the page may have moved.' })}
<section class="section"><div class="container center"><a class="btn btn-primary" href="/index.html">Back to home</a> <a class="btn btn-outline" href="/contact.html">Contact us</a></div></section>`,
};

const docGroup = (id, title, text) => `
<section class="doc-group" id="${id}">
  <h2>${title}</h2>
  <p>${text}</p>
  <a class="link-arrow" href="/contact.html?service=components#enquiry">Request by email ${icon('arrow')}</a>
</section>`;

const downloadsPage = {
  path: '/downloads.html',
  title: 'Downloads',
  description: `Technical documents, product catalogues and resources from ${company.brand}.`,
  body: `
${pageHero({ eyebrow: 'Downloads', title: 'Documents and resources', lead: 'Technical documents, product catalogues and reference material. Files are shared on request while the library is being prepared.', crumbs: [{ label: 'Downloads' }] })}
<section class="section">
  <div class="container doc-grid">
    ${docGroup('technical-documents', 'Technical documents', 'Datasheets, installation guidance and technical notes for the steam system components we supply.')}
    ${docGroup('product-catalogues', 'Product catalogues', 'Catalogues for steam traps, valves and gauges, boiler accessories and condensate recovery equipment.')}
    ${docGroup('resources', 'Resources', 'Reference material on steam system design, steam trapping and energy efficiency.')}
  </div>
</section>
${ctaBand({ title: 'Need a specific document?', text: 'Tell us the product or topic and we will send the relevant files.' })}`,
};

const newsPage = {
  path: '/news.html',
  title: 'News & Events',
  description: `News and events from ${company.brand}.`,
  body: `
${pageHero({ eyebrow: 'News & Events', title: 'News and events', lead: `Updates from ${company.brand} and the events we take part in.`, crumbs: [{ label: 'News & Events' }] })}
<section class="section">
  <div class="container doc-grid doc-grid-2">
    <section class="doc-group" id="news"><h2>News</h2><p>There are no news posts yet. Updates will be published here.</p></section>
    <section class="doc-group" id="events"><h2>Events</h2><p>There are no upcoming events listed yet.</p></section>
  </div>
</section>
${ctaBand()}`,
};

export const pages = [home, about, servicesPage, ...servicePages, industriesPage, productsPage, downloadsPage, newsPage, contact, thankYou, notFound];
