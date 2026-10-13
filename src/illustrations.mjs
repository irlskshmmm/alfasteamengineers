// Original line-art illustrations drawn for ASECON (120 × 120 grid).
// Strokes use currentColor; `.acc` marks the single orange accent in each drawing.
// Animated parts: `.steam` (rising curls), `.flow` (moving dashes), `.gear` / `.needle` (rotate on hover), `.flame` (flicker).

const art = {
  // ---- Industries
  power: `
    <path d="M12 102H108"/>
    <path d="M24 102C31 78 31 56 22 32H54C45 56 45 78 52 102"/>
    <path d="M60 102C65 84 65 66 58 48H82C75 66 75 84 80 102"/>
    <path d="M28 46H48M30 70H46"/>
    <path class="steam" d="M30 26c-6-5 5-9 0-15M39 26c-6-5 5-9 0-15M48 26c-6-5 5-9 0-15"/>
    <path class="steam steam-2" d="M66 42c-5-4 4-8 0-13M75 42c-5-4 4-8 0-13"/>
    <path d="M96 102L101 60L106 102M94 70H108M95 82H107"/>
    <path class="acc" d="M101 38l-6 10h7l-6 10"/>`,
  oilgas: `
    <path d="M10 102H110"/>
    <rect x="50" y="22" width="16" height="80" rx="3"/>
    <path d="M50 38H66M50 54H66M50 70H66M50 86H66"/>
    <path d="M14 102V82a14 5 0 0 1 28 0V102"/><path d="M14 82a14 5 0 0 0 28 0"/>
    <path d="M42 92H50M66 64H86"/>
    <path d="M90 102V40M86 102L90 72L94 102"/>
    <path class="acc flame" d="M90 36c-5-5 1-9 0-16 6 5 7 10 0 16z"/>`,
  chemical: `
    <path d="M36 36H84"/>
    <path d="M40 36V82Q40 98 60 98Q80 98 80 82V36"/>
    <path d="M54 14h12v8H54z"/><path d="M60 22V80"/>
    <path class="acc" d="M48 80H72M52 66H68"/>
    <path d="M80 50H98V28M22 28V58H40"/>
    <path d="M60 98V108M50 108H70"/>
    <circle class="acc steam" cx="50" cy="52" r="2.5"/><circle class="acc steam steam-2" cx="70" cy="46" r="2"/>`,
  pharma: `
    <g transform="rotate(-35 42 64)"><rect x="22" y="55" width="40" height="18" rx="9"/><path class="acc" d="M42 55h11a9 9 0 0 1 0 18H42"/></g>
    <circle cx="84" cy="64" r="22"/><circle cx="84" cy="64" r="14"/>
    <path d="M84 50V40M76 86L72 98M92 86L96 98M66 98H102"/>
    <path class="steam" d="M78 34c-5-4 4-8 0-13M90 34c-5-4 4-8 0-13"/>`,
  food: `
    <path d="M26 56H94"/>
    <path d="M32 56V76Q32 96 60 96Q88 96 88 76V56"/>
    <path d="M38 62V76Q38 90 60 90Q82 90 82 76V62"/>
    <path d="M42 92L38 106M78 92L82 106"/>
    <path class="steam" d="M46 48c-6-6 5-10 0-18M60 46c-6-6 5-10 0-18M74 48c-6-6 5-10 0-18"/>
    <path d="M88 70H98"/><circle class="acc" cx="104" cy="70" r="6"/>`,
  manufacturing: `
    <path d="M10 102H110"/>
    <path d="M14 102V66L30 54V66L46 54V66L62 54V66H78V40H90V102"/>
    <path d="M22 78h8v8h-8zM40 78h8v8h-8zM58 78h8v8h-8z"/>
    <g class="gear acc"><circle cx="98" cy="30" r="10" stroke-width="6" stroke-dasharray="4 3.85"/><circle cx="98" cy="30" r="4"/></g>`,
  paper: `
    <circle cx="32" cy="40" r="12"/><circle cx="60" cy="40" r="12"/><circle cx="88" cy="40" r="12"/>
    <circle cx="46" cy="78" r="12"/><circle cx="74" cy="78" r="12"/>
    <path class="acc flow" d="M8 62C20 62 22 28 32 28S42 90 46 90S56 28 60 28S70 90 74 90S84 28 88 28S100 62 112 62"/>
    <path class="steam" d="M54 16c-4-4 3-7 0-11M66 16c-4-4 3-7 0-11"/>`,
  textiles: `
    <path d="M18 100L28 46H42L52 100Z"/><path d="M24 64H46M22 78H48M20 90H50"/>
    <circle cx="88" cy="76" r="18"/><circle cx="88" cy="76" r="6"/>
    <path d="M88 58H110M106 58V100"/>
    <path class="acc" d="M35 46C36 26 66 22 88 58"/>`,
  sugar: `
    <rect x="32" y="20" width="20" height="82" rx="3"/>
    <path d="M32 40H52M32 58H52M32 76H52"/>
    <path d="M52 30H74V44c9 0 9 8 0 8 9 0 9 8 0 8 9 0 9 8 0 8V86"/>
    <path d="M66 86h18v16H66z"/>
    <path d="M14 102V42M14 56h5M14 74h5M14 88h5"/>
    <path class="acc" d="M75 90c-3 4-3 7 0 7s3-3 0-7z"/>
    <path d="M10 102H110"/>`,
  dairy: `
    <path d="M26 102V60L32 52V42H50V52L56 60V102Z"/><path d="M34 42h14v-6H34z"/>
    <path d="M26 76H56"/>
    <rect x="70" y="40" width="32" height="62" rx="2"/>
    <path d="M76 46V96M82 46V96M88 46V96M94 46V96"/>
    <path d="M56 64H70M102 54H112"/>
    <path class="acc flow" d="M72 88H100"/>`,

  // ---- Expertise
  steam: `
    <path d="M8 44H58V82H112M58 44V22H96"/>
    <path d="M30 36v16l12-8zM42 36v16l-12-8z"/>
    <circle cx="96" cy="22" r="6"/>
    <path class="acc flow" d="M8 44H58V82H112"/>`,
  boiler: `
    <rect x="14" y="44" width="78" height="42" rx="21"/>
    <path d="M32 58H80M32 72H80"/>
    <path d="M86 44V18H96V44"/>
    <path class="steam" d="M90 12c-4-4 3-7 0-11"/>
    <path class="acc flame" d="M30 82c-4-6 2-9 0-15 6 5 7 10 0 15z"/>
    <path d="M26 86L22 100M80 86L84 100M12 100H96"/>`,
  trap: `
    <path d="M10 56H38M82 56H110"/>
    <circle cx="60" cy="56" r="22"/><circle cx="60" cy="58" r="9"/>
    <path d="M52 34V26H68V34"/>
    <path class="acc" d="M60 88c-5 6-6 12 0 12s5-6 0-12z"/>`,
  audit: `
    <path d="M28 24H82V104H28Z"/><path d="M44 18H66V30H44Z"/>
    <path d="M38 46l4 4 8-8M56 46H72M38 64l4 4 8-8M56 64H72"/>
    <circle cx="86" cy="88" r="16"/>
    <path class="acc needle" d="M86 88l7-8"/>`,
  efficiency: `
    <path d="M36 18v56a11 11 0 1 0 10 0V18a5 5 0 0 0-10 0z"/>
    <path class="acc" d="M41 46V82"/>
    <path d="M68 34a26 26 0 1 1 0 52"/><path d="M68 34l8-6M68 34l8 6"/>
    <path class="steam" d="M90 52c-4-4 3-7 0-11"/>`,
  valves: `
    <circle cx="56" cy="28" r="14"/><path d="M42 28H70M56 14V42"/>
    <path d="M56 42V54"/>
    <path d="M40 54H72L78 68L72 82H40L34 68Z"/>
    <path d="M8 68H34M78 68H112"/>
    <circle cx="96" cy="34" r="12"/>
    <path class="acc needle" d="M96 34l6-6"/>`,
  consulting: `
    <path d="M14 26H84V104H14Z"/>
    <path d="M14 46H84M14 66H84M14 86H84M34 26V104M54 26V104" stroke-opacity="0.35"/>
    <path d="M24 92V60H46V76H70"/>
    <path d="M96 16L82 72M96 16L108 72"/>
    <circle class="acc" cx="96" cy="16" r="4"/>
    <path class="acc" d="M82 72a14 6 0 0 0 26 0"/>`,
  support: `
    <g class="gear acc"><circle cx="78" cy="40" r="16" stroke-width="7" stroke-dasharray="5 4.4"/><circle cx="78" cy="40" r="6"/></g>
    <path d="M24 98L58 64a14 14 0 1 1 10-10L34 108a7 7 0 0 1-10-10z"/>
    <path d="M62 50l6 6"/>`,
};

export const illustration = (key, cls = 'ill') =>
  `<svg class="${cls}" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${art[key] || ''}</svg>`;
