---
name: staging-verification
description: >-
  Runbook to verify environment isolation and that staging works for
  {{PROJECT_NAME}}. Use this WHENEVER you need to confirm staging/prod separation
  after a change, or you see "verify staging", "check isolation", "did this leak
  to prod", "test environment separation", "does staging point at staging", "prove
  the webhook hits staging". Provides isolation tests — single-marker DB routing,
  cross-service URL host check, full end-to-end chain landing in staging,
  migration auto-apply, PR-preview isolation, auth-secret split, and API-key
  attribution — each with what it proves and how to clean up.
---

# Staging verification — isolation runbook

Run after any change that could affect isolation (env vars, URLs, auth secrets,
migrations, deploy config). Each test states **what it proves** and **cleanup**.

## Conventions

- **Read prod (read-only):** `supabase db query --linked -f <file.sql>`
  (LINKED = prod `{{SUPABASE_PROD_REF}}`).
- **Read/write the dev branch:** pull a connection without printing secrets; use
  the session-mode pooler (port 5432, not 6543):
  ```bash
  eval "$(supabase branches get {{SUPABASE_DEV_BRANCH_NAME}} -o env)"
  export DEV_DB_URL="${POSTGRES_URL/:6543\//:5432/}"
  psql "$DEV_DB_URL" -c "select 1;"
  ```
- Pick a unique marker per run: `MARK="routing-$(date +%s)"`.

## 1. Single-marker database routing (local · staging preview · prod)

**Proves:** each environment writes to the right DB — local→dev branch, staging
preview→dev branch, prod→prod — and nothing leaks across.
1. Create a uniquely-named record in each environment through the app
   (`$MARK-local`, `$MARK-preview`, `$MARK-prod`).
2. Query for `'routing-%'` against the dev branch and prod.

**Pass:** staging shows `-local` and `-preview`, not `-prod`; prod shows only
`-prod`. **Cleanup:** delete the markers on the matching DB.

## 2. Cross-service URL host check

**Proves:** URLs one service embeds for another point at the same-environment
peer. Trigger the flow that generates a cross-service URL in **staging**; inspect
the host. **Pass:** the host is the staging peer (or localhost locally), never the
production host. **Cleanup:** delete any created row.

## 3. Full chain lands in staging (+ webhooks target staging)

**Proves:** an end-to-end run started from a staging entry point writes all its
rows to **staging**, and any third-party callback returns to the staging host.
Complete a short run from staging, then check rows exist in staging and not prod.
A row written by the *callback* is end-to-end proof the webhook hit staging.
**Pass:** new rows in staging only. **Cleanup:** delete the test rows, children
first.

## 4. Migration auto-apply on staging

**Proves:** migrations auto-apply on push to `{{STAGING_BRANCH}}` — no manual
`db push`. Add a trivial migration (`create table if not exists
public.verify_autoapply (id int primary key);`), PR → merge locally, then
`psql "$DEV_DB_URL" -c "select to_regclass('public.verify_autoapply');"`.
**Pass:** the table exists with no manual command. **Cleanup:** a follow-up
migration `drop table if exists public.verify_autoapply;` merged into staging
(never hand-drop on prod).

## 5. PR-preview isolation

**Proves:** a throwaway PR preview reads staging (Preview scope), never prod. Open
a trivial PR for a preview deploy; on it, read something that reveals the backing
DB (e.g. a marker from test 1). **Pass:** preview shows staging data, never
prod-only data. **Cleanup:** close the PR (the preview tears down).

## 6. Auth-secret split (a staging token is rejected by prod)

**Proves:** the token-signing secret differs across environments. Take a
staging-issued token and present it to the **production** host (swap host, keep
token). **Pass:** prod rejects it. **Cleanup:** none — a rejected verify writes
nothing.

## 7. API-key attribution

**Proves:** paid third-party calls bill to each environment's own key. Trigger one
such action per environment, then check the provider console's usage attribution.
**Pass:** the staging action lands under the staging key, prod under prod. If both
land on one key, **flag it** — the keys are not split. **Cleanup:** delete
throwaway records.

## Quick pre-write sanity check (always)

```bash
supabase projects list        # LINKED project (prod = {{SUPABASE_PROD_REF}})
supabase branches get {{SUPABASE_DEV_BRANCH_NAME}}
git branch --show-current     # a feature branch, never a long-lived branch
```

## Related skills

`environments-and-env-vars`, `database-and-migrations`, `branch-and-pr-workflow`.
