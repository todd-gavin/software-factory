---
name: environments-and-env-vars
description: >-
  The local→dev→prod environment model and the per-variable env reference for the
  miine-platform apps. Use this WHENEVER you set, read, or reason about an
  environment variable, a deployment, a Vercel scope, a URL between apps,
  or "which database / which keys am I using" — triggers on "env var", ".env",
  ".env.local", "SUPABASE_URL", "API key", "deploy", "Vercel", "Preview vs
  Production scope", "INTERVIEW_AGENT_URL", "NEXT_PUBLIC_APP_URL",
  "MINER_TRIGGER_SECRET", "secret". Covers the three no-shared-resource environments, Vercel Production vs
  Preview scope, the cross-app/self URL same-environment-peer rule, where real
  values live, and the full variable→scope table (value sources only, NO secrets).
---

# Environments and env vars

A strict three-tier model with **no shared resources between tiers**. Only `main`
touches a production resource.

| Environment | Set in | git branch | Supabase |
|---|---|---|---|
| **local** | each app's `.env.local` (gitignored) | a feature branch | dev branch `bfbphxbnboaibguawiov` |
| **dev / preview** | Vercel **Preview** scope (all three apps) | `dev` | dev branch `bfbphxbnboaibguawiov` |
| **production** | Vercel **Production** scope (all three apps) | `main` | project `xhudgqbdsvvsjtfmjmor` |

The Preview scope applies to **all branches**, so the `dev` deploy and every PR
preview read dev values. **Only `main` reads the Production scope.** Local points
at the **dev** Supabase branch (never prod), with local API keys.

## ⚠ Cross-app / self URLs — same-environment-peer rule

`INTERVIEW_AGENT_URL` and `NEXT_PUBLIC_APP_URL` (and, environment-specific too,
`SUPABASE_URL` and the CLI's `MIINE_API_URL`) **must point at the
same-environment peer: dev→dev, prod→prod, local→localhost.** A dev deploy
pointing at a prod URL silently crosses the isolation boundary. There is **no
miner URL** — mining is database-mediated (the miner polls `public.mining_runs`;
admin also runs `@miine/miner-core` in-process via `/api/companies/[id]/mine`).

Classification: **[secret]** never `NEXT_PUBLIC_*`, never committed ·
**[public]** browser-exposed (`NEXT_PUBLIC_*`) · **[config]** non-secret setting.

## apps/interview-agent (Vercel, port 3000)

| Variable | Class | What it is | Value source per environment | Where set |
|---|---|---|---|---|
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | public | ElevenLabs agent id | per-env ElevenLabs agent | Vercel Prod + Preview, `.env.local` |
| `NEXT_PUBLIC_APP_URL` | public (self URL) | this app's own base URL (absolute links + ElevenLabs webhook target) | prod URL / dev Preview URL / `http://localhost:3000` | Vercel Prod + Preview, `.env.local` |
| `ELEVENLABS_API_KEY` | secret | ElevenLabs API key | per-env ElevenLabs key | Vercel Prod + Preview, `.env.local` |
| `ELEVENLABS_WEBHOOK_SECRET` | secret | verifies inbound ElevenLabs webhook signatures | per-env webhook secret | Vercel Prod + Preview, `.env.local` |
| `ANTHROPIC_API_KEY` | secret | Claude calls (synthesis: summary / analysis / db.json) | per-env Anthropic key | Vercel Prod + Preview, `.env.local` |
| `TOKEN_SECRET` | secret | magic-link JWT signing/verify secret | random per env; **must match admin-platform within an env**, differ across envs | Vercel Prod + Preview, `.env.local` |
| `ADMIN_SECRET` | secret | shared secret for protected API routes + the CLI | random per env | Vercel Prod + Preview, `.env.local` (+ CLI: shell / `~/.miine/config.json`) |
| `DEVTOOLS_PASSWORD` | secret | password gating the internal `/dev-tools` connectivity page (server-side verify only) | random per env | Vercel Prod + Preview, `.env.local` |
| `SUPABASE_URL` | config (env-specific) | Supabase project URL | prod `xhudgqbdsvvsjtfmjmor` / dev branch `bfbphxbnboaibguawiov` | Vercel Prod + Preview, `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | service-role key (matches `SUPABASE_URL`'s project); bypasses RLS | prod project key / dev branch key | Vercel Prod + Preview, `.env.local` |
| `MIINE_API_URL` | config (optional, **CLI-only**) | API base the interview-agent CLI targets (self URL) | local→localhost / dev→dev / prod→prod | shell env / `~/.miine/config.json` — **NOT loaded from `.env.local`** |

> The CLI (`pnpm --filter @miine/interview-agent cli`) does not read `.env.local`;
> `MIINE_API_URL` and `ADMIN_SECRET` reach it via the shell/CI env or
> `~/.miine/config.json`.

## apps/admin-platform (Vercel, port 3001)

| Variable | Class | What it is | Value source per environment | Where set |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | secret | Claude calls (briefings + in-process "Run now" mining) | per-env Anthropic key | Vercel Prod + Preview, `.env.local` |
| `TOKEN_SECRET` | secret | magic-link JWT signing secret | random per env; **must match interview-agent within an env** | Vercel Prod + Preview, `.env.local` |
| `INTERVIEW_AGENT_URL` | config (**cross-app URL**) | base URL of the interview-agent app, embedded in minted magic links | prod interview-agent URL / dev interview-agent Preview URL / `http://localhost:3000` | Vercel Prod + Preview, `.env.local` |
| `SUPABASE_URL` | config (env-specific) | Supabase project URL (same project as the other apps) | prod project / dev branch | Vercel Prod + Preview, `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | service-role key (matches `SUPABASE_URL`'s project); bypasses RLS | prod project key / dev branch key | Vercel Prod + Preview, `.env.local` |

## apps/context-miner (Vercel, :3002 — triggered HTTP route `POST /api/mine` + tsx CLI)

| Variable | Class | What it is | Value source per environment | Where set |
|---|---|---|---|---|
| `MINER_TRIGGER_SECRET` | secret | shared secret required on `POST /api/mine` (`x-miner-trigger-secret` header); gates Opus spend | random per env | Vercel Prod + Preview, `.env.local` |
| `SUPABASE_URL` | config (env-specific) | Supabase project URL | prod `xhudgqbdsvvsjtfmjmor` / dev branch `bfbphxbnboaibguawiov` | Vercel Prod + Preview, `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | service-role key (the **only** Supabase key the miner reads — no anon key) | prod project key / dev branch key | Vercel Prod + Preview, `.env.local` |
| `ANTHROPIC_API_KEY` | secret | Stage A/B/C derivation (Claude calls) | per-env Anthropic key | Vercel Prod + Preview, `.env.local` |

> Next auto-loads `.env.local` for the HTTP route. The tsx CLI (`pnpm mine`) loads
> `apps/context-miner/.env.local` first, then falls back **per variable** to
> `apps/interview-agent/.env.local`.

## Where real values live

`.env.local` (local, gitignored) · Vercel dashboard Production + Preview scopes
(all three apps). The committed `apps/*/.env.example` is the
**variable list**, not a place for real values. **No secret values in this skill —
value sources only.** Add/remove an env var → update the app's `.env.example`
**and** this table in the same PR.

## Related skills

`database-and-migrations` (Supabase IDs/connection), `staging-verification`
(prove isolation), `branch-and-pr-workflow` (which scope serves which branch).
