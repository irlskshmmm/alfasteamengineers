# ASECON website — setup, build and deployment guide

This guide covers running the site on a Windows PC, building it, hosting the website and the enquiry
server, connecting the Excel register, and pointing a custom domain at both.

Nothing in this repository deploys automatically. Each step below is something a person chooses to do.

---

## 1. How the system fits together

```
 Visitor's browser
   │
   ├──► Website (static files: HTML, CSS, JS, images, video)        → any static host / CDN
   │      www.your-domain.com
   │
   └──► Enquiry server (Node.js, server/)                             → a host that runs Node 22
          enquiries.your-domain.com
            ├─ POST /api/enquiries   ← the enquiry form submits here
            ├─ /admin/               ← staff dashboard (login required)
            ├─ SQLite database       ← the system of record (DATA_DIR)
            ├─ ASECON-Enquiry-Register.xlsx  ← always-current Excel copy (DATA_DIR)
            └─ optional live sync    → Microsoft 365 Excel (OneDrive/SharePoint) or Google Sheets
```

- The **website** is static: it can be hosted anywhere that serves files over HTTPS.
- The **enquiry server** must run somewhere that executes Node.js and keeps files on disk. A domain
  name or a static host alone does **not** provide this.
- An enquiry counts as submitted only when the server has saved it to its database. The visitor then
  sees a reference such as `ASE-20261013-0007`. Spreadsheet sync happens afterwards and is retried
  automatically, so a Microsoft or Google outage never loses an enquiry.

---

## 2. Windows setup (development machine)

1. Install **Node.js 22 LTS** (22.13 or newer) from <https://nodejs.org/>. Use the Windows Installer
   (.msi) and keep the default options.
2. Install **Git for Windows** from <https://git-scm.com/download/win>.
3. Open **PowerShell** and run:

   ```powershell
   node --version          # must print v22.13.0 or newer
   git clone https://github.com/irlskshmmm/alfasteamengineers.git
   cd alfasteamengineers
   npm install             # installs Vite (website build tool)
   npm --prefix server install   # installs the enquiry server's libraries
   ```

### Run everything locally

Use two PowerShell windows.

**Window 1 — enquiry server**

```powershell
cd alfasteamengineers\server
Copy-Item .env.example .env
npm run hash-password -- "choose-a-long-local-password"
```

Open `server\.env` in Notepad and set:

```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<the scrypt$… line printed above>
COOKIE_SECURE=false
```

Then start it:

```powershell
npm run dev        # http://localhost:8787 — dashboard at http://localhost:8787/admin/
```

**Window 2 — website**

```powershell
cd alfasteamengineers
Copy-Item .env.example .env
```

In `.env` set `ENQUIRY_API_URL=http://localhost:8787` and `ENQUIRY_FALLBACK=none`, then:

```powershell
npm run dev        # http://localhost:5173
```

`npm run dev` regenerates the HTML from `src/` and starts Vite. After editing `src/*.mjs`, run
`npm run generate` (or restart `npm run dev`). Edits to `css/styles.css` and `js/*.js` reload
straight away.

---

## 3. Commands

Run these from the repository root unless noted.

| Command | What it does |
| --- | --- |
| `npm run generate` | Regenerates every `.html` page, `js/search-index.json` and `sitemap.xml` from `src/` |
| `npm run dev` | Generates, then starts the Vite dev server on port 5173 |
| `npm run build` | Generates, then builds the optimised site into `dist/` (hashed, minified CSS/JS, images and video) |
| `npm run preview` | Serves `dist/` on port 4173 to check the production build |
| `npm run test:server` | Enquiry server tests: validation, duplicates, concurrency, admin access, export, sync retry |
| `npm run test:e2e` | Browser test of the modal, form and dashboard (see section 9) |
| `npm --prefix server start` | Starts the enquiry server in production mode |
| `npm --prefix server run hash-password -- "…"` | Creates `ADMIN_PASSWORD_HASH` |
| `npm --prefix server run make-template` | Writes an empty register workbook to upload to OneDrive, SharePoint or Google |

---

## 4. Environment variables

### Website (`.env` in the repository root, used at build time)

| Variable | Example | Purpose |
| --- | --- | --- |
| `ENQUIRY_API_URL` | `https://enquiries.your-domain.com` | Where the enquiry form submits. It is baked into the HTML at build time, so rebuild after changing it. |
| `ENQUIRY_FALLBACK` | `none` or `netlify` | Used only when `ENQUIRY_API_URL` is empty. `netlify` posts to Netlify Forms, which works only when hosted on Netlify. `none` shows an error instead of pretending to send. |

On a hosting dashboard (Netlify, Cloudflare Pages, Vercel, Azure Static Web Apps), set these as
build environment variables instead of a `.env` file.

These are **public** values: they end up in the HTML. Never put a secret in a website variable.

### Enquiry server (`server/.env`, or the host's environment settings)

`server/.env.example` documents every variable. The important ones:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | yes | The exact website origins allowed to submit, e.g. `https://www.your-domain.com,https://your-domain.com`. Other origins get HTTP 403. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` | yes | Dashboard login. The hash comes from `npm run hash-password`; the plain password is never stored. |
| `COOKIE_SECURE` | yes | `true` in production (HTTPS). Use `false` only for local http testing. |
| `TRUST_PROXY` | behind a proxy | `true` when behind IIS, Nginx, Azure or Render, so rate limiting sees real visitor IPs. |
| `DATA_DIR` | yes | Folder for the SQLite database and the `.xlsx` register. It must be on persistent disk, and you should back it up. |
| `REGISTER_PATH` | no | Writes the `.xlsx` register somewhere else, e.g. a OneDrive-synced folder on a Windows server. |
| `PUBLIC_ADMIN_URL` | no | Dashboard link used in notification emails. |
| `SYNC_PROVIDER` | no | `none`, `microsoft` or `google` (see sections 6 and 7). |
| `SMTP_*`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM` | no | Email alert for each new enquiry (section 8). |

Secrets (`MS_CLIENT_SECRET`, `GOOGLE_PRIVATE_KEY`, `SMTP_PASS`, `ADMIN_PASSWORD_HASH`) belong only in
the server's environment. They must never go in the website, in Git, or in a screenshot.
`.gitignore` already excludes `.env` files.

> The password hash contains `$` characters. A plain `.env` file, Windows environment variables and
> hosting dashboards handle them as-is. In Docker Compose files, write each `$` as `$$`.

---

## 5. Hosting

### 5a. The website (static files)

**Recommended:** run `npm run build` and upload or publish the **`dist/`** folder.

| Host | Build command | Publish directory |
| --- | --- | --- |
| Cloudflare Pages / Vercel / Netlify | `npm run build` | `dist` |
| Azure Static Web Apps | `npm run build` | `dist` (app location `/`, no API) |
| IIS on Windows Server | run `npm run build` locally | copy `dist\*` to the site folder, e.g. `C:\inetpub\asecon` |
| Any shared hosting (cPanel, FTP) | run `npm run build` locally | upload the contents of `dist/` to `public_html/` |

Set `ENQUIRY_API_URL` (and `ENQUIRY_FALLBACK=none`) as a build variable so the built pages point at
the enquiry server.

**Current Netlify site:** nothing has been changed there. The generated HTML is still committed at the
repository root, so the existing Netlify configuration (publish the repository root, no build
command) keeps serving the site as before, with Netlify Forms as the enquiry fallback. Switching that
site to the Vite build is an optional, deliberate change: set the build command to `npm run build`
and the publish directory to `dist` in Netlify's site settings.

### 5b. The enquiry server (Node.js)

Choose one of these. Every option needs **HTTPS** and a **persistent disk** for `DATA_DIR`.

**Option 1 — Windows Server or an always-on office PC with IIS (the files stay on your own machine)**

1. Install Node.js 22 LTS. Copy the `server\` folder to `C:\asecon\server`, then run
   `npm install --omit=dev` there.
2. Create `C:\asecon\server\.env` with production values. Set `DATA_DIR=C:\asecon\data`,
   `TRUST_PROXY=true`, `HOST=127.0.0.1` and `PORT=8787`.
3. Run it as a Windows service with [NSSM](https://nssm.cc/):

   ```powershell
   nssm install ASECON-Enquiries "C:\Program Files\nodejs\node.exe" "--env-file=C:\asecon\server\.env src\index.mjs"
   nssm set ASECON-Enquiries AppDirectory C:\asecon\server
   nssm start ASECON-Enquiries
   ```

4. In IIS, install **URL Rewrite** and **Application Request Routing**. Create a site for
   `enquiries.your-domain.com` with an HTTPS binding (a certificate from your provider, or a free one
   via [win-acme](https://www.win-acme.com/)), and add a reverse-proxy rule to `http://127.0.0.1:8787`.
5. Optionally set `REGISTER_PATH` to a folder synced by the OneDrive client
   (e.g. `C:\Users\…\OneDrive - ASECON\Enquiries\ASECON-Enquiry-Register.xlsx`). The Excel copy then
   appears in OneDrive without any Microsoft Graph setup. Treat it as **read-only**: the server
   rewrites it, so record status and remarks in the dashboard.

**Option 2 — Azure App Service (Linux, Node 22)**

Deploy the `server/` folder with start command `npm start`. Add the variables under
*Settings → Environment variables*, set `DATA_DIR=/home/data` (persistent storage) and
`TRUST_PROXY=true`, and add the custom domain `enquiries.your-domain.com` with a managed certificate.

**Option 3 — Render, Railway, Fly.io or a VPS**

Root directory `server`, build `npm install`, start `npm start`. Attach a **persistent disk** mounted
at `DATA_DIR`. Without a disk, enquiries are lost when the service restarts. Set `TRUST_PROXY=true`.

After deploying, check `https://enquiries.your-domain.com/api/health`. It should return
`{"ok":true,…}`. Then sign in at `https://enquiries.your-domain.com/admin/`.

---

## 6. Microsoft 365 Excel sync (Option A — recommended if ASECON uses Microsoft 365)

This keeps an Excel workbook in OneDrive or SharePoint up to date with every enquiry and status change.

1. Create the workbook: `npm --prefix server run make-template`. Upload
   `ASECON-Enquiry-Register-template.xlsx` to the SharePoint site or OneDrive folder staff will use.
   It already contains the table **Enquiries**; don't rename the table or its columns.
2. In the **Microsoft Entra admin center**, go to *App registrations → New registration*
   (single tenant, no redirect URI).
3. Under *Certificates & secrets*, create a client secret and note its expiry date.
4. Under *API permissions*, choose *Microsoft Graph → Application permissions* and add
   **Sites.Selected** (recommended: access to just one site) or **Files.ReadWrite.All**. Then click
   **Grant admin consent**. A Microsoft 365 admin must do this step. With `Sites.Selected`, the admin
   also grants the app `write` on that one site through Graph or PowerShell.
5. Find the workbook's Graph URL. In Graph Explorer, signed in as a user who can open the file:
   - OneDrive: `GET https://graph.microsoft.com/v1.0/me/drive/root:/Enquiries/ASECON-Enquiry-Register-template.xlsx`
   - SharePoint: `GET https://graph.microsoft.com/v1.0/sites/{site-id}/drive/root:/{path}`

   Note `parentReference.driveId` and `id`. The URL is
   `https://graph.microsoft.com/v1.0/drives/{driveId}/items/{id}`.
6. Set these on the server:

   ```
   SYNC_PROVIDER=microsoft
   MS_TENANT_ID=…
   MS_CLIENT_ID=…
   MS_CLIENT_SECRET=…
   MS_WORKBOOK_URL=https://graph.microsoft.com/v1.0/drives/…/items/…
   MS_TABLE_NAME=Enquiries
   ```

7. Restart the server. The dashboard's *Spreadsheet sync* tile should say *Microsoft Excel*. New
   enquiries show **Synced** in the *Sheet* column; failures show **Retrying** or **Failed** with the
   reason, and *Retry spreadsheet sync* re-queues them. Client secrets expire, so renew them before the date
   noted in step 3.

Staff can sort and filter the Excel table freely. Edit **Status** and **Internal Remarks** in the
dashboard, not in Excel. The server updates those cells, so changes made directly in Excel can be
overwritten.

## 7. Google Sheets sync (Option B)

1. In Google Cloud Console, create a project and enable the **Google Sheets API**. Create a
   **service account**, then add a JSON key.
2. Create a Google Sheet with a tab named **Enquiries**. The server writes the header row on first
   use. Share the sheet with the service account's email as **Editor**, and with nobody else
   publicly.
3. Set these on the server:

   ```
   SYNC_PROVIDER=google
   GOOGLE_SERVICE_ACCOUNT_EMAIL=…@….iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
   GOOGLE_SPREADSHEET_ID=<the long id in the sheet URL>
   GOOGLE_SHEET_NAME=Enquiries
   ```

## 8. Email notifications (optional)

Use any SMTP service: Microsoft 365 (`smtp.office365.com:587` with an app-enabled mailbox), Google
Workspace SMTP relay, Zoho, SendGrid, or similar. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL_FROM` and `NOTIFY_EMAIL_TO` (the mailbox ASECON chooses;
none is pre-set). The email contains the reference, company, contact, industry and product, plus a
dashboard link. Full details stay behind the login. A failed email never blocks or loses an enquiry.

---

## 9. Testing

```powershell
npm run test:server
```

The browser test needs Playwright (`npm install --no-save playwright` and
`npx playwright install chromium`), a test enquiry server with its **own** `DATA_DIR`, and a site
built against it:

```powershell
# server\.env.test: DATA_DIR=./data-test, ALLOWED_ORIGINS=http://localhost:4173, COOKIE_SECURE=false, admin user/hash
node --env-file=server\.env.test server\src\index.mjs
$env:ENQUIRY_API_URL="http://127.0.0.1:8787"; npm run build; npm run preview
$env:SITE_URL="http://localhost:4173"; $env:API_URL="http://127.0.0.1:8787"; $env:ADMIN_USER="admin"; $env:ADMIN_PASS="…"; npm run test:e2e
```

Test records are clearly labelled (`TEST — …` companies, `TEST RECORD` descriptions). Never point
the test at the production server or `DATA_DIR`.

---

## 10. Custom domain and DNS

Make these changes at your domain registrar or DNS provider when you are ready to go live. Nothing in
this repository changes DNS.

| Record | Name | Value | Purpose |
| --- | --- | --- | --- |
| `CNAME` | `www` | the static host's target (e.g. `your-site.pages.dev`, `your-site.netlify.app`) | Website |
| `A` / `ALIAS` / `ANAME` | `@` (apex) | the static host's apex IP or flattening target, as its docs specify | Website without `www` (redirect it to `www`) |
| `CNAME` or `A` | `enquiries` | the enquiry server's hostname or the Windows server's public IP | Enquiry API and dashboard |
| `TXT` | as instructed | verification value | Domain verification required by Azure, Google or Microsoft |

Then:

1. Add `www.your-domain.com` (and the apex) as custom domains on the static host, and let it issue
   HTTPS certificates.
2. Add `enquiries.your-domain.com` on the server host (or bind it in IIS) with HTTPS.
3. Set `ALLOWED_ORIGINS=https://www.your-domain.com,https://your-domain.com` on the server.
4. Set `ENQUIRY_API_URL=https://enquiries.your-domain.com` and `ENQUIRY_FALLBACK=none` for the website
   build, then rebuild and redeploy the website.
5. Optionally set `siteUrl` in `src/site.config.mjs` to `https://www.your-domain.com`. This enables
   canonical URLs, absolute social-share image links and `sitemap.xml`.
6. Submit one enquiry marked **TEST** and confirm it appears in the dashboard (and in Excel or Google
   if sync is on). Then set its status to *Closed* with the remark "test".

Buying a domain only gives you the name. Hosting for the website and for the enquiry server is
arranged separately, as above.

---

## 11. Backups and housekeeping

- Back up `DATA_DIR` daily (`enquiries.sqlite*` and the `.xlsx`). Examples: Windows Server Backup,
  a scheduled `robocopy` to a OneDrive or SharePoint folder, or the host's disk snapshots.
- *Export .xlsx* in the dashboard downloads the current, filtered register at any time.
- To change the admin password, generate a new hash, update `ADMIN_PASSWORD_HASH` and restart.
  Existing sessions expire within `SESSION_TTL_HOURS`.
- Renew the Microsoft client secret before it expires.
