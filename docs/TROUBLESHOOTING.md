# Troubleshooting EcoSort

Use this guide to diagnose setup, browser and connected-mode problems without deleting important data. Run commands in the project folder. For first installation, see [Start here](START_HERE.md); for failures in checks, see [Testing](TESTING.md).

## Node or npm is missing / wrong version

```bash
node --version
npm --version
```

Install Node.js **22.12+** from the official Node.js distribution or your trusted version manager. Node 24/npm 11.19.0 was the recorded verification environment. Reopen the terminal/editor after installation so PATH changes take effect. If you manage several Node versions, select the intended one in this terminal before installing packages.

On Windows, if execution policy blocks `npm.ps1`, use `npm.cmd ci`, `npm.cmd run dev`, etc., or Command Prompt. Do not globally disable security policy to run this project.

## npm installation fails

1. Confirm you are in the extracted folder containing `package.json` and `package-lock.json`, not a parent or ZIP viewer.
2. Read the **first actual npm error**, not just the final exit code. Check Node version, internet access, corporate proxy/certificate configuration and writable folder/disk space.
3. Run `npm ci` again after fixing that cause. It replaces installed dependencies, not source. Close processes locking `node_modules/` if an operating-system file-lock error identifies them.
4. Do not delete the lockfile, use `--force`, change registry/certificate checks or enable all install scripts to hide an unexplained failure. `.npmrc` intentionally sets `ignore-scripts=true`.

If `package.json` and lockfile differ after someone intentionally changes packages, the owner should regenerate/review the lockfile using the agreed Node/npm version. Do not silently change dependency versions as a setup fix.

## Port 5173 is already in use

Open **http://localhost:5173** first. If it is this EcoSort instance, reuse it. Otherwise `npm run dev` normally prints another free port; use the printed URL for exploration. If you require exactly 5173:

```bash
npm run dev -- --port 5173 --strictPort
```

That deliberately fails on an occupied port rather than switching. Stop only a server you own (Ctrl+C in its terminal), or coordinate with its owner. Browser tests specifically target 5173 and can reuse an existing server, so ensure it is EcoSort **in demo mode**. Data at another port is a different browser origin and will not share the same demo storage.

## Blank page or missing route after refresh

- Use the URL printed by Vite, not a file-opened `index.html` or `dist/index.html`.
- Check the browser's Developer Tools Console and Network panels and Vite terminal for the first error. Preserve the message and reproduction steps.
- An older preview build may be stale: run `npm run build`, then `npm run preview`.
- A static host must serve `index.html` for application paths such as `/resident/requests`. The supplied `_redirects` works only on compatible hosts; configure an equivalent SPA fallback elsewhere.
- Missing chunks after an update may require a normal reload; do not clear all site data as the first action because it destroys demo work.

## Environment and connected errors

Demo requires no environment file. Connected mode requires **all three exact names** from [.env.example](../.env.example). To create your local file:

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows Command Prompt:

```bat
copy .env.example .env
```

Set mode to `demo` for local fictional exploration, or `connected` with your actual Supabase URL and public key. Do not use service-role/secret keys. Restart Vite after edits; environment values are embedded at build time for `dist/`. Check terminal/OS environment overrides and Vite `.env.local` variants if behavior contradicts `.env`.

**Cannot connect / invalid key:** inspect the failing request privately, confirm the intended project URL/public key and project availability, and check network/CSP errors. Do not paste headers/tokens into a public issue. Custom Supabase domains may require a corresponding production CSP allowlist update.

**Signup “database error” / profile unavailable:** apply all migrations in order; ensure valid name/phone/ward metadata. Invited/dashboard users need those fields too. Confirm email if your Auth configuration requires it. Recheck Site URL/redirect settings. Never drop tables or relax RLS to make signup succeed.

**Signed out on refresh:** expected in connected mode; tokens are in memory only. Sign in again. Demo identity/persistence uses localStorage instead.

**Wrong role after provisioning:** verify the correct Auth UUID in the trusted editor, then sign out/in. Public signup and profile editing cannot set role. Follow [provisioning](../supabase/seed/README.md).

**Image permission error:** verify the private `waste-images` bucket and policies from migration 1, the authorized actor/assignment, file format and 2 MB limit. Reopen details if a signed display URL expired. Do not make the bucket public or add an allow-everyone policy.

## Database migration failures

Use the [ordered migration list](DATABASE.md#migration-and-connected-setup). The first file is for a fresh schema and creates tables/functions once. “Already exists” may mean it already ran, not that it should be deleted. Check migration history and the first SQL error with the owner; apply only unapplied forward files.

Files 1 and 2 use transactions. Diagnose the failed statement and rollback state before retrying; do not assume the editor partially succeeded. File 3 adds a named constraint once. `NOT VALID` there means existing rows were not scanned, **not** that new rows bypass validation. Never drop existing operational records to resolve a constraint or FK error. The local SQL test uses stand-in schemas; passing it does not establish the remote project's migration state.

## Demo state does not persist / localStorage is unavailable

- Use the same browser profile **and exact origin**: protocol, hostname and port. `localhost`, `127.0.0.1`, port 5173 and port 4173 have separate storage.
- Private browsing and browser storage restrictions can make data temporary/unavailable. Test with synthetic data in a normal profile with site storage permitted.
- Photos are base64-encoded in a whole JSON snapshot and consume quota quickly. Retry without an optional image; reduce image size before upload.
- Concurrent tabs use last-writer-wins. Keep one sequential presentation tab. There is no merge/sync service for demo data.
- A malformed snapshot raises a workspace error rather than silently resetting it. If you need the old synthetic state, copy the `ecosort-demo-v1` value from Developer Tools storage to a private local backup **before** choosing Reset. It may contain photos; do not share it publicly.
- **Reset demo** requires confirmation and irreversibly replaces EcoSort demo records/photos. It does not erase unrelated storage. Do not call `localStorage.clear()` as a general repair.

Storage keys and validation are documented in [Architecture](ARCHITECTURE.md#demo-persistence). No import/recovery UI exists; if data matters, investigate with a teammate rather than editing raw JSON blindly.

## Location permission denied / map tiles missing

GPS is optional. Enter an address, both manual coordinates, or a map pin. Allow permission through the browser's site settings only if you want to. Geolocation generally requires localhost/HTTPS; physical-device accuracy/permissions were not verified. Starting Vite on a LAN address does not guarantee location APIs will work over plain HTTP.

Demo starts in **Offline coordinate view**, intentionally without streets. Turn on **Online map tiles** if you have internet. Network blockers/tile-service failure may prevent streets while coordinates remain usable; turn tiles off for an offline presentation. Records without coordinates do not appear as map markers; find them in All requests. External navigation needs internet and shares the destination with Google Maps.

## Playwright cannot launch Chromium

```bash
npx playwright install chromium
```

Because install scripts are disabled, browser installation is an explicit step. The config prefers `CHROMIUM_PATH`, then `/usr/bin/chromium`, then the Playwright download. Clear an outdated custom override or point it to a real executable.

macOS/Linux custom executable example (replace the path):

```bash
CHROMIUM_PATH="/absolute/path/to/chromium" npm run test:e2e
```

PowerShell equivalent:

```powershell
$env:CHROMIUM_PATH = "C:\path\to\chrome.exe"
npm run test:e2e
Remove-Item Env:CHROMIUM_PATH
```

On supported Linux distributions, missing browser system libraries can be installed using `npx playwright install --with-deps chromium`; review the command because it may request elevated access and change OS packages. Do not run application processes as root or turn off browser sandboxing as an unexplained workaround. Unsupported OS/browser combinations remain unverified.

## Tests fail

Read the first assertion and error context. Run a focused file (examples in [Testing](TESTING.md)), compare expected/actual state, and check demo/connected configuration before altering code. Inspect `playwright-report/` and `test-results/`; traces/screenshots may contain entered data, so use only synthetic input.

Formatting failures: run `npm run format` then inspect the changes. Type/lint/logic failures: fix the cause; do not suppress errors, remove tests or lower expectations without understanding them. Audit findings: assess and coordinate a targeted update; do not run `npm audit fix --force` blindly.

When asking for help, include OS, Node/npm versions, exact command, first error, page/role and synthetic reproduction steps. Redact credentials/tokens. State whether the failure is demo, embedded SQL, mocked connected behavior or a real hosted integration.
