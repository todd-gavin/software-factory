---
description: Recontextualize this session at the start of work — delta-load what changed since you last worked, write a fresh dated report, and surface what's queued. Composes the resume-cold-handoff skill + the /report command. (To export a standalone briefing on demand, use /report.)
allowed-tools: Bash(git:*), Bash(gh:*), Bash(ls:*), Bash(date:*), Bash(supabase:*), Read, Write, Skill
---

# /start: recontextualize this session

Your job: get fully up to speed on this repo and the latest direction, write a
fresh project report for the record, then stop and wait for the next instruction.

This command does two things by reusing existing tooling rather than reinventing:
1. **Loads context INTO this session** via delta-loading (the `resume-cold-handoff` skill).
2. **Writes a fresh dated snapshot** to `docs/reports/` by following the `/report`
   command — every session is anchored by a briefing, by design.

`/report` remains the way to export a standalone briefing on demand; `/start` is
the everyday session-start entry point that also leaves that artifact behind.

## Live working-tree state (captured BEFORE any writes)

- Current branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Last 12 commits: !`git log --oneline -12`
- Last commit date (quick hint): !`git log -1 --format=%cd --date=short`
- Open PRs: !`gh pr list --state open`
- Migration files (newest first): !`ls -t supabase/migrations/*.sql 2>/dev/null | head -6`
- Most recent decision logs: !`ls -t docs/decisions/*.md 2>/dev/null | head -3`

The **Uncommitted changes** above is the honest PRE-report snapshot. Use it for
Flags below. The report this command writes lands on its OWN `report/<slug>` branch
+ PR and is checked back out of the working tree when you return to your starting
branch (step 3), so it should not dirty the tree — judge cleanliness from this
snapshot, and treat the report PR as expected, not a surprise.

## Latest direction

@CLAUDE.md

## Steps

1. **Delta-load.** Invoke the **resume-cold-handoff** skill. Let the skill compute
   the precise per-author anchor (the last-commit date above is just a quick hint),
   then load only what changed since, plus the current CLAUDE.md. Do **not**
   re-scan the whole codebase, and do **not** cut a feature *work* branch — that is
   for when work actually starts, and `/start` stops to wait. (Step 3's transient
   `report/<slug>` branch is the lone exception: you cut it, PR it, and return.)

2. **Catch the latest decisions.** Read the two most recent decision-log files
   listed above (Read tool) for decisions that may not have distilled up into
   CLAUDE.md yet.

3. **Write a fresh report.** Read `.claude/commands/report.md` and follow it to
   generate a brand-new dated report. Because its `!` embeds do not auto-run when
   you Read the file, run its live-status commands yourself (`date`, the
   target-path one-liner, `supabase migration list --linked`), assemble ONLY from
   the curated sources it names (compose, do **not** re-derive or re-scan), scrub
   for secrets, and Write to the computed
   `docs/reports/YYYY-MM-DD-project-report[-N].md` path. A fresh report is written
   every session by design — never overwrite an existing one; the suffix scheme
   (`-2`, `-3`, …) handles same-day runs. Then follow report.md's **"Commit the
   report as a PR into `dev`"** step: put it on a `report/<slug>` branch, open a PR
   into `dev`, and `git checkout -` back to where you started. Do not merge it;
   surface the PR URL below.

4. **Cross-check.** Compare the working tree against the narrative: is the current
   branch what you'd expect, are there pre-existing uncommitted changes or open PRs
   that need attention before new work starts. Treat the report you just wrote as
   expected, not a surprise.

## Output (chat only)

After the skill's "since you last worked (<anchor date>)" summary, add:

1. **What's queued:** open PRs to merge, migrations to apply, and deferred items —
   pulled from CLAUDE.md, the recent decision logs, and the open-PR list above. In
   the order they need to happen.
2. **Flags:** any working-tree surprises (unexpected branch, pre-existing
   uncommitted changes from the snapshot above, stale PRs) worth resolving before
   new work. Do **not** flag the report you just wrote.
3. **Report:** one line with the report PR URL (and the file path).
4. **Ready:** one line confirming you're up to speed, then ask what to tackle.

Keep it scannable. No em dashes. Do not start coding until told what to work on.
