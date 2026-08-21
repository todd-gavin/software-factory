---
name: resume-cold-handoff
description: >-
  Delta-loading cold start for an agent picking up {{PROJECT_NAME}} with no
  briefing. Use this FIRST whenever you are resuming, starting fresh, or picking
  up where someone left off — triggers on "resume", "pick up", "cold start",
  "where did we leave off", "catch me up", "what's the state", "what changed
  since". Do NOT read the whole decision history: identify the reader, find their
  last commit on {{STAGING_BRANCH}} as an anchor date, then load ONLY what is
  newer (decision entries, merged PRs, migrations, commits since that date) plus
  the always-current CLAUDE.md, and present a "since you last worked (date): here
  is what changed" synthesis.
---

# Resume cold — delta loading

The repo carries its own state. Load the **delta since you last worked**, not the
whole history.

## 1. Identify the reader

```bash
git config user.name
git config user.email
```

## 2. Find the anchor date (their last commit on `{{STAGING_BRANCH}}`)

```bash
git fetch origin --quiet
ANCHOR=$(git log origin/{{STAGING_BRANCH}} --author="$(git config user.email)" -1 --format=%cI)
# fallback to name if email doesn't match the commit identities:
[ -z "$ANCHOR" ] && ANCHOR=$(git log origin/{{STAGING_BRANCH}} --author="$(git config user.name)" -1 --format=%cI)
echo "anchor: ${ANCHOR:-NONE}"
```

If there is **no** such commit, or the result is ambiguous (shared machine,
multiple identities), **ask the user when they last worked** and use that date as
the anchor. Don't guess.

**If the anchor is the tip of the branch**, nothing changed since — say so plainly
rather than manufacturing a delta. Report the calendar gap and orient from
CLAUDE.md instead.

## 3. Load ONLY what is newer than the anchor

```bash
# PRs merged since the anchor
gh pr list --state merged --limit 50 \
  --json number,title,mergedAt,baseRefName \
  --jq "[.[] | select(.mergedAt > \"$ANCHOR\")]"

# commits since the anchor
git log origin/{{STAGING_BRANCH}} --since="$ANCHOR" --oneline

# migrations added since the anchor
git log origin/{{STAGING_BRANCH}} --since="$ANCHOR" --name-only --diff-filter=A \
  -- '{{MIGRATIONS_DIR}}/*' | grep migrations/ | sort -u

# migration apply-state on prod (LINKED), to spot anything pending
supabase migration list --linked

# has production diverged? (a promotion may have happened after your last commit)
git rev-list --left-right --count origin/{{PROD_BRANCH}}...origin/{{STAGING_BRANCH}}
```

Decision-log entries newer than the anchor: open the current month's file in
`docs/decisions/` and read only entries dated **after** the anchor. Cross a month
boundary only if the anchor is in a prior month.

```bash
ls docs/decisions/
grep -nE "^### [0-9]{4}-" docs/decisions/$(date +%Y-%m).md
```

Also read `docs/HANDOFF.md` — the rolling note carries the operational follow-ups
("re-run X after Y merges") that never reach CLAUDE.md.

## 4. Always read CLAUDE.md; do NOT bulk-load old history

- **Always** read `CLAUDE.md` — it is lean and current by construction. It already
  reflects the durable conclusions, so you rarely need old log entries.
- **Do not** load the full `docs/decisions/` history. Open an **older** month only
  if a specific question requires a particular past decision — and read only that
  slice.

## 5. Synthesize and proceed

Present a **"Since you last worked (<anchor date>): here's what changed"**
summary — merged PRs, new/pending migrations, notable decisions, any shift in the
standing-decisions section — then stop and confirm direction before cutting a
branch.

```bash
git checkout -b feat/<your-change> origin/{{STAGING_BRANCH}}   # never work on a long-lived branch
```

## Related skills

`branch-and-pr-workflow`, `database-and-migrations`, `environments-and-env-vars`,
`logging-and-curation` (how the log + CLAUDE.md you just read are maintained).
