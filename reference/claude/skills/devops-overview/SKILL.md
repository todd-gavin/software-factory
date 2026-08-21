---
name: devops-overview
description: >-
  Map of the miine-platform DevOps model and the other devops skills. Use this
  WHENEVER you need the big picture of how this repo/project works, is built,
  deployed, or operated, when onboarding or orienting, or when a task spans
  multiple devops concerns — triggers on "how does this repo/project work",
  "explain the setup/architecture", "onboard me", "what's the workflow here",
  "devops", "how does deployment work", "environment model", "CI/CD", "how do we
  ship", "ops", "infrastructure", "local to dev to prod". Summarizes the
  local→dev→prod *process
  model* and points to branch-and-pr-workflow, environments-and-env-vars,
  database-and-migrations, staging-verification, resume-cold-handoff, and
  logging-and-curation (each auto-loads on its matching task). For LIVE project
  state, see CLAUDE.md → "Current state and standing decisions" (the single source
  of current-state truth) — this skill describes process, not live state.
---

# DevOps overview

The `miine-platform` monorepo runs a strict **local → dev → prod** model with **no
shared resources between tiers**. Only the `main` branch touches a production
resource. CLAUDE.md → "Environments and workflow (read first)" carries the
always-follow rules inline; these skills carry the detail and auto-load on the
matching task.

| Tier | git | Supabase | Vercel | keys |
|---|---|---|---|---|
| **local** | feature branch | dev branch `bfbphxbnboaibguawiov` | none (`pnpm dev:all`) | local `.env.local` |
| **dev / preview** | `dev` | dev branch `bfbphxbnboaibguawiov` | every Preview (all three apps) | dev keys |
| **production** | `main` | project `xhudgqbdsvvsjtfmjmor` | Production (all three apps) | prod keys |

Three apps, **all on Vercel**: **interview-agent** (:3000), **admin-platform**
(:3001), **context-miner** (:3002) — the miner is a minimal Next app exposing one
secret-gated triggered HTTP route `POST /api/mine` (runtime nodejs, `maxDuration`
800) that runs a full A→B→C pass and returns; the tsx CLI (`pnpm mine`) still works
for local manual runs. `pnpm dev:all` runs all three locally.

## The skills

- **`branch-and-pr-workflow`** — branches, PRs, stacking, dev→main promotion,
  decision-log discipline, local integration merges.
- **`environments-and-env-vars`** — the three environments, Vercel scope model,
  cross-app same-environment-peer URL rule, full per-variable→scope table.
- **`database-and-migrations`** — auto-apply on push to dev, never `db push`/
  `migration up` on prod, reseed script, verify-before-write, project/branch IDs.
- **`staging-verification`** — seven isolation tests (what each proves + cleanup).
- **`resume-cold-handoff`** — delta-load when picking up cold: anchor on your last
  commit, then load only what changed since.
- **`logging-and-curation`** — after a PR, append a decision entry to
  `docs/decisions/` and distill any durable conclusion up into CLAUDE.md.

## Development doctrines (always apply)

Two standing doctrines, established 2026-07-03, that every future change inherits:

1. **Destructive operations are fenced.** Soft-delete/archive/supersede over
   hard deletes; migrations are additive; a destructive database or storage
   call in app code requires a `// destructive-allowed: <reason>` annotation on
   the same or preceding line **plus** explicit human sign-off in PR review.
   Enforced by the two jobs in
   `.github/workflows/destructive-migration-check.yml` (`scan` for migration
   SQL; `app-code-scan` for app code — full protocol in
   `database-and-migrations`).
2. **Failures block during development.** Observability and pipeline failures
   THROW and surface — nothing silently continues with unintended behavior.
   Implemented example (PR #98): `emitEvent`/`writeCallIO` throw on a
   configured write failure; mints abort visibly, the miner fails through its
   run-level capture with the failing op named; when a side output truly must
   not block, it is *loudly* best-effort (`emitEventBestEffort` — console.error,
   never a silent swallow). New code follows the same shape: fail loud by
   default; a deliberate best-effort path must still log its failure.

## Live state vs. process

This skill (and the others) describe the **process**. The **live project state** —
what is built and currently true (observability, the dev branch, prompts, rounds,
schema) — lives in **CLAUDE.md → "Current state and standing decisions"**, the
single source of current-state truth. The chronological per-PR history is in
`docs/decisions/`. Process roadmap items still open (branch protection,
integration-merge automation, the context-miner Vercel deploy) are tracked there too.

## Skill discovery in this repo

Skills live in **`.claude/skills/<name>/SKILL.md`** (Claude Code's project-level
auto-load location). A repo-root **`skills/`** symlink → `.claude/skills/` exists
for browsing; the auto-trigger comes from `.claude/skills/`.
