# MANIFEST — every file, where it goes, whether it is required

Destinations are relative to the **target repository root**. "Templated" means the
file contains `{{TOKEN}}` placeholders you must fill (see
[`PLACEHOLDERS.md`](PLACEHOLDERS.md)).

## template/ → the target repo

| Source | Destination | Templated | Required | Purpose |
|---|---|---|---|---|
| `CLAUDE.md.template` | `CLAUDE.md` | **Yes** | **Required** | The curated current-truth file, auto-loaded every session |
| `claude/commands/start.md` | `.claude/commands/start.md` | Yes | Recommended | Session entry point: delta-load + write a report |
| `claude/commands/report.md` | `.claude/commands/report.md` | Yes | Recommended | Compose a portable dated briefing |
| `claude/commands/dash.md` | `.claude/commands/dash.md` | No | Optional | Read-only inventory of commands + skills |
| `claude/skills/branch-and-pr-workflow/SKILL.md` | `.claude/skills/…` | Yes | **Required** | Branch model, PR flow, stacking, promotion |
| `claude/skills/logging-and-curation/SKILL.md` | `.claude/skills/…` | Yes | **Required** | Append-then-distill; what goes where |
| `claude/skills/resume-cold-handoff/SKILL.md` | `.claude/skills/…` | Yes | **Required** | Delta loading from the anchor commit |
| `claude/skills/database-and-migrations/SKILL.md` | `.claude/skills/…` | Yes | **Required** | Migration safety + the destructive protocol |
| `claude/skills/environments-and-env-vars/SKILL.md` | `.claude/skills/…` | Yes | Recommended | The variable→scope reference |
| `claude/skills/staging-verification/SKILL.md` | `.claude/skills/…` | Yes | Recommended | The isolation runbook |
| `claude/skills/devops-overview/SKILL.md` | `.claude/skills/…` | Yes | Optional | The map of the other six |
| `claude/skills/README.md` | `.claude/skills/README.md` | No | Optional | Human-facing skill index |
| `docs/decisions/README.md` | `docs/decisions/README.md` | Yes | **Required** | Month index for the log |
| `docs/decisions/_month-template.md` | `docs/decisions/<YYYY-MM>.md` | Yes | **Required** | The current month's log file |
| `docs/HANDOFF.md.template` | `docs/HANDOFF.md` | No | Recommended | The rolling in-flight note |
| `docs/reports/.gitkeep` | `docs/reports/.gitkeep` | No | Recommended | Report destination |
| `gitattributes.template` | **append to** `.gitattributes` | No | **Required** | `merge=union` on the decision log |
| `github/workflows/destructive-migration-check.yml` | `.github/workflows/…` | Path filter | Recommended | Both CI guards |
| `github/scripts/scan-destructive-sql.sh` | `.github/scripts/…` | No | Recommended | Migration SQL scanner (`chmod +x`) |
| `github/scripts/scan-destructive-app-code.mjs` | `.github/scripts/…` | Source roots | Recommended | App-code destructive-call scanner |
| `scripts/seed-dev-from-prod.sh.template` | `scripts/seed-dev-from-prod.sh` | Yes | Optional | Reseed staging from prod (`chmod +x`) |

**Required** means the doctrine stops working without it. The four required skills
plus CLAUDE.md plus the decision log are the irreducible core; everything else
sharpens it.

## Not copied — read in place

| Path | Purpose |
|---|---|
| `doctrine/*.md` | The reasoning behind every rule. Read when adapting, or when someone asks "why is this the rule?" |
| `reference/**` | This repo's live files, verbatim, as a worked example of each filled-in template |
| `INSTALL.md` | The bootstrap runbook |
| `PLACEHOLDERS.md` | The token dictionary |
| `check-drift.sh` | Reports where `reference/` has fallen behind the live files |

You can copy `software-factory/` itself into the target repo (useful — the
doctrine stays available to whoever works there), or leave it behind once
installed. The harness does not depend on it at runtime.

## Files with paths you must adjust

Three files hardcode a monorepo shape:

| File | What to adjust |
|---|---|
| `github/workflows/destructive-migration-check.yml` | The `paths:` filter lists `apps/**` and `packages/**` |
| `github/scripts/scan-destructive-app-code.mjs` | Its scan roots are `apps/` and `packages/` |
| `CLAUDE.md.template` §1 | Two layout variants — keep one, delete the other |

A scanner pointed at a directory that does not exist passes vacuously. That is
worse than not installing it, because the green check implies coverage you do not
have.

## What is deliberately NOT in this kit

- **Application code, schema, migrations.** Nothing about the product.
- **`.claude/settings.local.json`.** Permission allowlists are per-machine and
  per-person; copying one around grants tool permissions someone else chose.
- **A CI job for `check-drift.sh`.** Adding a required check to the source repo
  would change how it operates, which this extraction was explicitly not meant to
  do. Run it by hand.
- **Anything that merges, force-pushes, or deletes.** By doctrine, those stay
  human actions.
