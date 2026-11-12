# Cozy Book World – Free Conversion Tracking V1 (staging only)

Status: **prepared, not deployed**. No live site changes, no Cloudflare resources created.

## Architecture
- GitHub Pages retains the website; Cloudflare Web Analytics retains page views.
- A Cloudflare Worker receives anonymous click events, validates event/book/language, and increments aggregate daily counts in Cloudflare D1.
- No cookies, names, IP addresses, user IDs, referral URLs or individual click records are stored by this application. Cloudflare may process operational request metadata; review the privacy notice before activation.
- The public event endpoint can be spoofed or automated: figures are indicative, not verified human clicks. CORS is not authentication or bot protection.
- Click events are best effort. Network failures, blockers or immediate navigation may cause undercounting. No extra confirmation page is needed.

## Cloudflare setup (manual, Free plan)
1. Create a D1 database and execute `schema.sql`.
2. Create a Worker using `worker.js`, bind D1 database as `DB`.
3. Configure Worker variable `ALLOWED_ORIGINS` with exact origins separated by commas, e.g. `https://juliecreates09-hash.github.io`. Origin restrictions are not path restrictions.
4. Configure Worker secret `REPORT_TOKEN` with a long random value (never commit it).
5. Deploy Worker and record its HTTPS URL. Test POST /event and authorized GET /report.
6. Add `client.js` to staging website, set `window.COZY_CONVERSION_ENDPOINT` to Worker URL + `/event`, and mark the generated book links with `data-conversion="preview|sample|amazon"` and `data-book-id="<ASIN>"`.
7. Verify one click per event and language, unchanged download/Amazon navigation, no personal data in D1, and update the privacy notice before production approval.
8. Keep Worker/D1 usage within current Cloudflare Free plan limits; verify actual account pricing/quotas before deployment.

## Report
`GET /report` with header `Authorization: Bearer <REPORT_TOKEN>` returns aggregated counts; never put token in browser code.

## Gates
No activation until Worker URL, D1 binding, privacy review, and staging functional tests pass. Production repository remains untouched.
