# Testing and documentation verification

This guide explains which checks to run and how to interpret them. Dated execution evidence belongs in [TEST_RESULTS.md](../TEST_RESULTS.md) and [FINAL_QA_REPORT.md](../FINAL_QA_REPORT.md), not an invented coverage badge.

The later [real-world audit](../REAL_WORLD_TEST_REPORT.md) records actual Chromium/Firefox runs, localhost/OSM traffic, network faults and bounded tab concurrency. [tests/e2e/real-world.spec.ts](../tests/e2e/real-world.spec.ts) preserves the offline local-workspace and segregation-counter-label regressions found there. Hosted Supabase remains a separate blocked gate.

## Commands

Run from the folder containing `package.json` after `npm ci`:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:sql
npm run test:e2e
npm run build
npm audit
```

All `npm run` names above exist in [package.json](../package.json). `npm audit` is an npm built-in. `npm run format` writes formatting changes; inspect them afterward. `npm run test:watch` keeps unit tests watching files. `npm run preview` serves an already generated `dist/`, not the dev source.

There is no configured CI workflow, coverage threshold, documentation-specific npm script or Mermaid linter. Passing these commands locally does not imply a CI job ran.

## Test categories

| Files / tool                                                                    | What it proves                                                                                                                                 | What it does not prove                                                              |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [tests/domain.test.ts](../tests/domain.test.ts), Vitest                         | Shared validation, transitions, demo permissions/persistence/reset and derived values.                                                         | Hosted SQL or physical collection.                                                  |
| [tests/forms.test.tsx](../tests/forms.test.tsx), React Testing Library          | Resident form feedback in jsdom (a simulated browser DOM).                                                                                     | Real map layout or device behavior.                                                 |
| [tests/auth-session.test.tsx](../tests/auth-session.test.tsx)                   | Mocked connected signup metadata/input validation and token-refresh form preservation.                                                         | Supabase email delivery, actual tokens or live sign-in.                             |
| [tests/sql/rls.mjs](../tests/sql/rls.mjs), PGlite                               | All real migration files, actual PostgreSQL roles/RLS/grants/constraints/RPCs, atomic rollback and authorization regressions.                  | Hosted Auth/Storage HTTP services, deployment policies or cross-device reliability. |
| [tests/e2e/workflow.spec.ts](../tests/e2e/workflow.spec.ts), Playwright         | Full persisted role journey with unique input, totals, history/destination, refresh/reset, forms, GPS denial, protected routes and navigation. | Live collection operations.                                                         |
| [tests/e2e/final-audit.spec.ts](../tests/e2e/final-audit.spec.ts)               | Submission reentry, upload reselection, storage corruption/quota, empty data, maps/dialogs, delayed role-switch and completion edge cases.     | Network retry idempotency or concurrent connected load.                             |
| [tests/e2e/visual-audit.spec.ts](../tests/e2e/visual-audit.spec.ts)             | 17 routes at 375×812, 768×1024 and 1440×900, overflow/console checks, screenshots and long mobile text.                                        | Universal device/browser compatibility.                                             |
| [tests/e2e/accessibility.spec.ts](../tests/e2e/accessibility.spec.ts), axe-core | Automated WCAG A/AA checks on tested page states.                                                                                              | A full manual screen-reader or accessibility certification.                         |

Tests of maps/session forms deliberately isolate layout-dependent Leaflet in jsdom; actual map interaction remains covered in Chromium. SQL Auth/Storage schemas are minimal stand-ins, not a full local Supabase installation.

## Browser setup and safe execution

Use **demo mode**, with no connected project targeted. Browser contexts are isolated and synthetic. The full journey blocks external network requests; tile-control tests stub tile responses rather than proving live OSM availability.

Install a test browser if needed:

```bash
npx playwright install chromium
npm run test:e2e
```

[playwright.config.ts](../playwright.config.ts) chooses `CHROMIUM_PATH`, then `/usr/bin/chromium` if present, otherwise Playwright's installed Chromium. Tests use `http://localhost:5173`, start Vite if needed, and reuse an existing server outside CI. Make sure any reused server is **this app in demo mode**. Stop only your own conflicting server; do not blindly kill a process.

To run a focused check (arguments after `--` go to the tool):

```bash
npm test -- tests/auth-session.test.tsx
npm run test:e2e -- tests/e2e/workflow.spec.ts
npm run test:e2e -- tests/e2e/final-audit.spec.ts --grep "rapid repeated"
```

Reports are in `playwright-report/`; screenshots/traces are in `test-results/`; the visual audit also creates representative role screenshots in `qa-artifacts/`. These are generated/ignored and may be overwritten by later runs. Curated documentation images in [images/](images/) are separate tracked copies; see [image notes](images/README.md).

## When editing behavior

1. Reproduce the failure with synthetic data; identify the shared source of the behavior.
2. Add the smallest check that fails before the fix.
3. Make the focused fix and rerun that check, then the full relevant suite.
4. Check types, lint, formatting and build. Review mobile/keyboard behavior if UI changes.
5. Report exactly what ran and what is blocked. Do not remove tests, weaken assertions or add skips just to get green.

For connected changes, coordinate migrations and use a disposable development project. Hosted Auth/Storage, independent resident/collector/admin contexts and unauthorized access need credentialed end-to-end verification before real use. Never run demonstration resets or speculative scripts against live data.

## Documentation checks

When editing docs:

- Resolve relative Markdown links from the **document's directory**, including image paths and heading fragments. Do not link ignored QA images as the only README screenshots.
- Compare commands to `package.json`, routes to `src/app/App.tsx`, environment names to `.env.example`/`src/services/supabase.ts`, and migration lists to `supabase/migrations/`.
- Preview Mermaid flowchart/ER blocks in a renderer supporting Mermaid. A plain Markdown viewer may show source instead of a diagram; surrounding prose must still make sense.
- Run `npm run format:check` and `npm run build`; formatting does not validate links or diagram meaning.
- Do not rewrite historical test counts as though new tests ran. Append any newer evidence with scope/date.
- Scan screenshots, snippets and staged changes for personal information/secrets.

The documentation handoff's actual setup/link/diagram verification is recorded in [Team handoff](TEAM_HANDOFF.md#documentation-handoff-verification), separate from the original QA evidence.
