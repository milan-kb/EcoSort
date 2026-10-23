# EcoSort real-world testing and readiness report

**Audit date:** 20 October 2026. This report records executed browser/network/database-engine tests, not a proposed plan. All household information, images and collection events used here are synthetic.

## 1. Separate release verdicts

| Target                    | Verdict                   | Evidence and release requirements                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classroom demo            | **PASS WITH LIMITATIONS** | Real Chromium and Firefox journeys, local persistence, images, adversarial recovery and responsive checks passed after two small application fixes. A local server/installed dependencies are required; demo is not an installed offline PWA or shared multi-device service. |
| Connected application     | **BLOCKED**               | No configured test Supabase URL, public key, privileged provisioning access or identified dedicated test project. Hosted Auth/Storage, deployed RLS, independent sessions and connected concurrency have not been verified.                                                  |
| Real municipal deployment | **BLOCKED**               | Connected gate remains open, and no independently verified workers, vehicles, accepted-material rules, authorized facilities, privacy/retention operations or government partnership were established. Collection recording does not prove treatment.                        |

**BLOCKED — Real hosted Supabase verification requires a configured test environment.** No remote database, Auth account or Storage object was created/modified. No deployment, commit or push was performed.

## 2. Revision and environment

- Starting Git revision: **`91e9f713ff60744742972a8ee1c31e8f31679491`**, branch `main`; starting working tree clean. The final tested source is that revision **plus the uncommitted fixes/tests described below**, not a fictitious new commit. The final diff and source hashes are retained with the evidence.
- Linux CachyOS, x86-64, Node **24.21.0**, npm **11.19.0**, Playwright **1.64.1**.
- Actual browser engines: system **Chromium 153.0.8010.52** and downloaded **Firefox 157.0**. Firefox uses Playwright's Ubuntu 24.04 fallback build on this unsupported host distribution; successful execution does not certify other OS/browser combinations.
- WebKit **27.2** was downloaded but could not launch: host validation identified missing `libicu74`, `libxml2` and `libflite1` dependencies. No privileged OS package changes or ABI workarounds were attempted.
- Development: `http://localhost:5173`, started with `npm run dev -- --port 5173 --strictPort`; production preview: `http://localhost:4173`, using a fresh `npm run build` and `npm run preview -- --port 4173 --strictPort`.
- Only `.env.example` existed. Vite configuration inspection found default demo mode, no Supabase URL/public key and no matching privileged test variable. Values/tokens were not dumped into logs.
- Browser contexts were isolated from the user's browser profile and existing demonstration records. Screenshot inputs identify fictional households and destinations. Artifact timestamps are stored in UTC; the human audit date follows the session's 20 October date.

## 3. Actual system boundary

The React application implements distinct pickup/dumping forms, manual segregation guidance, assignment/reassignment before start, explicit collector confirmation, destination records, history, private role workspaces and derived charts/maps. Demo role entry is **not authentication**: one browser-origin localStorage snapshot holds the records, photos and histories. These mutations are real local state changes, but the physical collection described is simulated.

Optional connected code uses Supabase email/password Auth, PostgreSQL RLS/authorized RPCs and private Storage. Actual multi-user persistence needs that external backend. Real workers/facilities, physical GPS, independent treatment verification and operational/privacy arrangements cannot be established by a software test.

## 4. Independent photographic browser journey

Executed separately in Chromium and Firefox through normal controls, not repository calls or mocked server responses:

1. Opened the landing page, entered Resident demo, opened pickup, selected **Organic**, **Ward 3**, an approximate quantity and a UUID-bearing fictional household address.
2. Entered a description/manual coordinate pair and selected a valid generated PNG. Submitted and checked the success notice, unique UUID/ECO label and Pending status.
3. Read the configured persistence layer **after the UI action**: request fields and base64 PNG were present in actual localStorage. Confirmed the browser decoded the stored image at its original 640-pixel width. Refreshed and rechecked the record.
4. Switched to Administrator, searched the exact request, checked details, assigned Ravi Kumar and refreshed. Total changed **12 → 13**, active collections **3 → 4**.
5. Switched to the assigned collector, started through the task card, checked In Progress, entered a fictional composting destination and collector-reported handover, selected JPEG proof, explicitly confirmed collection and submitted.
6. Returned through Resident history, checked the same address, collector, Collected status, timestamps and destination. Verified decoded proof and the exact persisted `Pending → Assigned → In Progress → Collected` history.
7. Returned to Administrator and refreshed: total **13**, Collected **4**. Persisted request/collection timestamps were ordered correctly. No recycling/treatment claim was inferred.

Sanitized UUIDs, timestamps and field evidence: `chromium-journey-persistence.json` and `firefox-journey-persistence.json` under the artifact directory. Photos and proof were stored **locally, not uploaded to Supabase**.

The final independent clean-browser scenarios recorded **1,004 real localhost HTTP responses**, all successful, with zero captured console warnings/errors or uncaught errors. These were application/module resources; there were **zero hosted persistence API requests** in the demo journey. Separate fault-injection tests intentionally caused failed requests.

## 5. Executed check results

| Check                                                  | Independently reproduced baseline                                      | Final source                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- |
| `npm run typecheck`                                    | Passed                                                                 | Passed                                        |
| `npm run lint`                                         | Passed                                                                 | Passed                                        |
| `npm run format:check`                                 | Passed                                                                 | Passed                                        |
| `npm test`                                             | **14 passed**                                                          | **14 passed**                                 |
| `npm run test:sql`                                     | **16 passed**, embedded PostgreSQL                                     | **16 passed**, embedded PostgreSQL            |
| `npm run test:e2e`                                     | **18 passed**, Chromium                                                | **20 passed**, Chromium                       |
| Existing suite under actual Firefox engine             | **17 passed / 1 failed** due to aborted lazy-module navigation warning | **20 passed**, including both new regressions |
| `npm run build`                                        | Passed                                                                 | Passed                                        |
| `npm audit --json`                                     | **0 vulnerabilities reported**                                         | **0 vulnerabilities reported**                |
| New independent UI/failure/concurrency scenario groups | Initial failures investigated, below                                   | **17 passed / 0 failed**                      |

The two added browser tests reproduce the offline snapshot-refresh defect and check the corrected segregation metric label. Both were observed failing before their fixes. The existing Firefox failure was not ignored, skipped or fixed by relaxing its console assertion; the test now waits for the lazy administrator screen before performing a hard navigation.

Firefox execution used the same test files with a temporary explicit Firefox configuration; it did not accidentally reuse Chromium's executable override. The full final browser suites include the original workflow, file/GPS tests, WCAG checks, corruption/quota recovery, role switching, legal transitions and responsive screens.

## 6. Adversarial and network results

| Scenario                                                                              | Observed result                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty form, invalid phone, over-2,000-character description, out-of-range coordinates | Validation errors shown; persisted request count unchanged; normal correction/submission remained possible.                                                                                                                       |
| SVG, oversized PNG and text disguised as PNG                                          | Rejected; no request stored. Removed the invalid file and submitted successfully without a photo. This does not prove full server-side malware/image decoding.                                                                    |
| Missing coordinates / no photo                                                        | Valid address-based submission works; absent coordinates remain null.                                                                                                                                                             |
| Geolocation denied                                                                    | Real browser denial produced manual-location guidance; submission still worked. No physical sensor was used.                                                                                                                      |
| Unsupported category / malformed coordinates in direct payload                        | Actual embedded PostgreSQL constraints rejected the payloads; normal UI limits categories. These are not hosted API responses.                                                                                                    |
| Double click with slow feedback; back navigation during submission                    | With a deliberately delayed local FileReader, one request persisted and the completed operation did not override the user's back navigation. This delay is local I/O simulation, not backend latency.                             |
| Role switch during operation                                                          | Existing real-browser regression passed on both engines; the new role was not redirected by the old form's completion.                                                                                                            |
| Refresh during draft entry                                                            | No phantom record created. **Unsaved draft is lost**; no draft persistence feature is implemented. This is a documented limitation, not reported as retained input.                                                               |
| Refresh during delayed collection-proof read                                          | Interrupted operation did not commit. Retry created exactly one collection; reopening its confirmation URL could not complete it again.                                                                                           |
| Malformed stored data                                                                 | Error state preserved the malformed bytes until confirmed reset. A removed request became unavailable after reset; Back to workspace recovered to the seeded home.                                                                |
| Missing request / other resident's request / other collector's job / protected URL    | Unavailable/restricted states; anonymous access returned sign-in. These browser results exercise demo access rules, not production authorization.                                                                                 |
| Loaded demo with browser offline                                                      | **Initially failed:** persisted request appeared unavailable because local query refresh was paused. **After fix:** submission/status/local refresh worked offline; reconnect/reload preserved the record.                        |
| Interrupted lazy administrator module request                                         | Real localhost request was aborted through browser routing; error boundary appeared, existing request remained stored, and reconnect/unroute plus Reload recovered without reset.                                                 |
| Real OSM service                                                                      | **12 actual tile responses returned HTTP 200** before fault injection. A later deliberate tile timeout showed fallback guidance; disabling tiles restored the offline coordinate view. Availability at this moment is not an SLA. |
| Slow real localhost connection                                                        | Chromium CDP throttled production preview to 150 ms latency and 200,000 bytes/s download; landing became visibly ready in approximately **1,322 ms**.                                                                             |
| Failed hosted upload / delayed backend / expired hosted session / backend timeout     | **BLOCKED**, not replaced with a fake Supabase. Credentials and an authorized test environment are absent. Existing mocked session tests do not satisfy this gate.                                                                |

Network-offline hard reload or navigation to an uncached lazy module can still fail because no service worker/PWA cache is implemented. The offline fix concerns already-loaded local demo queries, not offline installation or connected synchronization.

## 7. Cross-client and integrity results

| Scenario                                                      | Evidence and interpretation                                                                                                                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two isolated contexts                                         | Context A created 13th record; independent context B still had 12 seed records. **Expected isolation**, explicitly not successful cross-device synchronization.                                           |
| Two same-origin tabs submit different requests simultaneously | Five bounded rounds, both UI submissions per round; all ten uniquely identified records present, no lost write observed in this run. LocalStorage still has no transaction/conflict-resolution guarantee. |
| Two administrator tabs assign one request differently         | Two historical assignment rows, exactly one active assignment. Last assignment wins before work starts; no conflict notice. This is not connected database contention evidence.                           |
| Collector starts; administrator attempts reassignment         | Administrator saw In Progress and no assignment action after start. SQL invalid-transition regressions also passed. True simultaneous hosted completion/reassignment remains blocked.                     |
| Profile update concurrent with request creation               | Both changes persisted in the bounded shared-origin tab test.                                                                                                                                             |
| Later deliberate submission of identical household details    | Two different UUIDs accepted. Same-turn reentry prevention is not semantic duplicate detection or network-retry idempotency.                                                                              |

Demo tabs also share the persisted **selected-actor key**: reloading a tab adopts the last demo role selected in that origin. Existing in-memory tab actors can differ, but this must not be described as independent authenticated sessions. No attempt was made to add transactional demo storage during this audit.

## 8. Security evidence

**Actual PostgreSQL execution, not just static review:** reran the 16-scenario PGlite harness under authenticated/anonymous SQL roles. It checks metadata escalation, direct write denial, cross-resident/collector visibility, authorized assignment, legal transitions, atomic rollback, hazardous destinations, image references and protected proof. Auth/Storage schema stand-ins mean this is not a hosted Supabase test.

**Fresh independent bypass reproduction:** loaded the historical initial migration only into an isolated embedded database, removed the attacker's application profile, and reproduced unauthorized closure of a different resident's request. Applied the existing forward migrations there and repeated against a fresh Pending request: rejected with **`42501`**, status remained Pending. Additional direct payload checks rejected unsupported waste category, invalid coordinate bounds and an authenticated SQL role with no identity. No migration files were changed.

**Static review boundaries:** connected identity derives from `auth.uid()`, tables grant SELECT only to browser clients, privileged provisioning is trusted-editor-only, bucket is private, signed URLs expire after five minutes, and connected tokens are memory-only. Public `VITE_` variables are not suitable for service-role secrets. These design properties and passing embedded SQL do not certify deployed configuration or HTTP service behavior.

No new P0 security defect was reproduced. Demo browser tampering remains possible by design; it is not a security boundary. Apply **all three migrations in order**: initial schema alone still contains the historical superseded closure function.

## 9. Browser and accessibility matrix

| Engine       | 375×812                      | 390×844 | 768×1024 | 1440×900 | 1920×1080 |
| ------------ | ---------------------------- | ------- | -------- | -------- | --------- |
| Chromium 153 | PASS                         | PASS    | PASS     | PASS     | PASS      |
| Firefox 157  | PASS                         | PASS    | PASS     | PASS     | PASS      |
| WebKit 27.2  | BLOCKED: launch dependencies | BLOCKED | BLOCKED  | BLOCKED  | BLOCKED   |

For each runnable engine, all five sizes exercised three role workspaces and the offline map: **30 role/viewport visits and ten map visits across the two engines**, with screenshots. Actual form/image/collection journeys ran in both engines; the full suites additionally covered major pages at phone/tablet/desktop widths, profile edits, navigation and persistence.

The full axe suites passed, along with explicit screen-reader-only sizing/visibility assertions. New open-dialog axe checks returned **zero violations** in both engines. Keyboard Tab cycling kept background controls inaccessible, Escape closed the modal, and focus returned to its trigger. Chromium can put focus in browser chrome between cycles (DOM reports BODY); the initial audit assertion incorrectly treated that as page focus escape. Explicit observations confirmed the dialog remained modal and background controls were not focused; no custom focus trap was added.

Form validation messages expose alert roles; controls/status indicators have labels/text. This is automated browser/axe coverage, **not manual screen-reader certification**, physical iPhone Safari, physical Android or physical GPS verification.

## 10. Production-preview performance measurements

Nine isolated synthetic datasets (three trials per size) were loaded into actual localStorage, with the production build served by Vite preview. This setup injection is limited to load testing; the acceptance journey itself was created through the UI. Measurements are desktop headless lab observations, not server capacity, municipal throughput or field Core Web Vitals.

| Requests | Snapshot bytes | Median dashboard ready | Median Analytics heading ready |
| -------- | -------------- | ---------------------- | ------------------------------ |
| 10       | 8,984          | 517 ms                 | 123 ms                         |
| 100      | 79,634         | 517 ms                 | 129 ms                         |
| 1,000    | 787,034        | 534 ms                 | 133 ms                         |

Dashboard readiness waits for stored totals and the category chart; Analytics timing waits for its heading, not the end of Recharts' intentional bar entrance animation. Final measurement trials ran without parallel test-worker load. Observed CLS was **0 in all nine trials**. Eight nonzero LCP samples were approximately **500–528 ms**; one observer sample was unrecorded (`0`), not a zero-millisecond page load. Long tasks reached **88 ms**. These observations do not establish passing field performance thresholds.

Representative final assets (raw / standalone gzip bytes):

- Main JavaScript: **329,122 / 101,129**.
- Shared context chunk: **173,796 / 53,669**.
- Analytics: **378,683 / 107,590**.
- Map: **156,423 / 45,962**.
- Main CSS: **58,681 / 12,835**; Leaflet CSS **15,095 / 6,371**.

Assets are split; do not add every lazy chunk and describe that as the initial public payload. No severe volume-dependent slowdown was demonstrated through 1,000 small records, so no speculative optimization was applied. Full JSON parsing/validation, client aggregation, base64 image quotas and whole snapshots remain scaling ceilings. **Lighthouse was not installed/executed**; no score is invented.

## 11. Assigned-scenario use cases

The Vellangallur description remains an assigned scenario, not verified local-government information.

| Use case / objective      | Steps performed and expected result                                                                                                                                              | Actual result                                                                                        | Verdict and limitation                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Household organic waste   | Enter separated Organic pickup, coordinates/photo; assign/start; record composting handover; return to resident. Expected complete accountable lifecycle.                        | Persisted fields/images, ordered history, collector/destination and totals verified in both engines. | **PASS, demo only**; no actual waste transported.                                                               |
| Recyclable dry waste      | Create separated Plastic and Paper & cardboard pickups. Expected Pending records of correct categories.                                                                          | Distinct UUID-bearing records stored through forms.                                                  | **PASS**; material acceptance/recyclability not certified.                                                      |
| Existing roadside dumping | Submit Mixed public-site description, manual coordinates and PNG. Expected distinct dumping record for review.                                                                   | Submission succeeded separately from household pickup.                                               | **PASS**; no real site or cleanup established.                                                                  |
| Collector coordination    | Administrator locates exact request and assigns; collector starts/completes; totals refresh. Expected role-scoped state changes.                                                 | End-to-end journey and bounded tab conflict tests passed.                                            | **PASS locally**; hosted independent-session workflow blocked.                                                  |
| E-waste handling          | Read guide, request E-waste/hazardous pickup; attempt ordinary sorting destination, then authorized-handler type. Expected reject unsafe destination without partial completion. | Sorting rejected with no collection row; authorized type saved.                                      | **PASS**; handler qualifications and facility existence are external.                                           |
| Ward-level planning       | Open Analytics and map after new records. Expected derived category/ward counts and visible valid pins.                                                                          | Charts/map rendered across browser matrix; shared total calculations verified.                       | **PASS for record visibility**; counts are requests, not waste mass, unique households or proven public impact. |

## 12. Defects found, fixes and rejected false positives

| Priority / classification                        | Reproduction and root cause                                                                                                                                      | Small correction / evidence                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P1 application defect**                        | Browser offline: create persisted locally, but default online Query mode paused refresh and the detail UI said Request unavailable after success.                | Set only demo workspace queries to `networkMode: 'always'`; connected stays `online`. New offline UI regression failed before/passed after in both engines. Official behavior: [TanStack network modes](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode). |
| **P2 application labeling defect**               | Seed contains eight segregated pickup requests, not eight distinct households; dashboard labeled the count as Households.                                        | Rename label to **Segregated pickup requests**; calculation unchanged. New caption/value regression failed before/passed after. Related docs reconciled.                                                                                                                             |
| **Test reliability defect**                      | Firefox warned that the lazy Dashboard module failed when the visual test switched roles and immediately hard-navigated, aborting that in-flight module request. | Wait for the real administrator heading before hard navigation; console assertions unchanged. Both final 20-test suites pass.                                                                                                                                                        |
| Audit-harness assumptions, not application fixes | Chromium native dialog cycle includes browser-chrome focus; reset correctly removes the old request; same-origin tab reload adopts shared selected identity.     | Investigated actual browser state and corrected only scratch audit expectations. Original failure logs retained. No misleading custom focus/auth/reset feature added.                                                                                                                |

## 13. Remaining risks and explicit blocks

1. **Hosted gate:** provision a dedicated authorized test project and verify actual signup/email, sign-in/logout/reload, expired JWT/session handling, Storage uploads/signing, direct HTTP RLS denial, cross-user refresh and contention. All remain blocked, not “passed via demo.”
2. **Municipal gate:** real staffing/transport/material acceptance/authorized destinations, independent verification/correction procedures and privacy/retention/backups/recovery need operational agreement. No software test proves those resources exist in Vellangallur.
3. **Concurrency/retries:** demo last-writer-wins has no guaranteed lost-write prevention; five successful rounds are bounded evidence only. No connected simultaneous transaction test or network-retry idempotency guarantee was established. Deliberate later duplicate requests are allowed.
4. **Offline/drafts:** uncached resources still need a server/network route; draft refresh loses unsaved fields. There is no connected offline sync or PWA installation.
5. **Compatibility/accessibility:** WebKit launch blocked; no physical devices or manual assistive-technology testing. No claim of iPhone Safari compatibility follows from desktop tests.
6. **Performance:** results cover small synthetic records on this machine; images, slow hardware, real backend latency and larger datasets may differ. Long tasks exist; Lighthouse/field performance unmeasured.

No known failing final automated check remains in runnable environments. That statement excludes blocked services/devices and does not turn the connected/municipal verdicts into PASS.

## 14. Evidence and reproduction

All generated evidence is under **`qa-artifacts/real-world-testing/`**, ignored by Git. Historical QA documents were not rewritten to imply hosted verification.

- `environment.json`, `browser-availability.json`, `browser-install.log`: revision, mode, engine versions and WebKit blocker.
- `baseline-*.log`, `firefox-existing-suite.log`, `firefox-warning-reproduction.log`: independently observed baselines and initial Firefox failure.
- `final-*.log`, `final-audit.json`: final check outputs, 20-test engine runs and dependency audit.
- `segregation-label-before.log`, `offline-regression-before.log`, `new-regressions-after.log`: actual failing/passing regression evidence.
- `new-browser-scenarios.json`, `network-and-concurrency.json`: final **17 passing scenario groups**; `initial-*.json` preserve initial diagnostic failures.
- `localhost-network.json`, `browser-console.json`, `osm-network.json`: sanitized HTTP outcomes, clean-journey console capture and real/faulted tiles. No authorization headers, cookies, passwords or session bodies were captured.
- `*-journey-persistence.json`, `*-resident-pending.png`, `*-collector-completed.png`, `*-admin-final.png`, role/width PNGs: synthetic stored-record and rendered evidence.
- `missing-profile-reproduction.json`, `sql-bypass-reproduction.log`: isolated historical exploit/current denial and extra SQL payload checks.
- `performance.json`, `performance-final.log`: full timings, resources, observations and bundle sizes; `final-source.diff`, `source-manifest.json`: exact local source delta/hashes.
- `audit-script.txt`, `failure-concurrency-script.txt`, `performance-script.txt`, `sql-regression-script.txt`, `firefox-config.txt`: executed scratch tooling retained as text, not dependencies or application features. These scripts use this checkout's absolute paths; adapt paths before reuse.

Reproduce normal checks with the scripts in `package.json`. On a machine with runnable Firefox, use an explicit Firefox Playwright configuration rather than inheriting the system-Chromium override. Only run any future connected attacks/concurrency suite against an identified, approved disposable backend.
