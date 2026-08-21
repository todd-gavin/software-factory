---
description: Generate a dated, portable project briefing to paste into a fresh Claude chat (kills the cold-start problem). ASSEMBLES from CLAUDE.md + docs/decisions + live git/PR/migration status — it does NOT re-derive or re-scan the codebase.
allowed-tools: Bash, Read, Write
---

You are generating a **portable project briefing** — a disposable, point-in-time
serialization of the project's already-curated sources, written so a teammate (or
a fresh Claude chat) with ZERO prior context is brought up to speed by pasting it
in. This kills the cold-start problem for new chat threads.

## Hard rule: COMPOSE, do not re-derive
ASSEMBLE the report from the curated sources below. Do **NOT** re-investigate or
re-scan the codebase to describe the project from scratch — CLAUDE.md and the
decision log are the single sources of truth; this report is a disposable snapshot
of them. Lightly stitch into readable prose; never contradict or "improve on" the
sources. Re-deriving state would reintroduce drift/hallucination one level up.

## Live status (gathered fresh at invocation)
- Today: !`date +%Y-%m-%d`
- Generated timestamp (for the report header): !`date "+%Y-%m-%d %H:%M"`
- **Target file (write to EXACTLY this path):** !`d=$(date +%Y-%m-%d); base="docs/reports/$d-project-report"; if [ ! -e "$base.md" ]; then echo "$base.md"; else n=2; while [ -e "$base-$n.md" ]; do n=$((n+1)); done; echo "$base-$n.md"; fi`
- Reports already generated today: !`d=$(date +%Y-%m-%d); ls -1 docs/reports/$d-project-report*.md 2>/dev/null || echo "(none yet)"`
- Current branch: !`git branch --show-current 2>&1 || echo "(git unavailable)"`
- Branch divergence: !`git rev-list --left-right --count origin/{{PROD_BRANCH}}...origin/{{STAGING_BRANCH}} 2>&1 || echo "(unavailable)"`
- Open PRs: !`gh pr list --state open 2>&1 || echo "(gh unavailable — note this in the report)"`
- Migration state (linked = prod): !`supabase migration list --linked 2>&1 | tail -20 || echo "(supabase CLI unavailable — note this)"`

If any of the live commands failed above, INCLUDE the section anyway and note the
tool was unavailable and why — do not silently drop it.

## Sources to assemble from (read ONLY these — do not go beyond them)
1. **CLAUDE.md** — use: the intro preamble (= "what this project is"); the
   **"Current state and standing decisions"** section IN FULL (already concise —
   it is the curated heart); the **"Environments and workflow"** env table + infra
   refs; the **repo layout** block; and the **"Index / where to find things"**.
2. **docs/decisions/** — the CURRENT month file. Take the **last ~10–15 entries**
   as a tight summarized list (the `### YYYY-MM-DD — title` plus a one-line gist
   each) — enough to convey recent activity and what is in flight, NOT the full
   history. `docs/decisions/README.md` is the month index for older slices.
3. **docs/HANDOFF.md** — for carry-over follow-ups that belong in "what's next".

## Secret hygiene (this report LEAVES the repo)
Include ONLY refs and value-sources: project **ids**, hosting project **names**,
env-var **names**, URLs. **NEVER** a key value, token, password, or even a prefix.
If a source somehow contains a secret, scrub it. Re-scan your output for anything
key-shaped (`eyJ…`, `sk-…`, connection strings with passwords) before writing.

## Write to the **Target file** path from Live status above
The scheme: the first report of a day is
`docs/reports/YYYY-MM-DD-project-report.md`; each additional report **the same
day** gets the next integer suffix (`-2`, `-3`, …) so same-day reports are
ordered, not overwritten. The Target-file embed already resolved the next free
name; just use it. In the header include the generated timestamp and, if it isn't
the first of the day, note which number it is. Structure the report EXACTLY:

1. **Title + generated timestamp** + a one-line *"How to use this: paste into a
   fresh Claude chat to instantly contextualize it on the project."*
2. **What this project is** — the short stable preamble.
3. **Current state & where we are** — the curated state section, plus the current
   branch, branch divergence, and open-PR count. **If live status contradicts a
   curated claim** (e.g. CLAUDE.md says a migration is pending but the linked
   project shows it applied), say so explicitly as a freshness note — do not
   silently pick one.
4. **Recent activity & what's in flight** — the recent decision-log slice + open PRs.
5. **How it's structured** — repo layout; environment model + infra refs (project
   ids, hosting projects, migration state); skills index.
6. **What's next / open questions** — backlog and next steps from the open PRs,
   HANDOFF, and any "next step / follow-up / flagged" notes in recent entries.
7. **Sources & freshness** — list the files you assembled from; state they are the
   sources of truth and this is a point-in-time snapshot whose accuracy depends on
   them being current (regenerate with `/report`).

After writing, print the path and confirm (a) it contains no secrets and (b) it
was assembled from the curated sources, not re-derived.

## Commit the report as a PR into `{{STAGING_BRANCH}}` (ALWAYS)

A report is a durable artifact: it must land through a feature PR, and **never** be
committed directly to a long-lived branch or left as an uncommitted working-tree
file. After writing the file:

```bash
REPORT="docs/reports/<the-file-you-just-wrote>"
SLUG="$(basename "$REPORT" .md)"
git fetch origin --quiet
# Cut off the LATEST staging branch. The report is untracked, so it follows the
# checkout; any other working-tree changes stay on your current branch.
git checkout -b "report/$SLUG" origin/{{STAGING_BRANCH}}
git add "$REPORT"                                   # ONLY the report
git commit -m "docs(report): $SLUG"
git push -u origin "report/$SLUG"
gh pr create --base {{STAGING_BRANCH}} --head "report/$SLUG" \
  --title "docs(report): $SLUG" \
  --body "Dated project briefing generated by /report. Docs artifact only — no code/schema change; no decision-log entry needed."
git checkout -                                      # return to where you started
```

- **No decision-log entry** for this PR: a report records nothing architectural.
- **Do not merge** the PR — human review. Print the PR URL.
- **Safety:** if the checkout is refused because of conflicting tracked
  modifications, do NOT force it or stash blindly — stop and ask. The report
  itself is safe (already written, untracked).
