# Start here: your first EcoSort session

This guide gets a new teammate from downloaded source to a working demo. No React, database or Supabase experience is required to start. For the bigger picture, read [Project explanation](PROJECT_EXPLANATION.md).

## 1. What you are opening

EcoSort coordinates household waste requests, collector assignments and collection records. Residents also get separation guidance and can report existing dumping. Three workspaces share one workflow; none operates a real collection service. Vellangallur is the assigned UHV scenario, not a verified description of government services.

The easiest configuration is **demo mode**: fictional users and records saved in your browser. Supabase is optional and should be explored only after the local demo works.

## 2. Tools you need

- **Node.js 22.12 or newer**, with npm. Node runs development tools; npm installs the project's packages. Node 24 was used for the recorded QA.
- A modern browser; Chromium was used for automated verification.
- A text editor such as VS Code (suggested, not required).
- **Git** for team collaboration. A ZIP works for exploring but has no branch/history support.
- Internet for the initial dependency installation. A running local demo needs no external service afterward; online map tiles do.

In Windows PowerShell, macOS Terminal or a Linux terminal, check:

```bash
node --version
npm --version
git --version
```

If these commands fail, see [Troubleshooting](TROUBLESHOOTING.md). npm 11.19.0 is recorded in `package.json`; prefer the team's verified Node/npm combination if installation differs on your machine.

## 3. Obtain and open the source

The repository is `milan-kb/EcoSort` on GitHub. With GitHub SSH access configured:

```bash
git clone git@github.com:milan-kb/EcoSort.git
cd EcoSort
```

Without SSH configured, clone with `git clone https://github.com/milan-kb/EcoSort.git` instead, then `cd EcoSort`. Private repository access still requires the owner's permission and GitHub authentication. Open the folder in your editor and its integrated terminal. If you received a ZIP, extract it first; do not run inside the archive viewer.

You are in the correct directory when you can see `package.json`, `src/` and `README.md`. Its folder name does not affect the app.

## 4. Install and run

These commands work in PowerShell, macOS and Linux terminals:

```bash
npm ci
npm run dev
```

`npm ci` installs exactly the versions in `package-lock.json`. It replaces an existing `node_modules/` directory, not your source files. `.npmrc` intentionally disables package install scripts; do not remove that protection as a default troubleshooting step.

Open **http://localhost:5173**, or the different URL Vite prints if the port is busy. Leave the terminal running. **Ctrl+C** stops the server. Do not open `index.html` directly as a file.

**No `.env` file is needed for demo mode.** If you inherited a connected `.env` file, set `VITE_APP_MODE=demo` and restart the server. Environment values are read when Vite starts (and embedded at build time).

## 5. Explore all three roles

1. Open **Sign in** and choose **Resident**. No password is needed. The example resident is Anjali Menon.
2. Read **Segregation guide**, then create a pickup with Plastic, `2 separated bags`, a fictional address such as `Team practice household, classroom lane`, and the segregation checkbox. GPS, photo and preferred date are optional.
3. Note the ECO identifier and **Pending** status. Use the top **Demo role** selector to choose **Administrator**.
4. Open **All requests**, search your fictional address, open the record, choose **Ravi Kumar**, then **Assign collector → Confirm assignment**.
5. Switch to **Collector · Ravi Kumar**. Find your task, click **Start collection**, then **Confirm collection**. Enter a fictional destination and explicitly confirm simulated physical collection. Submit.
6. Switch back to Resident and inspect **Collected**, its timeline and destination record. Switch to Administrator to see updated totals.
7. Refresh: saved records remain in this browser. Do not reset until you no longer need these practice changes.

The second selectable collector is Fathima Ali. A second resident exists in the seed to test ownership, but is not an instant-entry option. All personas, phone numbers and locations are synthetic. Desktop uses a sidebar; small screens use bottom navigation, with shared account links available through Profile.

**Reset demo** opens a confirmation dialog and replaces all EcoSort demo records/photos with the fictional seed. It is not an undo button and does not clear unrelated website storage. [Demo script](../DEMO_SCRIPT.md) provides a timed classroom version.

## 6. Run basic checks

In another terminal in the same project folder:

```bash
npm run typecheck
npm test
npm run build
```

Type-checking catches incompatible data use; unit/component tests check logic and forms; building creates the static website in `dist/`. To preview that build:

```bash
npm run preview
```

Open the printed preview URL (normally **http://localhost:4173**). For browser tests, install Chromium if needed with `npx playwright install chromium`, then run `npm run test:e2e` **in demo mode**. Playwright starts Vite if port 5173 is not already serving it. See [Testing](TESTING.md) before pointing tests at any server.

## 7. Files to know first

| File or directory                               | What it answers                                  |
| ----------------------------------------------- | ------------------------------------------------ |
| [package.json](../package.json)                 | Which commands and packages exist?               |
| [src/app/App.tsx](../src/app/App.tsx)           | Which pages exist and which roles may open them? |
| [src/types/domain.ts](../src/types/domain.ts)   | What is a request, assignment or collection?     |
| [src/lib/domain.ts](../src/lib/domain.ts)       | Which inputs/transitions/statistics are valid?   |
| [src/services/demo.ts](../src/services/demo.ts) | How does local persistence work?                 |
| [src/features/](../src/features/)               | Where are the role screens?                      |
| [src/data/guidance.ts](../src/data/guidance.ts) | Where is editable separation advice?             |
| [tests/](../tests/)                             | How are behavior and permissions checked?        |

A **component** is a reusable piece of interface. A **route** maps a URL to a screen. A TypeScript **interface** describes a data shape; it does not validate external data by itself. The [architecture guide](ARCHITECTURE.md) follows one request through those pieces.

## 8. Start contributing

Read [Team handoff](TEAM_HANDOFF.md), agree on one small task, then follow [Contributing](CONTRIBUTING.md). If you only have a ZIP, get a real Git checkout before following branch/push commands. Do not initialize or publish an unrelated repository just to make commands work.

Keep the complete request-to-destination journey working, add/update checks for behavior changes, and never commit `.env` or real household data. An easy first task is verifying a guide sentence, improving a documented error explanation, or reviewing a mobile screen.

## Common first-run problems

| Symptom                              | First safe action                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `node`/`npm` not recognized          | Install Node, reopen your terminal, check versions.                                                 |
| PowerShell blocks `npm.ps1`          | Try `npm.cmd ci` and `npm.cmd run dev`, or use Command Prompt; do not weaken system policy blindly. |
| `package.json` not found             | Open the extracted project folder, not its parent.                                                  |
| Port is busy                         | Use the existing EcoSort instance or the URL Vite prints. Browser tests specifically need 5173.     |
| App asks for connected configuration | Set `VITE_APP_MODE=demo` in your local environment and restart.                                     |
| Map has no streets                   | Demo defaults to an intentionally labeled offline coordinate grid.                                  |

More solutions: [Troubleshooting](TROUBLESHOOTING.md). For optional real accounts, start with [Database setup](DATABASE.md#migration-and-connected-setup), not demo role switching.
