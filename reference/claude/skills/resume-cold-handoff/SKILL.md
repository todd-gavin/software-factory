---
name: resume-cold-handoff
description: >-
  Delta-loading cold start for an agent picking up the miine-platform repo with no
  briefing. Use this FIRST whenever you are resuming, starting fresh, or picking up
  where someone left off — triggers on "resume", "pick up", "cold start", "where
  did we leave off", "catch me up", "what's the state", "what changed since". Do NOT
  read the whole decision history: identify the reader, find their last commit on
  dev as an anchor date, then load ONLY what is newer (decision entries, merged PRs,
  migrations, commits since that date) plus the always-current CLAUDE.md, and
  present a "since you last worked (date): here is what changed" synthesis.
---

# Resume cold — delta loading

The repo carries its own state. Load the **delta since you last worked**, not the
whole history.

## 1. Identify the reader

```bash
git config user.name
git config user.email
```

## 2. Find the anchor date (their last commit on `dev`)

```bash
git fetch origin --quiet
ANCHOR=$(git log origin/dev --author="$(git config user.email)" -1 --format=%cI)
# fallback to name if email doesn't match the commit identities:
[ -z "$ANCHOR" ] && ANCHOR=$(git log origin/dev --author="$(git config user.name)" -1 --format=%cI)
echo "anchor: ${ANCHOR:-NONE}"
```

If there is **no** such commit, or the result is ambiguous (shared machine,
multiple identities), **ask the user when they last worked** and use that date as
the anchor. Don't guess.

## 3. Load ONLY what is newer than the anchor

```bash
# PRs merged since the anchor
gh pr list --state merged --limit 50 \
  --json number,title,mergedAt,baseRefName \
  --jq "[.[] | select(.mergedAt > \"$ANCHOR\")]"

# commits on dev since the anchor
git log origin/dev --since="$ANCHOR" --oneline

# migrations added since the anchor (by commit date)
git log origin/dev --since="$ANCHOR" --name-only --diff-filter=A -- 'supabase/migrations/*' | grep migrations/ | sort -u

# migration apply-state on prod (LINKED), to spot anything pending
supabase migration list --linked
```

Decision-log entries newer than the anchor: open the current month's file in
`docs/decisions/` and read only entries dated **after** the anchor (each header is
`### YYYY-MM-DD — …`). Cross a month boundary only if the anchor is in a prior
month.

```bash
ls docs/decisions/                       # which month files exist
grep -nE "^### [0-9]{4}-" docs/decisions/$(date +%Y-%m).md   # headers to scan from the anchor down
```

## 4. Always read CLAUDE.md; do NOT bulk-load old history

- **Always** read `CLAUDE.md` — it is lean and current ("Environments and workflow
  (read first)" + "Current state and standing decisions" + the index). It already
  reflects the durable conclusions, so you rarely need old log entries.
- **Do not** load the full `docs/decisions/` history. Open an **older** month only
  if a specific question requires recalling a particular past decision — and then
  read only that slice.

## 5. Synthesize and proceed

Present a **"Since you last worked (<anchor date>): here's what changed"** summary —
merged PRs, new/pending migrations, notable decisions, and any shift in the
standing-decisions section — then cut a feature branch off `dev` and continue.

```bash
git checkout -b feat/<your-change> origin/dev   # never work on dev/main directly
```

## Related skills

`branch-and-pr-workflow`, `database-and-migrations`, `environments-and-env-vars`,
`logging-and-curation` (how the log + CLAUDE.md you just read are maintained).
