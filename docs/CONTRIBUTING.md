# Contributing as a teammate

This guide suggests a lightweight Git workflow for small, reviewable changes. These branch/commit conventions are **team recommendations**, not existing branch protection or CI rules. Read [Team handoff](TEAM_HANDOFF.md) and [CONSTRAINTS.md](../CONSTRAINTS.md) before changing behavior.

## First establish a shared repository

The repository is `git@github.com:milan-kb/EcoSort.git`, with `origin` as the remote and `main` as the shared branch. If working from a ZIP, get a proper clone before using the commands below. No license has been selected; do not publish elsewhere, force-push or choose a license on behalf of the team.

The examples below use `main` as the base and `origin` as the remote. Check your clone's configuration with:

```bash
git status
git remote -v
git branch -a
```

## Start one focused branch

Begin with a clean working tree. Commit your own unfinished work or coordinate it before switching; never discard someone else's changes.

```bash
git switch main
git pull --ff-only origin main
git switch -c docs/improve-setup-guide
```

`--ff-only` updates without creating an unexpected merge. If Git refuses because histories diverged, inspect with a teammate instead of resetting/force-pushing.

Recommended names:

- `feature/short-description` for an agreed new capability.
- `fix/short-description` for a reproduced bug.
- `docs/short-description` for documentation.

Agree on file ownership before parallel work, especially `src/app/context.tsx`, shared domain rules and migrations. Avoid unrelated formatting, dependency upgrades and renames in a focused fix.

## Edit and check

Read the affected feature end to end and use existing helpers. Preserve pickup/dumping separation, legal transitions, private data access and honest demo labels. Keep educational advice locally reviewable; do not invent accepted materials or municipal agreements.

For behavior changes add/update a regression test. For documentation, check links, exact labels and command names. Run the relevant check first, then the full local checklist from [Testing](TESTING.md). At minimum do not submit unexplained failing type/lint/format/build checks. No test skipping, unsafe role policies or secret-containing fixtures.

Database changes must be coordinated, forward-only new migration files applied after the current three files. Do not silently edit an already-applied migration to change existing databases. Review grants, RLS, Storage and the SQL regression suite together. Use a disposable development project, never a live dataset for experiments.

## Make small commits

Inspect what will be shared and stage explicit paths:

```bash
git diff
git add docs/START_HERE.md
git diff --cached
git commit -m "docs: clarify first-run demo setup"
```

One commit should explain one change. Prefixes such as `docs:`, `fix:` and `feat:` are suggested, not enforced. Never stage `.env`, credentials, personal data, `node_modules/`, generated test traces or a large unrelated build. If you discover a secret, coordinate revocation, not just file deletion.

## Stay current and submit a pull request

To update your existing topic branch after committing your work:

```bash
git fetch origin
git merge origin/main
```

This merges the current team base into your branch. If conflicts appear, inspect each marked section, agree on the correct combined behavior, then stage resolved files, finish the merge and rerun tests. Do not accept an entire side blindly or resolve by deleting tests. Small changes and early coordination reduce conflicts.

Only when you intend to share your branch and have permission:

```bash
git push -u origin docs/improve-setup-guide
```

Open a pull request (PR: a proposed change for review) on the team's hosting platform. This handoff does not create a remote or push anything. Suggested PR description:

```text
Purpose: What problem does this solve?
Changes: Which screens/files/contracts changed, and why?
Verification: Exact commands run and observed results.
Visual evidence: Synthetic screenshots if relevant.
Risk/limits: Migrations, compatibility, blocked checks or follow-up.
```

Ask another teammate to review before merging. Reviewers should reproduce the behavior, inspect tests and access rules, check mobile/keyboard use where relevant, and distinguish a blocker from a style preference. Authors should answer feedback and rerun affected checks. No mandatory approval count or automated merge gate exists in this checkout; agree on one with the owner.

## Documentation and credits

Keep user behavior in [Feature guide](FEATURE_GUIDE.md), code flow in [Architecture](ARCHITECTURE.md), database/security contracts in their dedicated guides, and executed results in dated reports. Link instead of copying large reports. Add verified contributor credits only with agreement; fictional seed users are not project contributors. No license has been selected.
