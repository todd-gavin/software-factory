# Placeholder dictionary

Every `{{TOKEN}}` used in `template/` (and in the doctrine's command examples),
what it means, and where to get the value. Fill all of them before the harness is
usable — a leftover `{{TOKEN}}` in a live CLAUDE.md or skill is a silent bug,
because the agent will read it as literal text.

**Verify when done:** `grep -rn '{{' <the files you installed>` must come back
empty (except for the intentional `{{ROUND_FOCUS}}`-style tokens of your own app,
if any).

## Identity

| Token | Meaning | Example | Where to get it |
|---|---|---|---|
| `{{PROJECT_NAME}}` | Human name of the project, used in skill descriptions | `Acme Platform` | You |
| `{{REPO_NAME}}` | The repository directory name | `acme-platform` | `basename $(git rev-parse --show-toplevel)` |
| `{{PACKAGE_SCOPE}}` | npm scope for internal packages (monorepo only) | `@acme` | `package.json` |

## Branches

| Token | Meaning | Example | Where to get it |
|---|---|---|---|
| `{{PROD_BRANCH}}` | The production branch | `main` | `git branch -r` |
| `{{STAGING_BRANCH}}` | The staging branch | `dev` | `git branch -r` |

> If your repo currently has only one long-lived branch, **create the second one
> before installing.** The whole model rests on staging being a real branch with a
> real deploy, not an aspiration.

## Supabase

| Token | Meaning | Example | Where to get it |
|---|---|---|---|
| `{{SUPABASE_PROD_REF}}` | Production project ref | `abcdefghijklmnopqrst` | `supabase projects list` |
| `{{SUPABASE_DEV_BRANCH_REF}}` | Persistent staging branch's project ref | `uvwxyzabcdefghijklmn` | `supabase branches list` |
| `{{SUPABASE_DEV_BRANCH_NAME}}` | The branch's *name* (used in CLI calls) | `dev` | `supabase branches list` |
| `{{SUPABASE_ARCHIVE_REF}}` | An old project that must never be written to | `opqrstuvwxyzabcdefgh` | You. **Omit the block if none** |
| `{{MIGRATIONS_DIR}}` | Where migrations live | `supabase/migrations` | Repo |
| `{{TYPES_PATH}}` | Generated database types | `packages/db/src/database.types.ts` | Repo |
| `{{SEED_SCRIPT_PATH}}` | The staging reseed script | `scripts/seed-dev-from-prod.sh` | Installed by this kit |

`{{#ARCHIVE_REF}} … {{/ARCHIVE_REF}}` is a **conditional block**: if you have no
dormant archive project, delete the block and its markers entirely. If you do,
delete just the two marker lines and keep the content. Naming a
never-write-to-this project is worth doing — it is exactly the kind of thing an
agent cannot infer and will otherwise treat as fair game.

## Hosting

| Token | Meaning | Example |
|---|---|---|
| `{{HOST_PLATFORM}}` | The hosting platform, by name | `Vercel` |
| `{{APP_ROOT}}` | Path to an app's root | `apps/web` |
| `{{APP_NAME}}` | An app's directory name | `web` |
| `{{APP_DESCRIPTION}}` | One line on what the app is | `customer-facing Next.js app` |
| `{{APP_PORT}}` | Local dev port | `3000` |
| `{{APPS_SUMMARY}}` | A sentence or two naming every app and its role | see below |
| `{{ENV_EXAMPLE_PATH}}` | The committed env template path | `apps/*/.env.example` |

`{{APPS_SUMMARY}}` example:

> Three apps, all on Vercel: **web** (:3000), **admin** (:3001), **worker**
> (:3002 — one secret-gated `POST /api/run` route). `pnpm dev:all` runs all three
> locally.

Single-app repos: collapse it to one sentence and delete the per-app rows.

## Commands

| Token | Meaning | Example |
|---|---|---|
| `{{DEV_CMD}}` | Start local dev | `pnpm dev:all` |
| `{{TYPECHECK_CMD}}` | Strict typecheck | `pnpm -r exec tsc --noEmit` |
| `{{LINT_CMD}}` | Lint | `pnpm lint` |
| `{{BUILD_CMD}}` | Production build | `pnpm build` |
| `{{TEST_CMD}}` | Test suite (used in doctrine/04) | `pnpm test` |

These four are what [`doctrine/04-verification-and-done.md`](doctrine/04-verification-and-done.md)
calls the green bar. Get them right — they are the concrete meaning of "done" in
this repo, and an agent will run literally what you write.

## Stack and misc

| Token | Meaning | Example |
|---|---|---|
| `{{TECH_STACK}}` | Bulleted stack list for CLAUDE.md §2 | see below |
| `{{LLM_KEY_NAME}}` | The env var holding your LLM key | `ANTHROPIC_API_KEY` |
| `{{FIRST_MONTH}}` | First month file in the decision log | `2026-08` |
| `{{YYYY-MM}}` | Month header inside a month file | `2026-08` |

`{{TECH_STACK}}` example:

```markdown
- **Next.js 16** App Router, **React 19**, **TypeScript strict**.
- **Tailwind v4 + shadcn/ui** (radix-ui, lucide icons).
- **Supabase** (Postgres + Storage) for persistence.
- **Anthropic Claude** for all LLM synthesis.
```

## Not placeholders

`{{PLACEHOLDER}}` appears once inside an HTML comment in `CLAUDE.md.template` as
part of the instructions. Delete the comment; it is not a value to fill.
