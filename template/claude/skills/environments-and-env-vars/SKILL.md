---
name: environments-and-env-vars
description: >-
  The local→staging→prod environment model and the per-variable env reference for
  {{PROJECT_NAME}}. Use this WHENEVER you set, read, or reason about an
  environment variable, a deployment, a hosting scope, a URL between services, or
  "which database / which keys am I using" — triggers on "env var", ".env",
  ".env.local", "SUPABASE_URL", "API key", "deploy", "{{HOST_PLATFORM}}",
  "Preview vs Production scope", "secret". Covers the three no-shared-resource
  environments, Production vs Preview scope, the cross-service/self URL
  same-environment-peer rule, where real values live, and the full
  variable→scope table (value sources only, NO secrets).
---

# Environments and env vars

A strict three-tier model with **no shared resources between tiers**. Only
`{{PROD_BRANCH}}` touches a production resource.

| Environment | Set in | git branch | Supabase |
|---|---|---|---|
| **local** | each app's `.env.local` (gitignored) | a feature branch | dev branch `{{SUPABASE_DEV_BRANCH_REF}}` |
| **staging / preview** | {{HOST_PLATFORM}} **Preview** scope | `{{STAGING_BRANCH}}` | dev branch `{{SUPABASE_DEV_BRANCH_REF}}` |
| **production** | {{HOST_PLATFORM}} **Production** scope | `{{PROD_BRANCH}}` | project `{{SUPABASE_PROD_REF}}` |

The Preview scope applies to **all branches**, so the staging deploy and every PR
preview read staging values. **Only `{{PROD_BRANCH}}` reads the Production
scope.** Local points at the **dev** Supabase branch (never prod), with local
API keys.

## ⚠ Cross-service / self URLs — same-environment-peer rule

Any variable holding a URL to another service or to the app itself **must point at
the same-environment peer: staging→staging, prod→prod, local→localhost.** A
staging deploy pointing at a prod URL silently crosses the isolation boundary, and
everything downstream of it is production traffic wearing a staging label.

Classification: **[secret]** never browser-exposed, never committed ·
**[public]** browser-exposed (`NEXT_PUBLIC_*` or equivalent) · **[config]**
non-secret setting.

<!-- FILL IN one table per app. Value SOURCES only — never a value. -->

## {{APP_ROOT}} ({{HOST_PLATFORM}}, port {{APP_PORT}})

| Variable | Class | What it is | Value source per environment | Where set |
|---|---|---|---|---|
| `SUPABASE_URL` | config (env-specific) | Supabase project URL | prod `{{SUPABASE_PROD_REF}}` / dev branch `{{SUPABASE_DEV_BRANCH_REF}}` | Prod + Preview scopes, `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | service-role key matching `SUPABASE_URL`; bypasses RLS | prod project key / dev branch key | Prod + Preview scopes, `.env.local` |
| `{{LLM_KEY_NAME}}` | secret | LLM API calls | per-env key | Prod + Preview scopes, `.env.local` |
| `NEXT_PUBLIC_APP_URL` | public (self URL) | this app's own base URL | prod URL / preview URL / `http://localhost:{{APP_PORT}}` | Prod + Preview scopes, `.env.local` |
| *(add one row per variable this app reads)* | | | | |

## Where real values live

`.env.local` (local, gitignored) · the {{HOST_PLATFORM}} dashboard's Production
and Preview scopes. The committed `{{ENV_EXAMPLE_PATH}}` is the **variable list**,
not a place for real values. **No secret values in this skill — value sources
only.** Add or remove an env var → update the app's `.env.example` **and** this
table in the same PR.

## Related skills

`database-and-migrations` (Supabase IDs/connection), `staging-verification`
(prove isolation), `branch-and-pr-workflow` (which scope serves which branch).
