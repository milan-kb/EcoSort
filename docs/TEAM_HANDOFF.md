# Team handoff

This is the working handoff from the implementation to the rest of the team: what is ready, what is not, and how to change it safely. Start with [START_HERE.md](START_HERE.md), not a backend migration.

## A. What has already been completed

- Responsive Resident, Collector and Panchayat Administrator workspaces sharing a typed repository contract.
- Segregation guide, validated household pickups and separate dumping reports, optional images/location, request history/filtering and reasoned closure.
- Assignment/reassignment before work starts, collector start/physical confirmation, destination recording and resident completion visibility.
- Derived dashboard/chart totals and private operational maps, with an offline coordinate view for demos.
- Synthetic local seed, instant role switching, same-browser persistence and confirmed reset.
- Optional Supabase Auth/PostgreSQL/private Storage integration; three ordered migrations, RLS, authorized atomic RPCs and trusted role provisioning instructions.
- Unit/component, embedded PostgreSQL and Chromium workflow/adversarial/responsive/accessibility checks; QA reports and a presentation script.

The [final QA report](../FINAL_QA_REPORT.md) records **PASS WITH LIMITATIONS** for classroom demonstration. Its verified counts are 14 unit/component tests, 16 PostgreSQL scenarios and 18 browser tests; typecheck/lint/format/build passed and audit reported zero vulnerabilities at execution time. These are dated evidence, not a permanent guarantee.

## B. What is intentionally not included

- No actual municipal service, government integration, worker dispatch network or facility partnership.
- No AI recognition/prediction, OTP, SMS/push notifications, password-recovery UI, treatment certification or guaranteed appointment.
- No independent verification of physical collection/handover; no post-completion correction or later handover-update interface.
- No connected offline synchronization or installable/cached PWA. Demo writes are local, quota-limited and last-writer-wins.
- No full production operations policy for privacy/retention/erasure, backups or incident response.
- Git remote: `git@github.com:milan-kb/EcoSort.git`, shared branch `main`. No curated contributor list, license file or CI workflow is included; agree on those with the owner.

## C. Run and understand the project

[Start here](START_HERE.md) covers Windows/macOS/Linux prerequisites, source access, `npm ci`, `npm run dev`, demo entry and basic checks. No environment file or real account is needed for demo. Optional connected setup belongs in [Database](DATABASE.md) and [Security](SECURITY.md).

## D. Recommended reading order

1. [Start here](START_HERE.md): get a working local session.
2. [Project explanation](PROJECT_EXPLANATION.md), then [Demo script](../DEMO_SCRIPT.md): explain the purpose and perform the journey.
3. [Feature guide](FEATURE_GUIDE.md): understand role behavior and validation.
4. [Architecture](ARCHITECTURE.md): follow the routes, state and repositories.
5. [src/types/domain.ts](../src/types/domain.ts), [src/lib/domain.ts](../src/lib/domain.ts), [src/services/demo.ts](../src/services/demo.ts): read contracts, rules and one persistence implementation.
6. [Testing](TESTING.md), [Contributing](CONTRIBUTING.md), [CONSTRAINTS.md](../CONSTRAINTS.md): prepare a safe contribution.
7. [Database](DATABASE.md), [Security](SECURITY.md), [final QA](../FINAL_QA_REPORT.md): required before connected/security changes.

## E. Bounded tasks teammates can choose

| Task                 | Useful outcome / boundary                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI review            | Check one role on a small screen/keyboard; report a synthetic reproduction and screenshot, not a redesign.                                                 |
| Documentation review | Follow setup on your OS; fix one confusing step with observed evidence.                                                                                    |
| Testing              | Add one missing regression or review an assertion; preserve existing coverage.                                                                             |
| Segregation content  | Verify advice against appropriate local acceptance/safety guidance; propose sourced content edits without claiming partnerships.                           |
| Presentation         | Rehearse the shared demo and short answers; emphasize collection versus verified treatment.                                                                |
| Backend integration  | With permission and development credentials, test hosted signup, separate-user permissions, uploads/signed URLs and refresh/polling. Do not use live data. |

No tasks are assigned to named people here. Agree on scope and file overlap before starting.

## F. Editing rules

- Use topic branches once the team has an authoritative Git repository; see [Contributing](CONTRIBUTING.md) for suggested conventions, not imaginary enforced rules.
- Keep changes focused. Do not refactor unrelated screens or upgrade dependencies in a documentation/bug-fix task.
- Preserve the full segregation → request → assignment → collection → destination workflow and explicit demo labels.
- Reproduce bugs and add/update relevant checks; do not silence failures or remove tests to make them pass.
- Never commit secrets, real household records, session links or sensitive traces. Public `VITE_` configuration cannot contain a privileged key.
- Coordinate new forward migrations; apply all existing ones in order. Do not edit an applied schema as if it updates an existing project.
- Ask for another teammate's review before merge. Record exact verification and remaining limits.

## G. Current technical status and known limits

The missing-profile SQL closure authorization bypass was fixed in migration 2 and has a regression. **Applying only migration 1 retains the historical bug.** Migration 3 adds phone digit validation without scanning existing rows. Local QA found no unresolved P0/P1 defect in the tested demo journey.

Hosted Supabase Auth/email/JWT, Storage HTTP validation/signing, deployed policies and cross-device behavior remain **unverified without credentials**. Connected tokens stay in memory, so reload requires sign-in. Full authorized snapshots suit a small pilot; concurrent connected contention/load and network-retry idempotency remain unverified. The [20 October audit](../REAL_WORLD_TEST_REPORT.md) exercised headless Chromium/Firefox and real OSM tile responses; WebKit launch, physical-device GPS/Safari and external navigation remain outstanding. See [TEST_RESULTS.md](../TEST_RESULTS.md) for the historical tested boundary.

The dashboard's segregation metric counts confirmed pickup **requests**, not distinct households. The 20 October real-world audit corrected its label to **Segregated pickup requests** without changing the calculation; [Architecture](ARCHITECTURE.md#statistics-and-map-behavior) records it.

## H. Before submitting or presenting

- [ ] Install dependencies and open the local app before class; keep the server running.
- [ ] Use demo mode and only synthetic inputs; leave online tiles off if internet is unreliable.
- [ ] Reset only after preserving any practice records you need; confirm the reset deliberately.
- [ ] Rehearse a uniquely named pickup through all roles, destination and resident completion, then refresh and inspect totals.
- [ ] Run the local checks from [Testing](TESTING.md); distinguish anything blocked from passed.
- [ ] Check mobile/keyboard navigation and the exact machine/browser used for presentation.
- [ ] Share source, lockfile, environment example, ordered SQL and docs; do not share `.env`, installed dependencies or sensitive artifacts.
- [ ] Mention the assigned-scenario caveat, synthetic statistics and lack of independently verified treatment.
- [ ] If presenting connected mode, complete the hosted gate first; do not substitute embedded SQL or mocks for that evidence.

## Documentation handoff verification

Executed on **15 October 2026**, separately from the preserved QA evidence:

| Verification                                        | Observed result                                                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relative Markdown/image links and heading fragments | All 151 checked links resolved across 18 root/guide/provisioning documents; no unbalanced code fences or unknown `npm run` names.                                                                                         |
| Mermaid diagrams                                    | All 3 parsed and rendered in Chromium using a temporary Mermaid 11.12.0 bundle; no project dependency added.                                                                                                              |
| Environment/migration instructions                  | Example exactly covers all 3 runtime `VITE_` variables; all 3 migration files included in order.                                                                                                                          |
| Clean source-copy setup                             | `npm ci`, `npm run typecheck`, `npm test` (14 passed) and `npm run build` passed without preinstalled packages, build output or `.env`.                                                                                   |
| Clean-copy browser journey                          | The documented pickup → filtered administrator assignment → collector confirmation/destination → resident refresh → updated totals passed with external requests blocked and no captured runtime/console errors.          |
| Working-tree checks                                 | Typecheck, ESLint, Prettier check, build and dependency audit passed; 14 unit/component, 16 SQL and 18 browser tests passed. Audit reported zero vulnerabilities at execution time.                                       |
| Images and secrets                                  | Three synthetic QA screenshots visually reviewed, resized and encoded as WebP (about 141 KiB total). Targeted private-key/token pattern scan of handoff text/examples found no matches; not a comprehensive secret audit. |
| Scope                                               | No application logic, database behavior, dependencies or existing tests changed. Original QA/presentation/UHV documents retained; README and environment comments improved.                                               |

**Not claimed by the 15 October documentation verification:** a true fresh clone (there was no Git metadata or verified remote at that time), Windows/macOS execution (instructions reviewed, tests ran on Linux), hosted Supabase integration, or a deployed site. Git collaboration commands were conditional examples, not executed remote operations. Curated documentation images were prepared for version control, but no Git commit/push was performed during that documentation task. Historical `TEST_RESULTS.md` and `FINAL_QA_REPORT.md` were not rewritten to imply a new hosted verification.

**16 October Git setup:** the owner supplied `git@github.com:milan-kb/EcoSort.git`; `origin` and `main` are now the onboarding defaults. SSH access and an initially empty remote were verified before preparing the initial commit. This updates repository access instructions, not the historical application-test evidence above.

Related references: [README](../README.md), [Troubleshooting](TROUBLESHOOTING.md), [UHV explanation](../UHV_EXPLANATION.md).
