---
name: logging-and-curation
description: >-
  How to record a decision and keep CLAUDE.md curated for {{PROJECT_NAME}}. Use
  this WHENEVER you finish a PR, write a decision-log entry, or update CLAUDE.md
  — triggers on "decision log", "log this decision", "record this", "update
  CLAUDE.md", "finishing a PR", "what goes in CLAUDE.md vs the log", "changelog
  entry". The rule: append a raw dated entry to the current month's
  docs/decisions/ file, THEN judge durability and distill any standing-truth
  change UP into CLAUDE.md's "Current state and standing decisions" (superseding,
  not appending). CLAUDE.md holds conclusions/current truths; docs/decisions/
  holds the chronological what-happened-and-why.
---

# Logging and curation

Two homes, two jobs:

- **`docs/decisions/<month>.md`** — the chronological, append-only per-PR record
  (the *what-happened-and-why*). `merge=union`.
- **`CLAUDE.md` → "Current state and standing decisions"** — the curated, current
  *conclusions*. Normally merged (no union), so synthesis gets deliberate human
  conflict resolution.

## Step 1 — append the raw entry (always)

After each substantive PR, append a dated entry to the **current month's** file in
`docs/decisions/`, newest at the bottom:

```markdown
### YYYY-MM-DD — <short title>
**Decision:** what was decided
**Alternatives considered:** what was rejected and why
**Reasoning:** why this choice
**Context:** branch, base, PR link, and any held/follow-up items
```

**Alternatives considered is the field that earns its keep.** The code records
what you did; only this records what you ruled out.

If a new month started, create `docs/decisions/<YYYY-MM>.md` and add a row to
`docs/decisions/README.md`. Do integration merges **locally** so `merge=union`
resolves concurrent appends.

**For a stack:** one entry, riding the top PR (see `branch-and-pr-workflow`).

## Step 2 — judge durability, then distill UP (sometimes)

Ask: **does this change alter a standing truth about the project?** (a current
capability, the environment/deploy model, the schema/security posture, the context
architecture, a subsystem's identity.)

- **Yes →** update the matching line in CLAUDE.md, **superseding** the stale
  statement. Don't pile a new statement next to the old one. State the new truth
  as a conclusion, not a history.
- **No →** it lives only in the log. Most bug fixes, refactors, and one-off
  operational steps are log-only.

## Rule of thumb

- **CLAUDE.md = conclusions + current truths.** Lean and high-signal. If the state
  section drifts toward a pile of overlapping statements, **compress it.**
- **`docs/decisions/` = chronology.** Full detail, append-only, never pruned.
- One source of current-state truth. If a skill and CLAUDE.md ever disagree about
  current state, **CLAUDE.md wins** — skills describe *process*, CLAUDE.md the
  *live state*.

## The third surface: docs/HANDOFF.md

Short, rolling, newest on top, **pruned** once absorbed. It carries what the next
session needs operationally ("re-run the reconcile script after #165 merges"), not
rationale. **Not a second decision log.**

## Related skills

`branch-and-pr-workflow` (one entry per PR; local integration merges),
`resume-cold-handoff` (reads what this skill writes).
