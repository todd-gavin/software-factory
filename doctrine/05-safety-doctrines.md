# Safety doctrines

Three standing doctrines, plus the security defaults. Each exists because the
failure it prevents is silent, and silent failures are the expensive kind.

## 1. Failures block during development

**Observability and pipeline failures THROW and surface. Nothing silently
continues with unintended behavior.**

The tempting pattern is the swallowed telemetry error: wrap the event write in a
try/catch, log nothing, keep going. It looks defensive. What it actually buys you
is a pipeline that has been broken for three weeks with a clean dashboard.

The doctrine inverts that. When the observability backend is configured and a
write fails, **throw**. Callers do not catch it; they die loudly. The operation
that could not be observed does not silently succeed.

Two deliberate carve-outs, both loud:

- **Unconfigured is not failed.** When the backend is entirely absent (local dev,
  a fresh clone), no-op — but warn loudly, once per process.
- **Genuine best-effort paths still log.** Some side outputs truly must not break
  the operation they observe. Those get an explicit best-effort helper that emits
  a loud `console.error` on failure. **A silent swallow is never acceptable**; the
  choice is between blocking-loud and non-blocking-loud.

There is one place that must guard its own telemetry: the error handler that
reports a failure. If *its* event write throws, it masks the original error. That
handler is the exception, and it should be commented as such.

## 2. Destructive operations are fenced

**Soft-delete only. Migrations are additive. Destructive calls need an annotation
plus human sign-off.**

### Data

Prefer archive, supersede, and retire over hard deletes: history tables via
triggers, status stamps, validity-window retirement. A retire path that stamps a
row invalid and then deletes it *while a history trigger persists both states* is
non-lossy by design and perfectly fine — the test is whether the information
survives, not whether the word DELETE appears.

### Migrations

Scan every migration before writing, applying, or promoting it. Destructive:

`DROP TABLE` · `DROP COLUMN` · `DROP SCHEMA` · `DELETE FROM` · `TRUNCATE`

Not destructive, do not treat as triggers: `DROP INDEX`, `DROP POLICY`,
`DROP TRIGGER`, and `DROP ... IF EXISTS` inside a recreate pattern.

If anything destructive is present, **stop** and:

1. **Name exactly what it removes** — which objects, which rows, which tables.
   Not "cleans up old data."
2. **Get explicit human confirmation.** Never as a side effect of another change.
3. **Staging first.** Applied and reviewed on staging before it can ride a
   promotion.
4. **Document in-file** with a header comment naming what is removed and why.
5. **CI gate.** The check fails on destructive SQL and passes only when a human
   adds the review label. **The agent must never add that label.** It is a human
   sign-off; an agent adding it defeats the entire mechanism.

### App code

The migration guard covers SQL files. App code is fenced too: a destructive
database or storage call is permitted **only** when its line, or the immediately
preceding line, carries:

```ts
// destructive-allowed: <reason>
```

with a real reason — what archives it, what regenerates it, what supersedes it.

**The annotation is the human-review surface.** Every one added in a PR needs
explicit reviewer sign-off, and must be called out in the PR body, never buried in
the diff. **Never add an annotation to silence the guard.** Propose it, make the
safety argument, let a human accept it.

CI runs a full-tree scan rather than a diff scan, so drift anywhere fails loudly.

### Teeth

Both guards are **advisory until branch protection requires the status check.**
A red X nobody is required to look at is a suggestion. Configuring branch
protection is what converts these from documentation into enforcement — do it,
and until you have, be honest that they are advisory.

## 3. Single source of truth per concern

Every concern gets exactly one authoritative home, and everything else reads from
it.

One config surface for LLM parameters. One topology module for pipeline nodes and
edges. One storage layer that talks to the database; apps do not hand-roll
queries. One current-truth file. One derivation for a lifecycle state, consumed by
every view.

The failure this prevents is the second opinion: two modules that each compute
"is this round complete" and disagree in an edge case nobody thought about. When
you find yourself writing a computation that already exists elsewhere, the fix is
to export the existing one, not to write a compatible copy.

## Security defaults — never skip

- **Row-level security on every table by default.** New tables get policies in the
  same commit as the table.
- **Service-role keys are server-side only.** Never browser-exposed, never
  committed.
- **All secrets in environment variables**, never inlined.
- **Validate auth server-side on every authenticated route.** Never trust client
  claims.
- **Least privilege on grants.** The anonymous role gets nothing by default.
- **Admin actions are audited** to an append-only log.
- **Secret hygiene on anything that leaves the repo.** Reports, briefings, and
  issue comments carry refs and variable *names* — never a key, token, password,
  or connection string with credentials. Re-scan output for anything key-shaped
  before writing it.

## Schema placement

New tables go in the right schema from the start; retrofitting is a migration
nobody wants to write.

| Table kind | Schema |
|---|---|
| Prompt templates, versioned content | `prompts` |
| Audit logs, admin action history | `audit` |
| Domain-specific subsystem tables | its own schema |
| Core operational data | `public` |
| System-managed | `auth`, `storage` — do not touch |

When in doubt, ask before creating the table.
