# INSTALL — stand the software factory up in a new repo

**Entry point for an agent.** In the target repository, say:

> Read `software-factory/INSTALL.md` and install the harness here.

The agent follows this document top to bottom. A human can follow it too; the
steps are the same.

---

## 0. Preconditions — check before writing anything

```bash
git rev-parse --show-toplevel     # must be a git repo
gh --version && gh auth status    # GitHub CLI authenticated
supabase --version                # Supabase CLI present
supabase projects list            # the right project shows as LINKED
git branch -r                     # BOTH long-lived branches must exist
```

**Stop and ask if any of these fail.** In particular:

- **No staging branch?** The model rests on staging being a real branch with a
  real deploy. Create it (`git checkout -b dev main && git push -u origin dev`)
  and wire its preview deploy *before* installing, or install knowing that half
  the doctrine is currently aspirational — and say which.
- **Existing `CLAUDE.md`?** Do not overwrite it. Merge deliberately: the template
  contributes the workflow sections and the standing rules; anything project-
  specific already in the file is the more valuable half. Show the human a diff
  before writing.
- **Existing `.claude/skills/` or `.claude/commands/`?** Same rule: merge, never
  clobber. Report collisions by name.

## 1. Interview for the placeholder values

Read [`PLACEHOLDERS.md`](PLACEHOLDERS.md) for the full dictionary, then collect
values. Ask in **one batch**, not one question at a time. Pre-fill everything you
can detect from the repo and confirm rather than ask:

| Detectable from | Tokens |
|---|---|
| `git branch -r` | `{{PROD_BRANCH}}`, `{{STAGING_BRANCH}}` |
| `supabase projects list` / `branches list` | the Supabase refs |
| `package.json`, `pnpm-workspace.yaml` | `{{PROJECT_NAME}}`, `{{PACKAGE_SCOPE}}`, the app list, the commands |
| Repo tree | `{{MIGRATIONS_DIR}}`, `{{TYPES_PATH}}`, `{{ENV_EXAMPLE_PATH}}` |

Genuinely ask only for what the repo cannot tell you: the archive ref (if any),
`{{APPS_SUMMARY}}` prose, and confirmation of the four verification commands.

**Never guess a Supabase project ref.** A wrong ref in the database skill is how
an agent ends up confidently writing to the wrong database.

## 2. Copy files to their destinations

| From `software-factory/template/` | To repo root | Notes |
|---|---|---|
| `CLAUDE.md.template` | `CLAUDE.md` | Fill placeholders; pick ONE §1 layout variant; **empty the state section** |
| `claude/commands/*.md` | `.claude/commands/` | 3 files |
| `claude/skills/*/SKILL.md` | `.claude/skills/` | 7 skills + README |
| `docs/decisions/README.md` | `docs/decisions/` | |
| `docs/decisions/_month-template.md` | `docs/decisions/<YYYY-MM>.md` | Rename to the current month |
| `docs/HANDOFF.md.template` | `docs/HANDOFF.md` | |
| `docs/reports/.gitkeep` | `docs/reports/` | |
| `github/workflows/*.yml` | `.github/workflows/` | Verbatim |
| `github/scripts/*` | `.github/scripts/` | Verbatim; `chmod +x` the `.sh` |
| `scripts/seed-dev-from-prod.sh.template` | `scripts/seed-dev-from-prod.sh` | Fill refs; `chmod +x` |
| `gitattributes.template` | **append to** `.gitattributes` | Append, do not overwrite |

Then:

```bash
ln -s .claude/skills skills          # root browsing symlink (optional but nice)
```

**Adjust the CI scan paths** if this is not a monorepo: the workflow's `paths:`
filter and the app-code scanner's roots both assume `apps/` and `packages/`.
Point them at your actual source roots. A guard scanning a directory that does
not exist passes vacuously and teaches you nothing.

## 3. Fill every placeholder

```bash
grep -rn '{{' CLAUDE.md .claude/ docs/ scripts/ .github/
```

Must come back empty. A leftover token is read by the agent as literal text.

Three template-specific cleanups that grep will not catch:

- **Delete the unused §1 layout variant** in CLAUDE.md (monorepo or single-app).
- **Delete the HTML instruction comments** in CLAUDE.md.
- **Empty the state section** down to your real starting state. Do not ship the
  example paragraph as if it were true.

## 4. Seed the first decision entry

Write the first entry into `docs/decisions/<YYYY-MM>.md` recording the harness
adoption itself. This is not ceremony: it makes the log non-empty, proves the
format, and dates the adoption.

```markdown
### YYYY-MM-DD — Adopted the software-factory harness
**Decision:** Installed the repo harness: CLAUDE.md conventions, 7 auto-loading
skills, 3 slash commands, the decision-log + HANDOFF + reports structure, and the
destructive-operation CI guards.
**Alternatives considered:** Ad-hoc context per session (the status quo) —
rejected: it re-derives state every session and retains nothing.
**Reasoning:** Curated current truth + an append-only chronology + delta loading
removes the cold-start cost and stops conclusions from drifting.
**Verification:** static — the CI guards run clean; `grep -rn '{{'` is empty.
**Context:** software-factory kit, branch `feat/software-factory`.
```

## 5. Verify the install

```bash
# 1. No unfilled placeholders
grep -rn '{{' CLAUDE.md .claude/ docs/ scripts/ && echo "FAIL" || echo "OK"

# 2. Skills are discoverable (7 SKILL.md files)
find .claude/skills -name SKILL.md | wc -l

# 3. Every skill has frontmatter with a name and description
for f in .claude/skills/*/SKILL.md; do
  head -3 "$f" | grep -q '^name:' || echo "MISSING name: $f"
done

# 4. The destructive scanners run clean on the current tree
node .github/scripts/scan-destructive-app-code.mjs

# 5. The union-merge attribute is registered
git check-attr merge docs/decisions/README.md   # → merge: union
```

Then the live tests:

- **`/dash`** — should enumerate 3 commands and 7 skills.
- **`/start`** — should delta-load, write a report to `docs/reports/`, open a
  report PR, and return you to your branch clean.

If `/dash` lists nothing, skills are in the wrong location: they must be at
`.claude/skills/<name>/SKILL.md`, not `skills/<name>.md`.

## 6. Land it through the process it describes

```bash
git checkout -b feat/software-factory origin/{{STAGING_BRANCH}}
git add -A
git commit -m "chore: adopt the software-factory harness"
git push -u origin feat/software-factory
gh pr create --base {{STAGING_BRANCH}} --head feat/software-factory
```

Do not commit it directly to a long-lived branch. The harness's first act should
not be to violate its own first rule.

## 7. The one manual step CI cannot do for you

**Configure branch protection** on both long-lived branches to **require** the
`destructive-migration-check` status checks.

Until you do, both guards are advisory red signals — they fail visibly and merge
anyway. This is a dashboard action, it takes two minutes, and it is the difference
between documentation and enforcement.

Also create the **`destructive-migration-reviewed`** label, or the approval path
for a legitimately-destructive migration does not exist.

---

## Adapting to a non-Supabase or non-Vercel stack

The kit is written for Supabase plus a preview-deploy host. If yours differs, the
layers separate cleanly:

- **`doctrine/`** — fully portable. Nothing in it depends on the stack.
- **`branch-and-pr-workflow`, `logging-and-curation`, `resume-cold-handoff`,
  the 3 commands** — portable; only branch names change.
- **`database-and-migrations`, `environments-and-env-vars`,
  `staging-verification`** — the stack adapter. Rewrite the mechanics; **keep the
  invariants**: only production touches production, migrations reach prod only
  through the promotion, verify-which-database-before-writing, destructive
  operations are fenced.

Rewrite them concretely for your stack. A skill hedged into vagueness so it fits
everything helps nobody: the agent needs the actual command for the actual tool.
