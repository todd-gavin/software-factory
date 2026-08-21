---
name: database-and-migrations
description: >-
  Database and migration safety for this repo's Supabase setup (local→dev→prod).
  Use this WHENEVER you write or apply a migration, run any `supabase db` command,
  touch or query the database, or reseed — triggers on "migration", "supabase db
  push", "migration up", "schema change", "ALTER TABLE", "CREATE TABLE", "reseed",
  "db dump", "which database am I on", ".delete()", "storage .remove",
  "destructive-allowed", "soft delete", or "delete rows from app code". Enforces:
  migrations auto-apply to the dev branch on push to dev, dev→main promotion runs
  them on prod, NEVER `supabase db push` or a blanket `supabase migration up`
  against production, reseed dev via scripts/seed-dev-from-prod.sh,
  verify-which-database-before-writing, and the destructive doctrine: soft-delete
  only, migrations additive, any destructive app-code call needs a
  `// destructive-allowed: <reason>` annotation + human PR sign-off (CI-enforced).
  IDs: dev branch bfbphxbnboaibguawiov, prod xhudgqbdsvvsjtfmjmor,
  archive jfmkvvbaazqgfqdgjprm (do NOT use).
---

# Database and migrations

## Project / branch IDs

- **Production Supabase project:** `xhudgqbdsvvsjtfmjmor`.
- **Dev Supabase branch:** `bfbphxbnboaibguawiov` (persistent branch; schema from
  `supabase/migrations/`, data seeded once from prod).
- **Dormant archive — never write:** `jfmkvvbaazqgfqdgjprm`.
- Local development points at the **dev** branch, never prod.

## The migration model

- **Single source of truth:** `supabase/migrations/`. Generated types live in
  `packages/db/src/database.types.ts` (regenerate with `supabase gen types`,
  never hand-edit).
- **Auto-apply:** migrations apply to the **dev branch on push to `dev`**. The
  **`dev → main` promotion runs them on production.**
- **Never** run `supabase db push` or a blanket `supabase migration up` against
  **production.** (A surgical single-file apply via
  `supabase db query --linked -f <file>` + `supabase migration repair` has been
  used for held migrations — a deliberate, human-authorized exception, not the
  normal path.)

## Destructive-migration protocol (STOP before you delete data)

Migrations auto-apply to dev on push to `dev` and reach prod on the `dev`→`main`
promotion — so a data-destructive migration can silently reach production.
**Before writing, applying, or promoting ANY migration, scan it** for
data-destructive operations:

- `DROP TABLE`
- `DROP COLUMN` (i.e. `ALTER TABLE … DROP COLUMN`)
- `DROP SCHEMA`
- `DELETE FROM`
- `TRUNCATE`

**Not destructive** (do not treat these as triggers): `DROP INDEX`, `DROP POLICY`,
`DROP TRIGGER`, and `DROP … IF EXISTS` used inside a recreate pattern (e.g.
`drop policy if exists … ; create policy …`, or widening a `CHECK` constraint).

**If any destructive operation is present — STOP and:**

1. **Name exactly what it removes** — which objects, which data, on which tables
   (e.g. "drops `public.foo` and all its rows", "deletes the 7 round-2 fixture
   rows tied to `sess-grab-r2`").
2. **Require explicit human confirmation** before proceeding. Do not write it in
   as a side effect of another change.
3. **Dev first.** Confirm it has been applied and reviewed on the **dev branch**
   first. **Never** apply a destructive migration directly to prod outside the
   deliberate `dev`→`main` promotion.
4. **Document it in-file** with a header comment naming what is removed and why,
   following the pattern of the fixture-delete migration
   `supabase/migrations/20260615000001_*.sql` (a `-- ⚠️ …` block explaining the
   exact rows/objects removed and the reasoning).
5. **CI gate.** The `destructive-migration-check` workflow
   (`.github/workflows/destructive-migration-check.yml`) fails on any PR whose
   migration SQL contains the patterns above, naming the file and the offending
   statements. It passes only if the PR carries the
   **`destructive-migration-reviewed`** label. **You (the agent) must NOT add that
   label** — it is a human sign-off, not an agent action.

### Approving a legitimately-destructive migration (human)

1. Review the migration; confirm it removes only what's intended.
2. Confirm it **ran and was checked on the dev branch first**.
3. Add the **`destructive-migration-reviewed`** label to the PR in the GitHub UI.
4. Re-run the `destructive-migration-check` (Checks tab → re-run) — it now passes.

> **Teeth:** the check is currently an **advisory red signal** — it fails visibly
> but does not yet block merge. It becomes **merge-blocking** only once branch
> protection on `main` and `dev` is configured to **require** the
> `destructive-migration-check`. Enabling that branch protection (a dashboard
> step) is what gives this gate real enforcement.

## App-code destructive-call guard (destructive doctrine)

The migration guard covers SQL files only. **App code is fenced too** — the
doctrine, established 2026-07-03:

- **Soft-delete only.** Prefer archive/supersede/retire patterns over hard
  deletes: history triggers (`*_history` tables), status stamps
  (`superseded`), `valid_to` retirement. The canonical retire path (stamp
  `valid_to` then DELETE, with the `archive_canonical_row` trigger persisting
  both states) is the house pattern — the DELETE is non-lossy by design.
- **Migrations are additive.** A migration that drops or deletes goes through
  the destructive-migration protocol above, never in as a side effect.
- **Destructive database calls in app code require an annotation + human
  sign-off.** A supabase table `.delete()`, a storage `.remove()`, or raw
  `DELETE`/`TRUNCATE`/`DROP` SQL in a code string is permitted **only** when
  the line — or the immediately preceding line — carries:

  ```ts
  // destructive-allowed: <reason>
  ```

  with a real reason (why this destruction is safe: what archives it, what
  regenerates it, or what supersedes it). The annotation is the human-review
  surface: **every `destructive-allowed:` line added in a PR needs explicit
  reviewer sign-off in PR review.** You (the agent) must NEVER add one just to
  silence the guard — propose it, explain the safety argument, and let the
  human accept it in review.

- **CI enforcement:** the `app-code-scan` job in
  `.github/workflows/destructive-migration-check.yml` runs
  `.github/scripts/scan-destructive-app-code.mjs` — a full-tree scan of
  `apps/` + `packages/` that fails naming each unannotated match's file, line,
  and snippet. Run it locally before pushing:
  `node .github/scripts/scan-destructive-app-code.mjs`. Same advisory-until-
  branch-protection caveat as the migration guard.

## Verify which database before writing — always

```bash
supabase projects list        # which project is LINKED (prod = xhudgqbdsvvsjtfmjmor)
supabase branches get dev     # dev branch bfbphxbnboaibguawiov details/health
git branch --show-current     # a feature branch (never main/dev directly)
```

Reads against prod: `supabase db query --linked -f <file.sql>` (read-only).
For the dev branch DB, pull a connection without printing secrets:

```bash
eval "$(supabase branches get dev -o env)"
export DEV_DB_URL="${POSTGRES_URL/:6543\//:5432/}"   # session-mode pooler (SET persists)
# macOS: client must be >= server (PG 17): export PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH
psql "$DEV_DB_URL" -c "select 1;"
```

(The dev direct host `db.<ref>.supabase.co` is IPv6-only; use the session-mode
pooler on port 5432, not the transaction-mode pooler on 6543, so session `SET`s
like `session_replication_role` persist.)

## Reseed dev from prod

`scripts/seed-dev-from-prod.sh` — re-runnable, data-only copy of prod into the dev
branch. Prod is **read-only** (only `pg_dump` reads it); FK-safe via
`session_replication_role = replica`; credentials read from env, never embedded.
See the script header for usage. Re-running into a populated branch fails on PK
conflicts by design — reset/truncate first to reseed.

## Related skills

- `branch-and-pr-workflow` — the dev→main promotion is what runs migrations on prod.
- `staging-verification` — the migration-auto-apply isolation test.
- `environments-and-env-vars` — `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` per env.
