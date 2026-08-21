---
name: devops-overview
description: >-
  Map of the {{PROJECT_NAME}} DevOps model and the other devops skills. Use this
  WHENEVER you need the big picture of how this repo/project works, is built,
  deployed, or operated, when onboarding or orienting, or when a task spans
  multiple devops concerns — triggers on "how does this repo/project work",
  "explain the setup/architecture", "onboard me", "what's the workflow here",
  "devops", "how does deployment work", "environment model", "CI/CD", "how do we
  ship", "ops", "infrastructure", "local to dev to prod". Summarizes the
  local→staging→prod *process model* and points to branch-and-pr-workflow,
  environments-and-env-vars, database-and-migrations, staging-verification,
  resume-cold-handoff, and logging-and-curation. For LIVE project state, see
  CLAUDE.md → "Current state and standing decisions" (the single source of
  current-state truth) — this skill describes process, not live state.
---

# DevOps overview

{{PROJECT_NAME}} runs a strict **local → staging → production** model with **no
shared resources between tiers**. Only `{{PROD_BRANCH}}` touches a production
resource. CLAUDE.md → "Environments and workflow (read first)" carries the
always-follow rules inline; these skills carry the detail and auto-load on the
matching task.

| Tier | git | Supabase | {{HOST_PLATFORM}} | keys |
|---|---|---|---|---|
| **local** | feature branch | dev branch `{{SUPABASE_DEV_BRANCH_REF}}` | none (`{{DEV_CMD}}`) | local `.env.local` |
| **staging / preview** | `{{STAGING_BRANCH}}` | dev branch `{{SUPABASE_DEV_BRANCH_REF}}` | every Preview | staging keys |
| **production** | `{{PROD_BRANCH}}` | project `{{SUPABASE_PROD_REF}}` | Production | prod keys |

{{APPS_SUMMARY}}

## The skills

- **`branch-and-pr-workflow`** — branches, PRs, stacking, promotion, decision-log
  discipline, local integration merges.
- **`environments-and-env-vars`** — the three environments, hosting scope model,
  the same-environment-peer URL rule, the per-variable→scope table.
- **`database-and-migrations`** — auto-apply on push to staging, never `db push`
  on prod, reseed script, verify-before-write, project/branch IDs.
- **`staging-verification`** — the isolation tests (what each proves + cleanup).
- **`resume-cold-handoff`** — delta-load when picking up cold.
- **`logging-and-curation`** — after a PR, append a decision entry and distill any
  durable conclusion up into CLAUDE.md.

## Development doctrines (always apply)

1. **Destructive operations are fenced.** Soft-delete/archive/supersede over hard
   deletes; migrations are additive; a destructive database or storage call in app
   code requires a `// destructive-allowed: <reason>` annotation on the same or
   preceding line **plus** explicit human sign-off in PR review. Enforced by the
   two jobs in `.github/workflows/destructive-migration-check.yml` (`scan` for
   migration SQL; `app-code-scan` for app code).
2. **Failures block during development.** Observability and pipeline failures
   THROW and surface — nothing silently continues with unintended behavior. When a
   side output truly must not block, it is *loudly* best-effort (a
   `console.error`, never a silent swallow).
3. **Gate-driven execution.** Multi-step work stops at the defined boundary and
   reports. Verification claims name their tier (static / automated / manual).

Full rationale: `software-factory/doctrine/`.

## Live state vs. process

This skill describes the **process**. The **live project state** lives in
**CLAUDE.md → "Current state and standing decisions"**, the single source of
current-state truth. The chronological per-PR history is in `docs/decisions/`.

## Skill discovery in this repo

Skills live in **`.claude/skills/<name>/SKILL.md`** (the project-level auto-load
location). A repo-root **`skills/`** symlink exists for browsing; the auto-trigger
comes from `.claude/skills/`.
