# ASECON — Alfa Steam Engineers and Consultants Pvt Ltd — website

Corporate website for ASECON (Alfa Steam Engineers and Consultants Pvt Ltd): steam engineering, boiler systems, industrial audits, energy efficiency and engineering consultancy. It includes a product and service enquiry system with an Excel-compatible lead register.

- **Website:** a static multi-page site. Pages are generated from `src/` by a small Node script and bundled by **Vite** into `dist/`.
- **Enquiry server** (`server/`): Node.js 22. It accepts enquiries, stores them in SQLite, maintains the Excel register, can sync to Microsoft 365 Excel or Google Sheets, and serves the staff dashboard at `/admin/`.

**Setup on Windows, hosting, environment variables, Excel/Google connection and custom-domain DNS: see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).**

## Quick start

Requires Node.js 22.13+.

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npm run preview      # serve dist/ on http://localhost:4173
```

Enquiry server (separate terminal):

```sh
cd server
npm install
cp .env.example .env # then set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ALLOWED_ORIGINS…
npm run dev          # http://localhost:8787, dashboard at /admin/
npm test
```

## Structure

```
src/site.config.mjs        ← company details and all page content (services, industries, products…)
src/enquiry-options.mjs    ← enquiry form choices: industries, products/services, units, timelines, statuses
src/layout.mjs, pages.mjs  ← page templates; enquiry-form.mjs ← the one reusable enquiry form + modal
tools/build.mjs            ← generates the .html pages, js/search-index.json and server/src/enquiry-options.json
*.html, services/*.html    ← generated pages (committed, so the repository root is also a deployable site)
css/styles.css             ← all styles
js/main.js                 ← navigation, search, hero, filters, theme
js/enquiry.js              ← enquiry modal and form: prefill, validation, submission, states
vite.config.mjs            ← multi-page Vite build into dist/
server/                    ← enquiry API, database, Excel register, sync, email, admin dashboard
tests/enquiry.e2e.mjs      ← browser test of the enquiry flow and dashboard
images/, videos/           ← site images (WebP), logo, hero video
products/, assets/, legacy/← original source images and the previous site build, kept for reference
```

## Editing content

1. Edit `src/site.config.mjs` (company contact details, services, industries, products) or `src/enquiry-options.mjs` (enquiry form choices).
2. Run `npm run generate`. `dev` and `build` also do this.
3. Commit the regenerated `.html` files together with the `src/` change.

Contact fields left empty (`''`) are hidden on the site, and the build prints which ones are still missing. Setting `siteUrl` enables canonical URLs and generates `sitemap.xml`.

## Enquiries

Every "Enquire", "Request a quote" and "Request a consultation" button opens the same enquiry form in a modal. On the Contact page the form appears inline. Links pre-fill the product or service.

- With `ENQUIRY_API_URL` set at build time, the form submits to the enquiry server. The visitor sees a reference number (e.g. `ASE-20261013-0007`) only after the server has saved the enquiry.
- Staff work from the dashboard at `https://<enquiry-server>/admin/`: search and filter, update status and internal remarks, and export `.xlsx`. The server also keeps `ASECON-Enquiry-Register.xlsx` in its data folder up to date, and can mirror every enquiry into a Microsoft 365 Excel table or a Google Sheet.
- Without `ENQUIRY_API_URL`, the form falls back to Netlify Forms (`ENQUIRY_FALLBACK=netlify`, the default, which works only on Netlify) or shows an error (`ENQUIRY_FALLBACK=none`). It never shows a false success.

## Product images

`images/products/*.webp` are resized, optimised copies of the files in `products/`. Some source images show third-party brand markings (e.g. `steam-traps.png`). Confirm usage rights before launch, or replace them with your own photographs.
