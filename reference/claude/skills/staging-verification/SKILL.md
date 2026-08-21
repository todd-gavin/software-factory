---
name: staging-verification
description: >-
  Runbook to verify environment isolation and that staging works for the
  miine-platform repo. Use this WHENEVER you need to confirm dev/prod separation
  after a change, or you see "verify staging", "check isolation", "did this leak to
  prod", "test environment separation", "does dev point at dev", "prove the
  webhook hits dev". Provides seven isolation tests — single-marker DB routing
  (local/dev/prod), magic-link host check, full interview chain + webhook landing
  in dev, migration auto-apply, PR-preview isolation, auth-secret split, and
  Anthropic key attribution — each with what it proves and how to clean up.
---

# Staging verification — isolation runbook

Run after any change that could affect isolation (env vars, URLs, auth secrets,
migrations, deploy config). Each test states **what it proves** and **cleanup**.

## Conventions

- **Read prod (read-only):** `supabase db query --linked -f <file.sql>` (LINKED =
  prod `xhudgqbdsvvsjtfmjmor`).
- **Read/write dev branch:** pull a connection without printing secrets, use the
  session-mode pooler (port 5432, not 6543):
  ```bash
  eval "$(supabase branches get dev -o env)"
  export DEV_DB_URL="${POSTGRES_URL/:6543\//:5432/}"
  psql "$DEV_DB_URL" -c "select 1;"
  ```
- Pick a unique marker per run: `MARK="routing-$(date +%s)"`.

## 1. Single-marker database routing (local · dev preview · prod)

**Proves:** each environment writes to the right DB — local→dev branch, dev
preview→dev branch, prod→prod — and nothing leaks across.
1. Create a uniquely-named record in each environment through the app (e.g. a
   company `$MARK-local`, `$MARK-devpreview`, `$MARK-prod`).
2. `select name from public.companies where name like 'routing-%';` against the
   dev branch (`psql "$DEV_DB_URL"`) and prod (`supabase db query --linked`).
**Pass:** dev shows `-local` and `-devpreview`, not `-prod`; prod shows only
`-prod`. **Cleanup:** delete the markers via the app UI or `delete from
public.companies where name like 'routing-%';` on the matching DB.

## 2. Magic-link host check (`INTERVIEW_AGENT_URL` is dev→dev)

**Proves:** admin's minted links point at the same-environment interview agent.
Mint a link in the **dev** admin platform; inspect the host. **Pass:** host is the
dev interview-agent (or localhost locally), never `miine-interview-agent.vercel.app`
(prod). **Cleanup:** delete any created session row via the admin UI.

## 3. Full interview chain lands in dev (+ webhook targets dev)

**Proves:** an interview from a dev link writes `sessions`, attempts, and
`session_outputs` to **dev**, and the ElevenLabs post-call webhook calls back the
dev interview agent. Complete a short interview from the dev link, then check rows
exist in dev (`psql "$DEV_DB_URL"`) and not prod. A `session_outputs` row in dev
is end-to-end proof the webhook hit dev (confirm `NEXT_PUBLIC_APP_URL` and the
ElevenLabs agent's webhook URL are the dev host). **Pass:** new rows in dev only.
**Cleanup:** delete the test `session_outputs` then `sessions` rows from dev.

## 4. Migration auto-apply on dev

**Proves:** migrations auto-apply to the dev branch on push to `dev` — no manual
`db push`. Add a trivial migration (`create table if not exists
public.verify_autoapply (id int primary key);`), PR → merge into `dev` locally,
then `psql "$DEV_DB_URL" -c "select to_regclass('public.verify_autoapply');"`.
**Pass:** the table exists with no manual command. **Cleanup:** a follow-up
migration `drop table if exists public.verify_autoapply;` merged into `dev` (never
hand-drop on prod).

## 5. PR-preview isolation

**Proves:** a throwaway PR preview reads dev (Preview scope), never prod. Open a
trivial PR into `dev` for a preview deploy; on it, read something that reveals the
backing DB (e.g. a dev-only marker from test 1). **Pass:** preview shows dev data,
never prod-only data. **Cleanup:** close the PR (preview tears down automatically).

## 6. Auth-secret split (dev token rejected by prod)

**Proves:** `TOKEN_SECRET` differs across environments. Take a dev-minted magic
link and open it against the **prod** interview-agent host (swap host, keep token).
**Pass:** prod rejects the token (invalid link), because its `TOKEN_SECRET` differs
from dev's. **Cleanup:** none (a rejected verify writes nothing).

## 7. Anthropic key attribution

**Proves:** LLM calls bill to each environment's own `ANTHROPIC_API_KEY`. Trigger
one LLM action per environment (e.g. generate a briefing) on dev and prod, then
check the Anthropic console usage attributed to the dev vs prod key. **Pass:** dev
action under the dev key, prod under the prod key. If both land on one key, flag it
(keys not yet split). **Cleanup:** delete any throwaway records created.

## Quick pre-write sanity check (always)

```bash
supabase projects list        # LINKED project (prod = xhudgqbdsvvsjtfmjmor)
supabase branches get dev     # dev branch bfbphxbnboaibguawiov
git branch --show-current     # a feature branch (never main/dev directly)
```

## Related skills

`environments-and-env-vars`, `database-and-migrations`, `branch-and-pr-workflow`.
