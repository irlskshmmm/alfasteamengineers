import { company, services, industries, products, productCategories, process } from './site.config.mjs';
import { esc, icon, ctaBand, pageHero, contactList, steamLoopSvg } from './layout.mjs';

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
  description: `${company.name} — steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy for process industries.`,
  bodyClass: 'home',
  body: `
<section class="hero">
  <div class="blueprint" aria-hidden="true"></div>
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Steam &amp; Thermal Utility Engineering</p>
      <h1>Steam systems engineered for <span class="hl">efficiency, safety</span> and uptime.</h1>
      <p class="lead">${esc(company.name)} provides steam engineering, boiler system support, industrial audits, energy efficiency and engineering consultancy for plants that depend on steam.</p>
      <div class="hero-actions">
        <a class="btn btn-accent btn-lg" href="/contact.html">Request a Consultation ${icon('arrow')}</a>
        <a class="btn btn-ghost btn-lg" href="/services.html">Explore Services</a>
      </div>
      <ul class="hero-points">
        <li>${icon('check')} Whole-system view, boiler to condensate</li>
        <li>${icon('check')} Findings you can budget and act on</li>
        <li>${icon('check')} Engineering and components from one team</li>
      </ul>
    </div>
    <div class="hero-visual">${steamLoopSvg()}</div>
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
    <ul class="ind-grid">${industries.slice(0, 8).map((ind) => `<li class="reveal"><h3>${ind.name}</h3><p>${ind.note}</p></li>`).join('')}</ul>
    <p class="center"><a class="link-arrow" href="/industries.html">See all industries ${icon('arrow')}</a></p>
  </div>
</section>
${ctaBand()}`,
};

// ---------------------------------------------------------------- About
const about = {
  path: '/about.html',
  title: 'About Us',
  description: `About ${company.name} — a steam and boiler engineering consultancy focused on efficient, safe and reliable steam systems.`,
  body: `
${pageHero({ eyebrow: 'About us', title: 'Engineering partners for steam-dependent plants', lead: `${company.name} helps industrial plants generate, distribute and use steam better — with practical engineering, honest assessment and hands-on support.`, crumbs: [{ label: 'About' }] })}
<section class="section">
  <div class="container split split-top">
    <div class="prose">
      <h2>Who we are</h2>
      <p>${esc(company.name)} is an engineering and consultancy firm focused on steam and thermal utility systems. We work with plant owners, utility managers and project teams who need steam to be available, efficient and safe.</p>
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
    <ul class="ind-grid ind-grid-lg">${industries.map((ind) => `<li class="reveal"><h2 class="h3">${ind.name}</h2><p>${ind.note}</p></li>`).join('')}</ul>
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
  description: `Contact ${company.name} for steam engineering, boiler, audit, energy efficiency and consultancy enquiries.`,
  body: `
${pageHero({ eyebrow: 'Contact', title: 'Request a consultation', lead: 'Tell us about your plant and requirement. The more detail you share, the more useful our first response will be.', crumbs: [{ label: 'Contact' }] })}
<section class="section">
  <div class="container contact-grid">
    <form class="enquiry" name="enquiry" method="POST" action="/thank-you.html" data-netlify="true" netlify-honeypot="bot-field" data-enquiry-form novalidate>
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

export const pages = [home, about, servicesPage, ...servicePages, industriesPage, productsPage, contact, thankYou, notFound];
