// Single source of truth for company details and site content.
// Edit this file, then run `node tools/build.mjs` to regenerate the HTML pages.
//
// Leave a field as '' until the real value is confirmed — empty fields are
// simply not rendered, and the build prints a reminder listing them.

export const company = {
  name: 'Alfa Steam Engineers and Consultants Pvt Ltd',
  brand: 'ASECON',
  shortName: 'Alfa Steam Engineers and Consultants',
  tagline: 'Steam engineering, boiler systems, audits and energy efficiency consultancy.',
  // Contact details — TO CONFIRM before launch.
  phone: '',          // e.g. '+91 98765 43210' (display format)
  phoneHref: '',      // e.g. '+919876543210'
  whatsapp: '',       // digits only with country code, e.g. '919876543210'
  email: '',          // e.g. 'info@alfasteam.in'
  address: '',        // full postal address, one line
  city: '',           // e.g. 'Pune, Maharashtra'
  hours: '',          // e.g. 'Mon–Sat, 9:30 am – 6:30 pm'
  gstin: '',
  cin: '',
};

// Absolute site URL without trailing slash, e.g. 'https://www.alfasteam.in'.
// Used for canonical links, Open Graph URLs and sitemap.xml. Leave '' to skip.
export const siteUrl = '';

// Hero background video (muted, looping, low opacity). Put the clip at this
// path — prepare it with tools/prepare-hero-video.sh. It is only rendered when
// the file exists, so the site works without it.
export const heroVideo = {
  webm: '/videos/hero-power-plant.webm',
  mp4: '/videos/hero-power-plant.mp4',
  poster: '/videos/hero-power-plant.jpg',
  credit: '', // e.g. 'Video: <author> on Pexels' — shown small in the hero corner
};

export const nav = [
  { label: 'About', href: '/about.html' },
  { label: 'Services', href: '/services.html', children: 'services' },
  { label: 'Industries', href: '/industries.html' },
  { label: 'Components', href: '/products.html' },
  { label: 'Contact', href: '/contact.html' },
];

export const services = [
  {
    slug: 'steam-engineering',
    title: 'Steam Engineering',
    icon: 'steam',
    short: 'Design, review and optimisation of steam generation, distribution and condensate recovery systems.',
    lead: 'A steam system is only as good as its weakest link — an undersized line, a failed trap, a missing separator. We look at the whole loop, from boiler outlet to condensate return, and engineer it to deliver dry steam at the right pressure where your process needs it.',
    scope: [
      ['Steam distribution design', 'Line sizing, header layout, drainage points, expansion and venting for new and modified networks.'],
      ['Pressure reduction & control', 'Selection and layout of PRV stations, control valves and safety relief for each process user.'],
      ['Steam trapping', 'Trap type selection by application, trap station layout and trap survey programmes.'],
      ['Condensate recovery', 'Return line design, flash steam recovery and pumping solutions to bring heat back to the boiler house.'],
      ['Steam quality', 'Separators, strainers and air venting to improve dryness and protect heat transfer surfaces.'],
      ['Process heating applications', 'Heat exchangers, jacketed vessels, dryers and tracing — sized for stable, efficient operation.'],
    ],
    deliverables: ['Engineering drawings and P&IDs', 'Line and equipment sizing calculations', 'Bill of materials and specifications', 'Installation and commissioning guidance'],
    signs: ['Wet steam, water hammer or slow process heat-up', 'Condensate being drained to waste', 'Plant expansion or new process equipment planned', 'Frequent trap, valve or gasket failures'],
    products: ['steam-traps', 'float-steam-trap', 'control-valves', 'strainers', 'globe-valves', 'pressure-gauges'],
  },
  {
    slug: 'boiler-systems',
    title: 'Boiler Systems',
    icon: 'boiler',
    short: 'Engineering support for boilers and boiler house auxiliaries — selection, operation, maintenance and upgrades.',
    lead: 'The boiler house is the heart of a steam plant. We support owners and operators across the boiler lifecycle — choosing the right equipment, keeping it running safely, and improving how it performs day to day.',
    scope: [
      ['Boiler selection & sizing', 'Matching boiler type, capacity and fuel to your steam demand profile and site constraints.'],
      ['Boiler house auxiliaries', 'Feed water systems, deaeration, blowdown, chimney and fuel handling reviews.'],
      ['Combustion & controls', 'Burner and combustion checks, instrumentation and control panel upgrades.'],
      ['Water treatment interface', 'Feed water and blowdown practices that protect tubes and reduce losses.'],
      ['Maintenance & spares support', 'Planned maintenance guidance and sourcing of boiler tubes, valves, gauges and fittings.'],
      ['Retrofit & upgrade studies', 'Economisers, heat recovery, automation and capacity upgrades for existing boilers.'],
    ],
    deliverables: ['Condition and performance observations', 'Upgrade options with technical comparison', 'Specifications for equipment and spares', 'Operation and maintenance recommendations'],
    signs: ['Rising fuel consumption for the same output', 'Frequent tube failures or scaling', 'Planning a new boiler or a fuel change', 'Unstable steam pressure during peak demand'],
    products: ['boiler-tubes', 'pressure-gauges', 'level-switches', 'control-panels', 'globe-valves', 'gaskets'],
  },
  {
    slug: 'industrial-audits',
    title: 'Industrial Audits',
    icon: 'audit',
    short: 'Structured, on-site assessment of steam, boiler and utility systems with clear, prioritised findings.',
    lead: 'An audit turns walk-down observations and measurements into decisions. We assess how your steam and utility systems actually operate, document where losses and risks sit, and give you a prioritised action list you can budget against.',
    scope: [
      ['Steam system audit', 'Generation, distribution, end use and condensate return assessed as one system.'],
      ['Steam trap survey', 'Trap-by-trap inspection with status, application suitability and replacement recommendations.'],
      ['Boiler performance assessment', 'Efficiency evaluation from fuel, flue gas, feed water and blowdown observations.'],
      ['Insulation survey', 'Identification of bare or damaged insulation on lines, valves and flanges.'],
      ['Safety & reliability review', 'Observations on safety valves, drainage, water hammer risks and maintenance practices.'],
      ['Utility metering review', 'Assessment of fuel, steam, water and condensate measurement for ongoing monitoring.'],
    ],
    deliverables: ['Written audit report with findings and photographs', 'Prioritised list of recommendations', 'Estimated savings and implementation cost where measurable', 'Follow-up review on request'],
    signs: ['No clear picture of where steam is being used or lost', 'Preparing an energy-saving or capex plan', 'Recurring breakdowns without a clear root cause', 'Management or compliance review coming up'],
    products: ['pressure-gauges', 'temperature-probes', 'water-meters', 'steam-traps'],
  },
  {
    slug: 'energy-efficiency',
    title: 'Energy Efficiency',
    icon: 'energy',
    short: 'Practical measures to reduce fuel, steam and water consumption — identified, quantified and implemented.',
    lead: 'In most steam plants the cheapest unit of energy is the one you stop wasting. We identify efficiency measures, quantify them against your own operating data, and support implementation so the savings are actually realised.',
    scope: [
      ['Heat recovery', 'Flash steam, blowdown heat and flue gas recovery opportunities.'],
      ['Condensate return improvement', 'Increasing return rates to cut fuel, water and treatment chemical use.'],
      ['Trap and leak management', 'Programmes to find and fix steam losses and keep them fixed.'],
      ['Insulation upgrades', 'Specification of insulation for lines, valves and fittings with payback estimates.'],
      ['Combustion optimisation', 'Air–fuel ratio, excess air and burner tuning recommendations.'],
      ['Monitoring & targeting', 'Metering and KPIs so consumption can be tracked after improvements are made.'],
    ],
    deliverables: ['Energy-saving measures with estimated payback', 'Technical specifications for selected measures', 'Implementation and vendor coordination support', 'Post-implementation verification'],
    signs: ['Fuel cost is a large share of operating cost', 'Visible steam leaks or plumes from vents', 'Low condensate return to the boiler house', 'Sustainability or emissions targets to meet'],
    products: ['steam-traps', 'float-steam-trap', 'temperature-sensors', 'water-meters', 'control-valves'],
  },
  {
    slug: 'engineering-consultancy',
    title: 'Engineering Consultancy',
    icon: 'consult',
    short: 'Independent technical advice for projects, procurement and plant problems — from concept to commissioning.',
    lead: 'Sometimes you need an experienced engineer on your side of the table. We provide independent consultancy for steam and thermal utility projects, technical evaluation of vendor offers, and troubleshooting when something on the plant is not working as it should.',
    scope: [
      ['Project engineering', 'Concept, basic and detailed engineering for steam and thermal utility packages.'],
      ['Technical specifications', 'Equipment and material specifications for tendering and purchase.'],
      ['Bid evaluation', 'Technical comparison of vendor offers against your specification.'],
      ['Troubleshooting', 'Root-cause investigation of process heating, water hammer, pressure and capacity issues.'],
      ['Installation supervision', 'Site checks during erection, testing and commissioning.'],
      ['Component sourcing', 'Identifying and supplying the right valves, traps, instruments and fittings for the job.'],
    ],
    deliverables: ['Technical reports and recommendations', 'Specifications and bid comparison sheets', 'Site visit reports', 'Commissioning checklists'],
    signs: ['A new steam or utility project at concept stage', 'Several vendor quotes that are hard to compare', 'A plant problem that keeps coming back', 'No in-house steam specialist'],
    products: ['control-valves', 'globe-valves', 'ball-valves', 'butterfly-valves', 'flanges', 'control-panels'],
  },
];

// `featured` industries mirror the icons in the ASECON logo.
export const industries = [
  { name: 'Power Plants', icon: 'power', featured: true, note: 'Boiler houses, auxiliary steam and condensate systems.' },
  { name: 'Agro & Food Processing', icon: 'agro', featured: true, note: 'Cooking, drying, pasteurising, CIP and sterilisation.' },
  { name: 'Pharmaceuticals & Chemicals', icon: 'pharma', featured: true, note: 'Process vessels, reactors, sterilisers and clean utilities.' },
  { name: 'Manufacturing & Engineering', icon: 'gears', featured: true, note: 'Process heating, curing, drying and plant utilities.' },
  { name: 'Oil & Gas', icon: 'rig', featured: true, note: 'Tracing, tank heating, reboilers and utility steam.' },
  { name: 'Dairy', note: 'Pasteurisers, evaporators and cleaning systems.' },
  { name: 'Textiles', note: 'Dyeing, drying, stentering and finishing.' },
  { name: 'Paper & Packaging', note: 'Drying cylinders, corrugators and heating.' },
  { name: 'Sugar & Distilleries', note: 'Evaporation, distillation and process heating.' },
  { name: 'Rubber & Tyre', note: 'Curing presses and vulcanisers.' },
  { name: 'Hospitals & Hospitality', note: 'Laundries, kitchens, sterilisation and hot water.' },
  { name: 'Edible Oil & Solvent Extraction', note: 'Refining, deodorising and extraction plants.' },
];

export const productCategories = [
  { key: 'steam', label: 'Steam & Condensate' },
  { key: 'valves', label: 'Valves' },
  { key: 'instruments', label: 'Instrumentation' },
  { key: 'boiler', label: 'Boiler & Piping' },
  { key: 'electrical', label: 'Panels & Electricals' },
];

export const products = [
  { id: 'steam-traps', name: 'Steam Traps', cat: 'steam', desc: 'Traps for mains drainage, tracing and process equipment, selected by application.' },
  { id: 'float-steam-trap', name: 'Ball Float Steam Traps', cat: 'steam', desc: 'Continuous condensate discharge for heat exchangers and process users.' },
  { id: 'strainers', name: 'Strainers & Screens', cat: 'steam', desc: 'Y-type and basket strainer elements to protect traps, valves and equipment.' },
  { id: 'globe-valves', name: 'Globe Valves', cat: 'valves', desc: 'Isolation and throttling valves for steam and condensate service.' },
  { id: 'control-valves', name: 'Control Valves', cat: 'valves', desc: 'Pneumatic and electric control valves for pressure and temperature control.' },
  { id: 'ball-valves', name: 'Ball Valves', cat: 'valves', desc: 'Quarter-turn isolation valves for utilities and process lines.' },
  { id: 'butterfly-valves', name: 'Butterfly Valves', cat: 'valves', desc: 'Compact isolation for larger water and utility lines.' },
  { id: 'solenoid-valves', name: 'Solenoid Valves', cat: 'valves', desc: 'On/off automation for water, air and low-pressure steam lines.' },
  { id: 'pressure-gauges', name: 'Pressure Gauges', cat: 'instruments', desc: 'Gauges with siphons and isolation for boilers, headers and process users.' },
  { id: 'temperature-sensors', name: 'Temperature Sensors', cat: 'instruments', desc: 'Sensors and transmitters for process and utility temperature measurement.' },
  { id: 'temperature-probes', name: 'Thermocouples & RTD Probes', cat: 'instruments', desc: 'Probes for flue gas, feed water and process temperature monitoring.' },
  { id: 'level-switches', name: 'Level & Float Switches', cat: 'instruments', desc: 'Level detection for feed tanks, condensate receivers and vessels.' },
  { id: 'water-meters', name: 'Water Meters', cat: 'instruments', desc: 'Make-up and feed water metering for monitoring and audits.' },
  { id: 'boiler-tubes', name: 'Boiler Tubes', cat: 'boiler', desc: 'Tubes for boiler repair, retubing and heat exchanger service.' },
  { id: 'flanges', name: 'Flanges', cat: 'boiler', desc: 'Weld-neck, slip-on and blind flanges for steam and utility piping.' },
  { id: 'gaskets', name: 'Gaskets', cat: 'boiler', desc: 'Spiral wound, graphite and elastomer gaskets for flanged joints.' },
  { id: 'mechanical-seals', name: 'Mechanical Seals', cat: 'boiler', desc: 'Seals for boiler feed and condensate transfer pumps.' },
  { id: 'control-panels', name: 'Control Panels', cat: 'electrical', desc: 'Boiler house and utility control panels with indication and protection.' },
  { id: 'mcb-switches', name: 'MCBs & Protection', cat: 'electrical', desc: 'Miniature circuit breakers and protection devices for panels.' },
  { id: 'contactors', name: 'Contactors', cat: 'electrical', desc: 'Contactors for pump, fan and motor starters.' },
  { id: 'cables', name: 'Power & Control Cables', cat: 'electrical', desc: 'Armoured power and control cabling for plant installations.' },
];

export const process = [
  ['Enquiry', 'Tell us about your plant, the problem or the project. We respond with the questions and data we need.'],
  ['Site study', 'Our engineers walk the system, take observations and review operating data with your team.'],
  ['Analysis & report', 'We engineer the solution and present clear, prioritised recommendations.'],
  ['Implementation support', 'Specifications, components, supervision and verification until the result is delivered.'],
];
