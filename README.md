# Alfa Steam Engineers & Consultants — website

Static corporate website for Alfa Steam Engineers & Consultants: steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy.

Plain HTML, CSS and JavaScript — no framework, no runtime dependencies, no build step needed to deploy. The generated HTML pages are committed at the repository root, so the site is served exactly as checked in.

## Structure

```
index.html, about.html, services.html, industries.html,
products.html, contact.html, thank-you.html, 404.html   ← generated pages
services/*.html                                         ← generated service pages
css/styles.css                                          ← all styles
js/main.js                                              ← navigation, filters, enquiry form
images/                                                 ← favicon, OG image, optimised product images (WebP)
src/site.config.mjs                                     ← company details + all page content data
src/layout.mjs, src/pages.mjs                           ← page templates
tools/build.mjs                                         ← regenerates the HTML from src/
products/                                               ← original product images (kept as source files)
assets/, legacy/                                        ← previous site build, kept for reference (not used)
```

## Editing content

1. Edit `src/site.config.mjs` — company contact details, services, industries, components.
2. Regenerate the pages (Node 18+, no install needed):

   ```sh
   node tools/build.mjs
   ```

3. Commit the regenerated `.html` files.

Contact fields left empty (`''`) are hidden on the site; the build prints which ones are still missing. Setting `siteUrl` also enables canonical URLs and generates `sitemap.xml`.

Styling changes go directly in `css/styles.css`; behaviour in `js/main.js` (no rebuild needed for those).

## Local preview

From the repository root:

```sh
python3 -m http.server 8000     # or: npx serve .
```

Open http://localhost:8000. Links are root-relative, so serve from the repository root rather than opening files directly.

## Enquiry form

The contact form is set up for **Netlify Forms** (`data-netlify="true"`, form name `enquiry`, honeypot spam field). On a Netlify deploy with form detection enabled, submissions appear under *Forms* in the Netlify dashboard, where email notifications can be configured. When previewed locally there is no form backend, so the form shows its "could not be sent" message — that is expected.

## Product images

`images/products/*.webp` are resized, optimised copies of the files in `products/`. Some source images show third-party brand markings (e.g. `steam-traps.png`); confirm usage rights before launch or replace with your own photographs.
