# Sworn Translators Sri Lanka Directory

A mobile-first static directory prototype for finding sworn translators, previewing illustrative document layouts, submitting local listing requests, and checking registration numbers against the loaded dataset.

## Project contents

```text
sworn-translators-lk/
├── index.html
├── css/styles.css
├── js/app.js
├── data/translators.json
├── samples/                       # Watermarked illustrative placeholders
├── templates/                     # Editable Word starter templates
└── README.md
```

The initial `data/translators.json` was generated from the Excel workbook supplied for this build. It contains normalized directory rows and supports language columns 1–6. Check the source date, accuracy, permission to republish personal data, and current registration status before making it publicly accessible.

## Features

- Search by name, registration number, address, telephone, email, district, court, and language.
- Language, district, and court filters; popular languages appear first in the requested order.
- Paginated responsive listings and contact links where details are present.
- Registration lookup against the currently loaded local dataset.
- Illustrative sample-document gallery with four sample pages per document type.
- Local translator listing form, math challenge for reviews, and demo review moderation.
- XLSX/XLS/CSV/JSON import, local dataset persistence, JSON export, and ZIP archive export.
- Editable `.docx` starter templates for birth, marriage, and death certificate translation workflows.
- Responsive advertising placeholders for future approved ad units.

## Important production limitations

This is a **static front-end application**, not a fully secure multi-user production service.

1. **`localStorage` is per browser/device.** Registration requests and reviews are not sent to the site owner or shared with other visitors. Imported data and browser-side registrations persist only in that browser.
2. **Client-side moderation is not secure.** The demo passphrase in `js/app.js` is visible to anyone who inspects the source. Do not rely on it to protect real moderation.
3. **The math challenge is only a basic friction measure.** It does not prevent automated abuse. A public review system needs server-side validation, rate limiting, abuse reporting, privacy controls, and ideally a robust challenge provider.
4. **Verification is not live or authoritative.** The lookup matches the JSON dataset currently deployed or overridden in the browser. It does not query the Ministry of Justice or a court and does not prove current registration.
5. **Legal guidance is informational.** Requirements can vary by receiving authority and change over time. Confirm all legal formalities directly with the relevant court, Ministry or receiving institution. Word templates are generic drafting aids, not official forms.
6. **Sample images are deliberately generic placeholders.** They are watermarked and are not reproductions of real certificates or identity documents. Replace them only with lawful, authorized sample material.
7. **Ad placements are placeholders, not active AdSense ads.** Approval is not guaranteed by layout or code alone.
8. **Personal data and privacy.** The supplied dataset may include personal addresses and contact details. Before public deployment, confirm the lawful basis and permission to publish each field, provide a privacy notice, establish correction/removal procedures, and avoid publishing unnecessary personal data.

For a genuinely production-ready public service, add a backend (for example, Cloudflare Workers + D1), admin authentication, role-based access, server-side validation, audit logs, backups, moderation queues, privacy workflows, and rate limiting. Do not treat a static HTML application as a shared database.

## Run locally

The app uses `fetch()` for its JSON database, so run it through a local HTTP server rather than opening `index.html` directly as a `file://` URL.

Examples:

```bash
# Python 3
python -m http.server 8080
```

Then open `http://localhost:8080`.

The Excel/CSV importer uses SheetJS and the ZIP exporter uses JSZip from public CDNs. A network connection is needed for those libraries unless you vendor approved copies locally.

## Update the dataset from Excel / CSV / JSON

1. Open the deployed website in a browser.
2. Go to **Site owner tools**.
3. Choose the updated `.xlsx`, `.xls`, `.csv`, or `.json` file.
4. Select **Replace current local dataset** to replace, or uncheck it to append.
5. Choose **Import selected file**.
6. Click **Export current JSON** and save `translators.json`.
7. Replace `data/translators.json` in your project with that exported file.
8. Commit and redeploy the updated project to publish the dataset to every visitor.

The expected columns can use either the Excel headers (`No`, `R. Number`, `Full Name`, `Address`, `Tel No`, `Mail Address`, `District`, `District Court`, `Language 1` through `Language 6`) or normalized keys (`no`, `r_number`, `name`, `address`, `tel`, `email`, `district`, `court`, `lang1` through `lang6`).

The browser importer can append rows in the local view, but it cannot write to the deployed JSON file by itself. The browser ZIP exporter includes the dataset currently loaded in that browser; it does not include local registration requests or reviews.

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Create a Git repository containing the contents of this project folder.
2. Push it to GitHub or another Git provider supported by Cloudflare Pages.
3. In Cloudflare, open **Workers & Pages** and create a Pages project connected to the repository.
4. For a plain static site, set the build command to blank / no build command and the output directory to `/` (the repository root, where `index.html` lives). If the dashboard requires a build command, use the no-build static deployment option.
5. Deploy and test the generated `pages.dev` URL before attaching your domain.

### Option B — Direct upload

Use Cloudflare Pages direct upload if suitable for your workflow. Upload the project folder contents (not the ZIP file as a web page). Follow the current Cloudflare dashboard instructions for the chosen deployment method.

### Attach a custom `.lk` domain

1. Add or select your domain in Cloudflare and follow the current domain onboarding instructions.
2. In the Pages project, open **Custom domains** and add the desired hostname, such as `example.lk` or `www.example.lk`.
3. Follow the exact DNS and nameserver instructions shown by Cloudflare. The steps differ depending on whether the domain is already using Cloudflare DNS.
4. Wait for DNS/TLS provisioning, then test HTTPS, redirects, and both apex/`www` hostnames if you plan to serve both.
5. Keep an independent copy of your data file and project repository. DNS and dashboard labels can change; follow current Cloudflare documentation rather than copying stale screenshots.

## Google AdSense preparation

The page contains visual placeholders for a responsive header leaderboard, an in-feed slot, and a sidebar/in-content slot. They do not load advertisements.

Before applying:
- Publish original, useful content and a clear site purpose.
- Add accurate About, Contact, Privacy Policy, and Terms pages appropriate to the actual service.
- Ensure ownership of the domain and compliance with current AdSense publisher policies.
- Avoid misleading “official” claims and disclose directory limitations and data update dates.
- Verify that directory data may lawfully be republished and provide a route for corrections or removal.
- Test mobile usability, page speed, accessibility, broken links, and all form states.
- Add the AdSense script and ad-unit markup only after approval and according to current Google instructions. Do not click your own ads or encourage others to do so.

AdSense approval is determined by Google and cannot be guaranteed by this code.

## Accessibility and maintenance

- Semantic landmarks, labels, keyboard focus indicators, responsive layout, and reduced-motion support are included.
- Core palette tokens are defined at the top of `css/styles.css` using the requested four CSS variables.
- Keep the JavaScript framework-free for easy maintenance. If the dataset grows substantially, use server-side or indexed search rather than loading the entire directory into every browser.
- Review console errors and test the site after each dataset update.
