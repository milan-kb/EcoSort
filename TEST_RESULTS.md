# EcoSort verification results

Independently rerun during the final audit on **15 October 2026**, using Node **24.21.0**, npm **11.19.0**, and headless system Chromium through Playwright. These are executed results, not a proposed test plan. See [FINAL_QA_REPORT.md](FINAL_QA_REPORT.md) for reproduced defects and the release recommendation.

## Results

| Command / check                | Result                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`            | Passed — strict TypeScript                                                                                      |
| `npm run lint`                 | Passed — no lint errors                                                                                         |
| `npm run format:check`         | Passed                                                                                                          |
| `npm test`                     | **14 passed**, 3 files, none skipped                                                                            |
| `npm run test:sql`             | **16 passed** SQL/security scenarios using all actual migrations in embedded PostgreSQL                         |
| `npm run test:e2e`             | **18 passed**, none skipped                                                                                     |
| `npm run build`                | Passed — production output generated without chunk-size warnings                                                |
| `npm audit`                    | **0 vulnerabilities** reported against the lockfile at verification time                                        |
| Production preview smoke check | Passed — HTTP 200, pickup submission, persisted refresh, zero runtime/console errors, external requests blocked |

The existing development server returned HTTP 200 at port 5173. An attempted second start correctly failed because that port was occupied; browser tests used the existing server. The production preview served the rebuilt application at port 4173. Preview responses were checked for no-sniff, frame denial, referrer policy and restricted geolocation/camera/microphone headers. Production-host CSP/HSTS behavior still depends on deployment configuration.

## Acceptance workflow coverage

1. Resident pickup submission creates a persisted Pending request with a unique UUID and visible ECO identifier.
2. Empty quantity/address and missing explicit segregation produce validation feedback; invalid coordinates and calendar dates are rejected by the schema.
3. Separate public dumping submission works with Mixed waste, a photograph, manual address, and a denied-GPS fallback.
4. Administrator sees the new request and assigns Ravi Kumar.
5. Only the assigned collector receives the job; reassignment revokes the former collector before work begins.
6. Collector starts collection, explicitly confirms physical collection, and records destination/notes.
7. Resident sees Collected, timestamp, timeline and intended destination without a treatment claim.
8. Administrator totals and completion rate derive from updated records.
9. Anonymous and wrong-role route access is blocked; database tests separately verify grants, RLS and RPC authorization.
10. Invalid transitions, incomplete confirmation, hazardous handling mismatches and terminal-state reopening are rejected.
11. Requests, collection and profile changes persist across refreshes in the same browser.
12. Confirmed reset restores only fictional demo data; unrelated localStorage survives.

The complete browser workflow was executed with **all external network requests blocked**, and made no attempted external requests. This verifies the classroom journey without a live backend or internet map service; a local server and installed dependencies are still required.

## Browser and accessibility checks

- Resident and administrator layouts tested for horizontal overflow at **320, 768, 1024 and 1440 px**.
- Final visual audit covered **17 major routes at each of 375×812, 768×1024 and 1440×900** (51 page visits), with screenshots, overflow assertions and no captured console warnings/errors or uncaught errors. Valid maximum-length unbroken text was separately checked on four mobile routes.
- Mobile bottom navigation, request list, guide, profile editing, About, sign-out and 404 exercised.
- Offline Leaflet coordinate map displays all valid synthetic pins, with an explicit offline/synthetic label.
- File preview and persisted authorized image display exercised with a real PNG upload.
- Native assignment/reset confirmation dialogs exercised.
- axe-core WCAG 2 A/AA and WCAG 2.1 AA checks passed on **13 page/viewport visits** spanning landing, sign-in, About, resident home/form/guide/requests, collector tasks, administrator dashboard/requests/analytics, and mobile administrator/resident home.
- Keyboard focus visibility checked. This is not a complete manual screen-reader or accessibility certification.
- An additional axe check passed with the assignment confirmation dialog open and accessibly named.
- Representative resident, collector and administrator screenshots at all three requested widths are in `qa-artifacts/`. All-page screenshots are generated under `test-results/visual-audit-major-pages-fit-*/`; browser reports are in `playwright-report/`. These fictional-data artifacts are intentionally ignored by version control.
- Chrome DevTools MCP was not configured. Real-browser verification used Playwright with isolated Chromium contexts instead.

## Database security checks

`tests/sql/rls.mjs` loads **all production migrations in filename order** into PGlite's PostgreSQL engine, with minimal Auth and Storage schema stand-ins, and executes statements under actual `authenticated` and `anon` PostgreSQL roles.

Verified: metadata role escalation prevention; actor-owned Pending creation; constraints and audit history; no direct table writes; scoped resident/collector reads; assignment authorization; invalid-transition rejection; collection rollback on failure; complete destination/history/assignment updates; security-invoker snapshot; reassignment revocation; closure reason/state rules; private image path ownership; hazardous destination enforcement; referenced proof surviving uploader demotion/deletion attempts; anonymous denial; **missing-profile identity denied closure**; punctuation-only phone numbers rejected by the profile RPC.

The earlier development review inverted the shared transition guard and observed five failing domain tests before restoring it. That historical mutation experiment was not repeated in this audit. New final-audit regressions were observed failing against the original defects and passing after fixes, including duplicate submission, malformed storage, missing-profile SQL closure, token-refresh input loss and invalid phone acceptance.

## Final adversarial audit

- Uniquely named full pickup journey verifies stored request, destination, exact status-history sequence and updated dashboard totals after refresh; external requests are blocked.
- Three same-turn submissions produce one record; blank coordinates persist as null. Repeated collection confirmation produces one collection record.
- Unassigned and already-collected jobs cannot be completed; refresh preserves both started and completed states.
- Empty/invalid forms, out-of-range coordinates, over-limit descriptions, GPS denial and optional missing photographs are exercised.
- Empty analytics reports zero; missing storage initializes synthetic examples; malformed records produce recoverable workspace errors without overwriting the original bytes.
- Simulated storage quota failure preserves existing requests and displays failure rather than success.
- Removing/reselecting a photo, role switching during delayed upload, map attribution, remote marker positioning and map clicking are exercised.
- Connected signup validation/metadata and token-refresh form preservation pass component tests with a mocked Supabase client. These are **not hosted authentication tests**.

## Repaired during initial development verification

- Tablet overflow caused by an absolutely positioned screen-reader label inside a scrolling table.
- Low-contrast secondary text and cancelled/task-tab labels.
- A mobile reset control losing its accessible name when its visible text was hidden.
- Short-viewport sidebar overflow.
- Unnecessary pie animation producing partial first-frame screenshots; the category chart now renders without a sweep animation.
- SQL closure parity for already-terminal requests; profile RPC explicitly returns a JSON object.
- Image cleanup checks now bypass row visibility when checking references, preventing deletion of still-referenced proof after uploader demotion.

The final independent audit additionally repaired the 11 defect groups detailed in `FINAL_QA_REPORT.md`, including a critical SQL authorization bypass. Apply both new forward migrations to any existing connected installation.

## Not verified / remaining limitations

**No hosted Supabase credentials were available.** Hosted email/password registration, email delivery/confirmation, JWT lifecycle, cross-device persistence, Storage HTTP MIME/size enforcement, signed URL generation, and deployed RLS behavior still need a real project test. Embedded database checks do not prove those external services work end-to-end. Concurrent-session contention/load testing was not performed.

Online OSM tile availability, browser GPS on physical devices, external Google Maps navigation, Safari/Firefox, production hosting headers and real-world collection/treatment operations were not verified. No AI, municipal integration, OTP, verified treatment outcome or actual collection service is claimed.

Connected auth intentionally uses memory-only sessions, so refresh requires sign-in. Full-workspace snapshots and local demo quotas have documented scaling limits. Production privacy/retention, erasure/export operations, backups and post-completion corrections require an operational policy before handling real personal data. See `README.md` for setup and limitations.
