---
name: database-and-migrations
description: >-
  Database and migration safety for this repo's Supabase setup
  (local→staging→prod). Use this WHENEVER you write or apply a migration, run any
  `supabase db` command, touch or query the database, or reseed — triggers on
  "migration", "supabase db push", "migration up", "schema change", "ALTER TABLE",
  "CREATE TABLE", "reseed", "db dump", "which database am I on", ".delete()",
  "storage .remove", "destructive-allowed", "soft delete", or "delete rows from
  app code". Enforces: migrations auto-apply to the dev branch on push to
  {{STAGING_BRANCH}}, the promotion runs them on prod, NEVER `supabase db push` or
  a blanket `supabase migration up` against production, reseed via
  {{SEED_SCRIPT_PATH}}, verify-which-database-before-writing, and the destructive
  doctrine: soft-delete only, migrations additive, any destructive app-code call
  needs a `// destructive-allowed: <reason>` annotation + human PR sign-off
  (CI-enforced). IDs: dev branch {{SUPABASE_DEV_BRANCH_REF}}, prod
  {{SUPABASE_PROD_REF}}.
---

# Database and migrations

## Project / branch IDs

- **Production Supabase project:** `{{SUPABASE_PROD_REF}}`.
- **Dev Supabase branch:** `{{SUPABASE_DEV_BRANCH_REF}}` (persistent branch; schema
  from `{{MIGRATIONS_DIR}}`, data seeded from prod).
{{#ARCHIVE_REF}}
- **Dormant archive — never write:** `{{SUPABASE_ARCHIVE_REF}}`.
{{/ARCHIVE_REF}}
- Local development points at the **dev** branch, never prod.

## The migration model

- **Single source of truth:** `{{MIGRATIONS_DIR}}`. Generated types live in
  `{{TYPES_PATH}}` (regenerate with `supabase gen types`, never hand-edit).
- **Auto-apply:** migrations apply to the **dev branch on push to
  `{{STAGING_BRANCH}}`**. The **promotion PR runs them on production.**
- **Never** run `supabase db push` or a blanket `supabase migration up` against
  **production.** (A surgical single-file apply via
  `supabase db query --linked -f <file>` + `supabase migration repair` is a
  deliberate, human-authorized exception, not the normal path.)

## Destructive-migration protocol (STOP before you delete data)

Migrations auto-apply to staging and reach prod on the promotion — so a
data-destructive migration can silently reach production. **Before writing,
applying, or promoting ANY migration, scan it** for:

`DROP TABLE` · `ALTER TABLE … DROP COLUMN` · `DROP SCHEMA` · `DELETE FROM` ·
`TRUNCATE`

**Not destructive** (do not treat as triggers): `DROP INDEX`, `DROP POLICY`,
`DROP TRIGGER`, and `DROP … IF EXISTS` used inside a recreate pattern (e.g.
`drop policy if exists …; create policy …`, or widening a `CHECK` constraint).

**If any destructive operation is present — STOP and:**

1. **Name exactly what it removes** — which objects, which data, on which tables.
2. **Require explicit human confirmation.** Never write it in as a side effect of
   another change.
3. **Staging first.** Confirm it applied and was reviewed on the dev branch first.
   **Never** apply a destructive migration directly to prod outside the deliberate
   promotion.
4. **Document it in-file** with a header comment naming what is removed and why.
5. **CI gate.** The `destructive-migration-check` workflow fails on any PR whose
   migration SQL contains the patterns above, naming the file and the offending
   statements. It passes only if the PR carries the
   **`destructive-migration-reviewed`** label. **You (the agent) must NOT add that
   label** — it is a human sign-off, not an agent action.

### Approving a legitimately-destructive migration (human)

1. Review the migration; confirm it removes only what's intended.
2. Confirm it **ran and was checked on staging first**.
3. Add the **`destructive-migration-reviewed`** label in the GitHub UI.
4. Re-run the check (Checks tab → re-run) — it now passes.

> **Teeth:** the check is an **advisory red signal** until branch protection on
> `{{PROD_BRANCH}}` and `{{STAGING_BRANCH}}` is configured to **require** it.
> Enabling that branch protection is what gives this gate real enforcement.

## App-code destructive-call guard

The migration guard covers SQL files only. **App code is fenced too:**

- **Soft-delete only.** Prefer archive/supersede/retire patterns: history triggers
  (`*_history` tables), status stamps, validity-window retirement. A retire path
  that stamps `valid_to` and then deletes, with a history trigger persisting both
  states, is non-lossy by design.
- **Migrations are additive.** A migration that drops or deletes goes through the
  protocol above.
- **Destructive database calls in app code require an annotation + human
  sign-off.** A supabase table `.delete()`, a storage `.remove()`, or raw
  `DELETE`/`TRUNCATE`/`DROP` SQL in a code string is permitted **only** when the
  line — or the immediately preceding line — carries:

  ```ts
  // destructive-allowed: <reason>
  ```

  with a real reason (what archives it, what regenerates it, what supersedes it).
  **Every `destructive-allowed:` line added in a PR needs explicit reviewer
  sign-off.** The agent must NEVER add one just to silence the guard — propose it,
  explain the safety argument, and let the human accept it in review.

- **CI enforcement:** the `app-code-scan` job runs
  `.github/scripts/scan-destructive-app-code.mjs` — a full-tree scan that fails
  naming each unannotated match's file, line, and snippet. Run it locally before
  pushing: `node .github/scripts/scan-destructive-app-code.mjs`.

## Verify which database before writing — always

```bash
supabase projects list        # which project is LINKED (prod = {{SUPABASE_PROD_REF}})
supabase branches get {{SUPABASE_DEV_BRANCH_NAME}}   # dev branch details/health
git branch --show-current     # a feature branch (never a long-lived branch)
```

Reads against prod: `supabase db query --linked -f <file.sql>` (read-only).
For the dev branch DB, pull a connection without printing secrets:

```bash
eval "$(supabase branches get {{SUPABASE_DEV_BRANCH_NAME}} -o env)"
export DEV_DB_URL="${POSTGRES_URL/:6543\//:5432/}"   # session-mode pooler (SET persists)
# macOS: client must be >= server (PG 17):
#   export PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH
psql "$DEV_DB_URL" -c "select 1;"
```

(The dev direct host `db.<ref>.supabase.co` is IPv6-only; use the session-mode
pooler on port 5432, not the transaction-mode pooler on 6543, so session `SET`s
like `session_replication_role` persist.)

## Reseed staging from prod

`{{SEED_SCRIPT_PATH}}` — re-runnable, data-only copy of prod into the dev branch.
Prod is **read-only** (only `pg_dump` reads it); FK-safe via
`session_replication_role = replica`; credentials read from env, never embedded.
Re-running into a populated branch fails on PK conflicts by design — reset or
truncate first.

## Related skills

- `branch-and-pr-workflow` — the promotion is what runs migrations on prod.
- `staging-verification` — the migration-auto-apply isolation test.
- `environments-and-env-vars` — Supabase URL/key per env.
