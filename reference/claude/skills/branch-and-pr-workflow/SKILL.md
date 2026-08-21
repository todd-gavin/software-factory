---
name: branch-and-pr-workflow
description: >-
  Git branch, pull-request, and release workflow for the miine-platform monorepo.
  Use this WHENEVER you are about to create a branch, open or merge a PR, integrate
  into dev, or promote to production — and when a task mentions "branch", "open a
  PR", "merge", "release", "promote to prod", "ship to main", or "stacked PRs".
  Enforces: feature-branch-off-dev then PR-into-dev, never commit/push directly to
  main or dev, stacked PRs merge bottom-up, dev→main promotion as a deliberate PR,
  one decision-log entry per PR (in docs/decisions/, NOT CLAUDE.md), and LOCAL
  (not GitHub web UI) dev-integration merges so the merge=union driver runs.
---

# Branch and PR workflow

Two long-lived branches: **`main` = production, `dev` = staging.**

## Always-follow rules

- **Never commit or push directly to `main` or `dev`.**
- Every change is a **feature branch cut from `dev`**, merged by **PR into `dev`**.
- **Stacked PRs merge bottom-up:** if branch B is stacked on branch A, A merges
  into `dev` first, then B.
- **Promotion to production is a deliberate PR from `dev` → `main`.** That PR is
  the release: it runs the accumulated migrations on prod and ships the Vercel
  Production deploy.
- Claude Code **may** create branches, commit, push, and open PRs; it **must
  not** merge PRs, force-push, delete branches, or change repo settings. **Every
  PR is human-reviewed before merge.**
- **Destructive calls are a named review surface.** A PR that adds a
  `// destructive-allowed: <reason>` annotation (the app-code destructive-call
  guard — see `database-and-migrations`) or destructive migration SQL (the
  `destructive-migration-reviewed` label) requires the human reviewer to
  explicitly sign off on that specific line — call these out in the PR
  description; never bury them.
- **One decision-log entry per PR**, appended to the current month's file in
  `docs/decisions/` (NOT CLAUDE.md), then any durable conclusion distilled up into
  CLAUDE.md's "Current state and standing decisions". The append-then-distill
  how-to lives in the **`logging-and-curation`** skill.
- **Project report briefings are PR'd too.** `/report` (and `/start`) write a dated
  briefing to `docs/reports/` and land it via a dedicated **`report/<slug>` branch
  → PR into `dev`** — never loose in the working tree, never a direct `dev` commit.
  A report PR needs **no** decision-log entry (it records nothing architectural).
  The exact steps live in `.claude/commands/report.md`.

## Choosing what to branch from (the default + the stacking exception)

Run this when starting **any** new work. **The default is to branch off `dev`.**
Stacking (branching off another open PR's branch) is the deliberate exception, used
only when the new work has a true **code dependency** on changes not yet in `dev` —
not mere thematic relatedness.

1. **Check what's unmerged:** `gh pr list` — see which PRs are open.
2. **Ask: does this work require code that lives in an open, unmerged PR?** (a real
   code dependency, not just a related topic.)
   - **No →** branch off `dev`. The common case: independent work, mergeable in any
     order.
   - **Yes, and the prerequisite PR is reviewed and ready →** merge the prerequisite
     into `dev` first, then branch off the updated `dev`. **Prefer this over
     stacking** — it dissolves most dependencies.
   - **Yes, but the prerequisite can't be merged yet** (still in review, or the set
     is meant to be reviewed together) → **stack**: branch off the prerequisite's
     branch, merge the stack **bottom-up** (see below), and **rebase the stack if
     its base changes**.
3. **The human confirms the dependency and the choice.** Surface candidates (e.g.
   "this touches files PR #X also changes — confirm whether it depends on #X"), but
   do **not** silently infer a stack from thematic similarity. Dependency is about
   code coupling and intent, which the human confirms.

## Integration merges run locally, not in the web UI

`.gitattributes` sets `merge=union` on **`docs/decisions/*.md`** (not CLAUDE.md),
which auto-resolves concurrent decision-log appends — **but the union driver only
runs on a LOCAL merge.** Merging `dev` integration through the GitHub web UI
bypasses it and surfaces conflicts by hand. Do `dev`-integration merges locally.
(CLAUDE.md is deliberately not union-merged — its curated synthesis wants
deliberate conflict resolution.)

## Typical loop

```bash
git fetch origin
git checkout -b feat/my-change origin/dev      # cut from dev
# …work…
git push -u origin feat/my-change
gh pr create --base dev --head feat/my-change   # PR INTO dev (never main)
# after human review + a LOCAL integration merge, dev auto-deploys to preview
```

## Promotion to production

```bash
# deliberate release: dev → main (human-reviewed)
gh pr create --base main --head dev --title "Promote dev → main"
# merging runs accumulated migrations on prod and ships the Production deploy
```

## Related skills

- `logging-and-curation` — how to write the per-PR decision entry + distill up.
- `database-and-migrations` — what the dev→main promotion runs on prod.
- `environments-and-env-vars` — what each branch/deploy reads.
- `resume-cold-handoff` — orient (delta-load) before starting a branch.
