# Security: trust boundaries and known limits

This guide explains the implemented controls and what has actually been tested. It is not a production security certification. Use [Database](DATABASE.md) for setup and [FINAL_QA_REPORT.md](../FINAL_QA_REPORT.md) for dated findings.

## Authentication versus authorization

**Authentication** answers “who signed in?” Connected EcoSort uses Supabase email/password Auth. **Authorization** answers “what may that identity read or change?” PostgreSQL policies/functions enforce it independently of browser buttons.

Public signup creates residents only. The `handle_new_user` trigger ignores caller-supplied role metadata. Auth sessions are held in memory (`persistSession: false`); token refresh is enabled, but reloading/closing the tab requires signing in again. This SPA has no backend setting HttpOnly cookies. No OTP, password recovery UI or self-service account deletion is implemented.

Frontend route guards improve navigation but are not security boundaries. Changing a URL, JavaScript object or metadata must not grant database privileges. The connected repository does not use its caller-supplied actor argument as SQL authority; functions derive identity from `auth.uid()`.

## Read and write permissions

| Role          | Reads                                                                                                             | Writes through authorized functions                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Resident      | Own requests and related history/assignments/collections; own profile and qualifying assigned collector profiles. | Own new requests, own contact fields, reasoned cancellation of own Pending request.                             |
| Collector     | Requests with their active/completed assignments and related records; own profile.                                | Start assigned jobs; confirm own in-progress jobs with destination and optional proof; edit own contact fields. |
| Administrator | Operational requests, related records and profiles.                                                               | Assign/reassign before start; close legally unfinished requests with reasons; edit own contact fields.          |

RLS is enabled on every public application table. Authenticated clients have SELECT-only table grants; writes use explicit RPCs, not general-purpose update APIs. No role-edit endpoint is exposed. Privileged provisioning must occur through trusted project administration following [supabase/seed/README.md](../supabase/seed/README.md). A software collector role does not certify real handling qualifications.

Request row locks, status constraints and audit triggers protect SQL integrity. Completion creates one collection per request; missing confirmation, wrong actor, illegal state and hazardous-destination mismatch are rejected. This constrains access and sequence, **not physical truth**: a permitted collector can still make a false statement. Optional photos, actor/timestamp history and review improve accountability but do not independently prove collection or treatment.

## Missing-profile closure bypass: fixed regression

The final QA found a critical three-valued SQL logic mistake in the original `close_request`. An authenticated identity with no matching profile made role comparisons return `NULL`. In PL/pgSQL, an `IF NOT(NULL)` condition is not true, so the denial branch was skipped. An otherwise legal closure of another user's request could proceed.

[Migration 202610150002](../supabase/migrations/202610150002_close_authorization.sql) explicitly rejects a null actor and uses `authorization_expression IS NOT TRUE` to fail closed. It also explicitly rejects null closing status. The SQL harness creates a missing-profile identity and attempts unauthorized closure; this failed to reject before the fix and rejects after applying all migrations.

**Apply the forward migration to existing projects.** The initial migration intentionally remains historical, including the superseded function; applying only that file is unsafe. The harness now reads all `.sql` migrations in filename order so the regression tests the final schema. No remote migration was applied during QA or this documentation handoff.

## Private images and external data flows

- `waste-images` is private with a 2 MB bucket limit and JPEG/PNG/WebP allowlist. Browser checks also inspect file signatures; full server decoding/malware scanning is not implemented.
- Upload policy requires an authenticated owner-prefixed UUID path. Residents can upload in their namespace; collectors require an active assignment for the path's request. RPC attachment checks additionally verify the object exists and belongs to the actor/request.
- Read policy permits the uploader or an authorized reader of the request referencing an image/proof. Five-minute signed URLs are bearer links: anyone holding an issued link may use it until expiry. Do not publish them.
- Delete policy permits an uploader to clean up only **unreferenced** images. A security-definer reference check prevents deletion of still-referenced evidence after losing request visibility. There is no general authenticated image-update policy.
- Upload and SQL are separate operations. Failure attempts cleanup; network interruption can leave an orphan. Trusted operational cleanup remains necessary.
- User text is rendered through React escaping; uploads render as images rather than executable HTML. This is not a claim that all future uses are automatically safe.
- Household locations never appear on a public application map. Online tiles contact OSM; Google Maps navigation explicitly shares a destination externally. GPS is optional. Keep real data out of screenshots and browser traces.

## Demo is not secure multi-user storage

Demo role switching is explicitly limited to demo mode. All personas are fictional; no email/password authentication occurs. `localStorage` is browser-editable and readable to scripts on the same origin. Repository permission checks keep the demonstration consistent, but cannot protect data from the browser owner.

Demo stores photos and the whole snapshot locally and has last-writer-wins behavior. Do not store real names, locations or photos. Validation detects malformed records but is not tamper evidence, encryption, backup or referential-integrity enforcement equivalent to PostgreSQL.

## Secrets and deployment

`VITE_` variables are included in browser builds. The URL/public anon-or-publishable key may be exposed only because backend authorization is designed around public clients. A service-role or secret key bypasses intended boundaries and must never appear there, in source, docs, chat, screenshots or test fixtures.

`.env`/`.env.*` are ignored except `.env.example`; Git ignore rules are not secret scanning. Check staged diffs before sharing. If a secret is exposed, revoke/rotate it with the project owner; deleting the text alone does not revoke credentials.

[public/_headers](../public/_headers) and [public/_redirects](../public/_redirects) supply headers/SPA rewrites for compatible static hosts. Other hosts need equivalent HTTPS, path fallback, CSP/frame/no-sniff/referrer/permission policies. Custom Supabase domains require adjusting CSP host allowlists. Vite dev/preview has basic headers, not proof of production CSP/HSTS. No host is deployed or verified by this handoff.

Before real personal data: agree on consent/privacy notices, retention, erasure/export handling, backups, incident response and correction procedures. The app has no completed regulatory-compliance or post-collection correction workflow.

## Evidence and reporting

- **Executed:** PostgreSQL grants, RLS, constraints, authorized RPCs, rollback, missing-profile denial and protected proof references through PGlite; demo browser role restrictions/workflow; mocked connected signup/session tests.
- **Static review:** client configuration, memory-only tokens, provisioning path, private image design and source secret-pattern inspection.
- **Not verified:** hosted Auth/email/JWT lifecycle, hosted Storage HTTP validation/signing, deployed RLS and cross-device connected operations. Credentials are unavailable.

To report a suspected issue, contact the repository owner privately with affected files, synthetic reproduction steps, expected/actual behavior and environment. No private reporting address is configured here; do not invent one or post real credentials/data publicly. Preserve evidence and run the smallest relevant [regression check](TESTING.md) before claiming a fix.
