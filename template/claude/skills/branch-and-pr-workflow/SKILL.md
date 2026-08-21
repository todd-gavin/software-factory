---
name: branch-and-pr-workflow
description: >-
  Git branch, pull-request, and release workflow for {{PROJECT_NAME}}. Use this
  WHENEVER you are about to create a branch, open or merge a PR, integrate into
  {{STAGING_BRANCH}}, or promote to production — and when a task mentions
  "branch", "open a PR", "merge", "release", "promote to prod", "ship to
  {{PROD_BRANCH}}", or "stacked PRs". Enforces: feature-branch-off-
  {{STAGING_BRANCH}} then PR-into-{{STAGING_BRANCH}}, never commit/push directly
  to {{PROD_BRANCH}} or {{STAGING_BRANCH}}, stacked PRs merge bottom-up,
  {{STAGING_BRANCH}}→{{PROD_BRANCH}} promotion as a deliberate PR, one
  decision-log entry per PR (in docs/decisions/, NOT CLAUDE.md), and LOCAL (not
  GitHub web UI) integration merges so the merge=union driver runs.
---

# Branch and PR workflow

Two long-lived branches: **`{{PROD_BRANCH}}` = production,
`{{STAGING_BRANCH}}` = staging.**

## Always-follow rules

- **Never commit or push directly to `{{PROD_BRANCH}}` or `{{STAGING_BRANCH}}`.**
- Every change is a **feature branch cut from `{{STAGING_BRANCH}}`**, merged by
  **PR into `{{STAGING_BRANCH}}`**.
- **Stacked PRs merge bottom-up:** if branch B is stacked on branch A, A merges
  into `{{STAGING_BRANCH}}` first, then B.
- **Promotion to production is a deliberate PR** from `{{STAGING_BRANCH}}` →
  `{{PROD_BRANCH}}`. That PR is the release: it runs the accumulated migrations on
  prod and ships the production deploy.
- The agent **may** create branches, commit, push, and open PRs; it **must not**
  merge PRs, force-push, delete branches, or change repo settings. **Every PR is
  human-reviewed before merge.**
- **Destructive calls are a named review surface.** A PR that adds a
  `// destructive-allowed: <reason>` annotation or destructive migration SQL
  requires the human reviewer to explicitly sign off on that specific line — call
  these out in the PR description; never bury them.
- **One decision-log entry per PR**, appended to the current month's file in
  `docs/decisions/` (NOT CLAUDE.md), then any durable conclusion distilled up into
  CLAUDE.md's "Current state and standing decisions". How-to: the
  **`logging-and-curation`** skill.
- **Report briefings are PR'd too.** `/report` and `/start` write a dated briefing
  to `docs/reports/` and land it via a dedicated **`report/<slug>` branch → PR** —
  never loose in the working tree, never a direct commit to a long-lived branch. A
  report PR needs **no** decision-log entry.

## Choosing what to branch from (the default + the stacking exception)

Run this when starting **any** new work. **The default is to branch off
`{{STAGING_BRANCH}}`.** Stacking is the deliberate exception, used only when the
new work has a true **code dependency** on changes not yet merged — not mere
thematic relatedness.

1. **Check what's unmerged:** `gh pr list`.
2. **Ask: does this work require code that lives in an open, unmerged PR?**
   - **No →** branch off `{{STAGING_BRANCH}}`. The common case.
   - **Yes, and the prerequisite is reviewed and ready →** merge the prerequisite
     first, then branch off the updated base. **Prefer this over stacking.**
   - **Yes, but the prerequisite can't merge yet →** **stack**: branch off the
     prerequisite's branch, merge **bottom-up**, and **rebase if the base moves**.
3. **The human confirms the dependency and the choice.** Surface candidates, but
   never silently infer a stack from thematic similarity.

## Stacks: the single-writer convention

A stack of related PRs produces **one** combined decision-log entry and **one**
HANDOFF note, both riding the **topmost** PR. The lower PRs' bodies say so
("decision log + HANDOFF ride PR #<top>"). One decision, one entry — and one
writer per shared document avoids three-way interleaving in the log.

If the base has drifted significantly under an open stack, do a deliberate
**rebase-and-reconcile** pass and give that pass its own decision entry describing
what was reconciled.

## Integration merges run locally, not in the web UI

`.gitattributes` sets `merge=union` on **`docs/decisions/*.md`** (not CLAUDE.md),
which auto-resolves concurrent appends — **but the union driver only runs on a
LOCAL merge.** The GitHub web UI bypasses it. Do integration merges locally.

## Typical loop

```bash
git fetch origin
git checkout -b feat/my-change origin/{{STAGING_BRANCH}}
# …work, verify…
git push -u origin feat/my-change
gh pr create --base {{STAGING_BRANCH}} --head feat/my-change
```

## Promotion to production

```bash
gh pr create --base {{PROD_BRANCH}} --head {{STAGING_BRANCH}} \
  --title "Promote {{STAGING_BRANCH}} → {{PROD_BRANCH}}"
```

## Related skills

- `logging-and-curation` — the per-PR decision entry + distill up.
- `database-and-migrations` — what the promotion runs on prod.
- `environments-and-env-vars` — what each branch/deploy reads.
- `resume-cold-handoff` — orient (delta-load) before starting a branch.
