# EcoSort final QA report

**Date:** 15 October 2026  
**Release status: PASS WITH LIMITATIONS**  
**Classroom demonstration: Ready. Hosted production release: not yet verified.**

## Scope and evidence

Read the application, README, demonstration script, UHV explanation, previous results, package scripts and Supabase migrations. Independently reran the original suite (12 unit/component, 15 SQL and 6 browser tests), then added adversarial regressions and fixed reproduced defects. No deployment, live-data changes, commits or pushes were performed. Browser contexts used isolated synthetic storage.

## Bugs discovered and fixed

Eleven defect groups were repaired, including **one critical authorization defect**:

| Priority | Defect and root cause                                                                                                        | Fix and verification                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | An authenticated identity without an application profile could close another user's request: SQL `NOT(NULL)` skipped denial. | Forward migration `202610150002_close_authorization.sql` explicitly fails closed. Actual PostgreSQL reproduction failed before the fix and passes afterward.                                                         |
| P1       | Three same-turn form submissions created three pickup requests before React disabled the submit control.                     | Synchronous in-flight guard; browser regression asserts exactly one persisted request. Collection/dialog actions also guard reentry.                                                                                 |
| P1       | Blank coordinate defaults were coerced from null to `0,0`, inventing a location.                                             | Preserve null in both coordinate conversions; browser verifies stored nulls and production preview displays no location.                                                                                             |
| P1       | Parseable but malformed stored records passed shallow array checks and reached rendering.                                    | Validate record fields with existing Zod schemas; invalid timestamps now yield recoverable workspace errors, preserve stored data and require confirmed reset.                                                       |
| P1       | A connected token refresh unmounted protected forms and silently discarded input.                                            | Only identity changes enter blocking auth loading. Mocked connected-session regression reproduces and verifies preserved form input.                                                                                 |
| P2       | An asynchronous submission finishing after a demo role switch could navigate the new role away from its workspace.           | Ignore post-unmount navigation/feedback while allowing the submitted operation to finish; delayed-upload browser test verifies administrator URL and persisted request.                                              |
| P2       | Removing a photograph retained the native input's file, preventing reliable selection of the same file again.                | Clear the native input when the selected file is removed; browser verifies reselection, preview and stored evidence.                                                                                                 |
| P2       | Online map toggle omitted attribution; changing coordinates could leave the selected pin offscreen.                          | Explicit dynamic attribution control, map recentering and resize handling; browser checks attribution, visible remote marker and click selection using stubbed tile responses.                                       |
| P2       | Confirmation dialogs had no accessible names.                                                                                | Shared dialog uses its title as its accessible name; named-dialog lookup and axe checks pass.                                                                                                                        |
| P2       | Valid maximum-length unbroken names/addresses caused mobile horizontal overflow.                                             | Targeted wrapping and constrained header text; four mobile route regressions and all requested viewport checks pass.                                                                                                 |
| P2       | Punctuation-only phone strings were accepted as phone numbers.                                                               | Require at least seven digits in shared validation and PostgreSQL. Signup component and profile RPC tests reject the reproduced input. Forward migration preserves existing rows while enforcing new/updated values. |

Optional date validation feedback was also exposed next to its field. Existing design and shared repository architecture were retained; no dependencies were added.

## Executed results

| Check                      | Result                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`        | Passed                                                                                                       |
| `npm run lint`             | Passed                                                                                                       |
| `npm run format:check`     | Passed                                                                                                       |
| `npm test`                 | 14 passed across 3 files                                                                                     |
| `npm run test:sql`         | 16 PostgreSQL scenarios passed                                                                               |
| `npm run test:e2e`         | 18 browser tests passed                                                                                      |
| `npm run build`            | Passed                                                                                                       |
| `npm audit`                | Zero vulnerabilities reported at execution time                                                              |
| Rebuilt production preview | Offline pickup submission, null coordinates and persisted refresh passed; no captured console/runtime errors |

The complete resident → administrator assignment → collector start/confirmation/destination → resident completion → updated administrator totals journey uses a UUID-bearing address. Assertions inspect persisted state, including `Pending → Assigned → In Progress → Collected` history and destination status after refresh. The journey succeeds with external network requests blocked.

Adversarial coverage includes empty forms, invalid coordinates, over-limit text, missing photos, repeated submission/completion, unauthorized routes/jobs, denied geolocation, refresh during workflow stages, role switching during delayed submission, malformed/missing storage, quota failure, empty analytics and mobile navigation. Deliberately submitting a fresh second request is allowed; the fix prevents concurrent submission reentry, not legitimate later requests with similar content.

## Security findings and boundaries

**Executed against PostgreSQL:** actual migration constraints, table grants, RLS and mutation RPCs under authenticated/anonymous roles; cross-resident isolation; collector assignment scope; role escalation denial; legal state transitions; atomic rollback; hazardous destination rules; private image references; protected referenced evidence; missing-profile closure denial. PGlite uses Auth/Storage schema stand-ins.

**Static inspection:** connected mode is explicit; role switching is guarded by demo mode; privileged roles require administrator provisioning; Auth tokens are memory-only; Storage bucket is private; client receives public configuration only. Source secret-pattern inspection found no service-role key, private key or matching embedded token. This is not a comprehensive historical secret scan. No frontend role check is presented as a substitute for database authorization.

**Mocked integration:** connected signup sends resident profile metadata and validates input; token refresh preserves the open form. These tests do not contact Supabase.

**Blocked:** hosted Auth/email confirmation, JWT lifecycle, Storage upload/signing HTTP behavior, deployed policies and cross-device workflow. No credentials were available. Existing projects must apply both new migrations in order before connected use; the initial migration alone still contains the superseded closure function. No remote migrations were applied by this audit.

## Visual QA and presentation honesty

- Captured 17 major pages at **375×812, 768×1024 and 1440×900**, covering resident forms/history/guide, collector tasks/detail/confirmation, administrator dashboard/requests/assignments/map/analytics, profile and About.
- All 51 visits passed horizontal-overflow and console/runtime checks. Reviewed screenshot contact sheets and representative full-size screenshots, including settled map/chart content. Fixed long-text overflow without redesigning the interface.
- Existing axe checks passed on 13 page/viewport visits; an additional open-dialog check passed. This is not a complete manual screen-reader certification.
- Representative role screenshots: `qa-artifacts/resident-{375,768,1440}.png`, `collector-{375,768,1440}.png`, `admin-{375,768,1440}.png`. Detailed screenshots are in `test-results/visual-audit-major-pages-fit-*/`. All use fictional records and are ignored by version control.
- Demo labels and explanations distinguish synthetic statistics, simulated physical collection, intended destination and reported handover from verified treatment. No AI, active government integration, real collection service or verified recycling is claimed. Vellangallur remains the assigned scenario.
- The demonstration flow matches the application; the script's collection-action label was clarified to match the detail screen.

## Remaining limitations, prioritized

1. **P1 — Connected release gate:** apply all migrations and execute hosted end-to-end Auth/Storage/cross-device tests before using real accounts or data. Current evidence supports a classroom demo, not an unqualified production authorization claim.
2. **P2 — Documented operating limits:** demo writes are last-writer-wins and browser-quota limited; connected sessions require sign-in after reload; full workspace snapshots target a small pilot. Concurrent-device contention/load and request retry idempotency across network failures are not verified.
3. **P2 — External/browser coverage:** real OSM availability, physical-device GPS, external navigation, Safari/Firefox and deployed headers remain unverified. Map control tests stub tile responses.
4. **Operational:** actual collectors, authorized destinations, privacy/retention processes, backups and correction/treatment verification require real arrangements outside this demonstration.

No known unresolved P0/P1 defect remains in the tested local demo workflow. No unsupported production-readiness claim is made.

## Files changed and recommendation

- Application fixes: session context, shared dialogs/upload control, pickup and collection forms, map behavior, domain validation, demo snapshot validation and responsive styles.
- Database: two forward migrations; SQL harness now applies every migration in filename order.
- Verification: new adversarial/visual/connected-session regressions, strengthened persisted-workflow assertions and jsdom map isolation (real map tests remain in Chromium).
- Documentation/artifacts: this report, `TEST_RESULTS.md`, migration instructions in README/seed guide, demonstration label, ignored screenshot outputs.

**Recommendation:** ready for college presentation and submission in clearly labeled demo mode. Keep hosted production approval conditional on the connected checks above.

```bash
npm run dev -- --port 5173 --strictPort
```

Open **http://localhost:5173**. If that port is already serving EcoSort, use the running instance. Install dependencies first with `npm ci` if needed.
