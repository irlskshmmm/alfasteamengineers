# Lovable prompt — Alfa Steam Engineers & Consultants

## Main prompt (paste this first)

Build a premium, modern corporate website for **Alfa Steam Engineers & Consultants**, a mechanical engineering company specialising in steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy for process industries in India.

**Goal:** establish strong technical credibility with plant owners, utility managers and project engineers, and turn visitors into enquiries.

### Brand & design
- Feel: premium industrial engineering — precise, technical, trustworthy. Think engineering consultancy, not a product shop.
- Colours: deep navy (#0A1622) and steel blues as the base, white and light grey (#F3F6F9) content sections, one accent colour — heat orange (#F07B2B) — used for CTAs and highlights. A secondary cool blue (#4FB3E0) only to represent condensate/water in diagrams.
- Typography: IBM Plex Sans for headings and body, IBM Plex Mono for small uppercase labels (eyebrows, categories, diagram labels).
- Visual language: subtle blueprint/engineering grid backgrounds on dark sections, thin line icons, crisp cards with 1px borders, generous whitespace, smooth subtle scroll-reveal animations. Respect prefers-reduced-motion.
- Logo for now: a navy rounded square with a white "A" and an orange crossbar, next to the wordmark "ALFA STEAM" with "ENGINEERS & CONSULTANTS" in small mono caps beneath.
- Fully responsive (mobile-first), accessible (semantic HTML, keyboard navigable, visible focus states, good contrast), fast.

### Global layout
- Sticky dark header: logo, nav (About, Services ▾ with the 5 services in a dropdown, Industries, Components, Contact), and an orange "Request a Consultation" button. Hamburger menu on mobile.
- Footer: logo + one-line description, Services links, Company links, "Get in touch" column, copyright.
- A reusable dark CTA band before the footer on most pages: "Have a steam system challenge?" + "Request a Consultation" button.

### Pages
1. **Home**
   - Hero (dark, blueprint grid): eyebrow "Steam & Thermal Utility Engineering", headline "Steam systems engineered for efficiency, safety and uptime." (highlight "efficiency, safety" in orange), short intro, buttons "Request a Consultation" and "Explore Services", three check-mark points: "Whole-system view, boiler to condensate", "Findings you can budget and act on", "Engineering and components from one team".
   - Right side of the hero: an **animated SVG schematic of a steam loop** — boiler (with small flame) → steam main with pressure gauge, PRV and separator → heat exchanger and vessel → steam traps → condensate return → feed tank → pump → back to boiler. Animated dashed flow lines: orange for steam, blue for condensate. Mono labels and a small legend. This replaces stock photography.
   - "Five disciplines. One steam system." — 5 service cards with icons linking to each service page.
   - "Where we work in your plant" (dark section) — 4 stages: Generation, Distribution, Utilisation, Recovery, each with a one-line description and links to the relevant services.
   - "How we work" — 4 steps: Enquiry → Site study → Analysis & report → Implementation support.
   - Components preview — 8 product cards + "View all components".
   - "Industries that run on steam" — grid of 8 industries.
   - CTA band.
2. **About** — who we are (steam & thermal utility engineering firm working across the full steam loop, and helping clients source the components our recommendations call for), "What clients can expect" (Evidence first, Safety in every decision, Clear documentation, Practical implementation), the 4-step process, CTA.
3. **Services overview** — one row per service with icon, short description, 4 scope tags and a "Details" button.
4. **Five service detail pages** (same template): breadcrumb + dark page hero, intro paragraph, "Scope of work" (6 cards), "When to call us" (checklist), sticky sidebar with "What you receive" deliverables + "Enquire about [service]" button (opens Contact with that service preselected) + links to other services, "Related components" grid, CTA band.
   - **Steam Engineering** — steam distribution design, pressure reduction & control, steam trapping, condensate recovery, steam quality, process heating applications.
   - **Boiler Systems** — boiler selection & sizing, boiler house auxiliaries, combustion & controls, water treatment interface, maintenance & spares support, retrofit & upgrade studies.
   - **Industrial Audits** — steam system audit, steam trap survey, boiler performance assessment, insulation survey, safety & reliability review, utility metering review.
   - **Energy Efficiency** — heat recovery, condensate return improvement, trap and leak management, insulation upgrades, combustion optimisation, monitoring & targeting.
   - **Engineering Consultancy** — project engineering, technical specifications, bid evaluation, troubleshooting, installation supervision, component sourcing.
5. **Industries** — Food & Beverage, Dairy, Pharmaceuticals, Chemicals & Petrochemicals, Textiles, Paper & Packaging, Sugar & Distilleries, Rubber & Tyre, Hospitals & Hospitality, Edible Oil & Solvent Extraction — each with a one-line note on how steam is used. Intro: "Our services apply wherever process heat is generated and distributed as steam."
6. **Components** — filter chips (All, Steam & Condensate, Valves, Instrumentation, Boiler & Piping, Panels & Electricals) and a grid of product cards (image on white, category label, name, one-line description, "Enquire" link that opens Contact with the product name prefilled in the message). End with a "Need a specific size, rating or make?" card.
7. **Contact / Request a consultation** — form fields: Full name*, Company*, Email*, Phone*, Plant location, Service required (dropdown: the 5 services + Components/spares + Something else), System details (optional — boiler type and capacity, steam pressure, fuel), Your requirement*. Inline validation, success state "Thank you — your enquiry has been sent." Sidebar: "Talk to an engineer" contact card and "Helpful to include" checklist.
8. **404 page** in the same style.

### Content rules — important
- Do **not** invent certifications, approvals (e.g. ISO, IBR), client names, logos, testimonials, years of experience, project counts or any statistics. No fake numbers anywhere.
- Contact details are not confirmed yet: keep phone, email, WhatsApp and address in a single config/constants file, and hide them in the UI when empty. Do not use placeholder numbers or emails.
- Tone: confident, plain-English, engineering-led. Short sentences. No hype.

---

## Follow-up prompts (send one at a time after the first build)

**1 — Product images**
> I've uploaded product images. Use them on the Components page and in the related-components sections, displayed with `object-contain` on a white background in a fixed 5:4 frame so all cards align. Map them as follows: Steam Traps = steam-traps, Ball Float Steam Traps = image9, Strainers & Screens = image10, Globe Valves = globe-valves, Control Valves = control-valves, Ball Valves = ball-valves, Butterfly Valves = image11, Solenoid Valves = image7, Pressure Gauges = pressure-gauges, Temperature Sensors = temperature-sensors, Thermocouples & RTD Probes = image3, Level & Float Switches = image6, Water Meters = image8, Boiler Tubes = boiler-tubes, Flanges = image12, Gaskets = image5, Mechanical Seals = image4, Control Panels = electrical-panels, MCBs & Protection = mcb-switches, Contactors = contactors, Power & Control Cables = image2.

**2 — Enquiry form backend**
> Connect the contact form so submissions are saved (Supabase table `enquiries` with all form fields + created_at) and I get an email notification for each new enquiry. Add basic spam protection (honeypot field). Make "Enquire" buttons preselect the service via `?service=` or prefill the message via `?product=`.

**3 — Contact details & SEO** (once confirmed)
> Set the contact details: phone ___, WhatsApp ___, email ___, address ___, business hours ___. Show them in the header (phone), footer, contact page and a floating WhatsApp button. Add per-page titles and meta descriptions, Open Graph tags, a sitemap and LocalBusiness structured data.
