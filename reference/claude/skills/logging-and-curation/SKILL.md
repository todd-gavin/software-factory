---
name: logging-and-curation
description: >-
  How to record a decision and keep CLAUDE.md curated for the miine-platform repo.
  Use this WHENEVER you finish a PR, write a decision-log entry, or update CLAUDE.md
  — triggers on "decision log", "log this decision", "record this", "update
  CLAUDE.md", "finishing a PR", "what goes in CLAUDE.md vs the log", "changelog
  entry". The rule: append a raw dated entry to the current month's
  docs/decisions/ file, THEN judge durability and distill any standing-truth change
  UP into CLAUDE.md's "Current state and standing decisions" (superseding, not
  appending). CLAUDE.md holds conclusions/current truths; docs/decisions/ holds the
  chronological what-happened-and-why.
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
`docs/decisions/` (e.g. `docs/decisions/2026-06.md`), newest at the bottom, in the
established format:

```markdown
### YYYY-MM-DD — <short title>
**Decision:** what was decided
**Alternatives considered:** what was rejected and why
**Reasoning:** why this choice
**Context:** branch, base, PR link, and any held/follow-up items
```

If a new month started, create `docs/decisions/<YYYY-MM>.md` (same header style as
the existing month files) and add a row to `docs/decisions/README.md`. Do the
`dev`-integration merge **locally** so the `merge=union` driver resolves concurrent
appends (the GitHub web UI bypasses it).

## Step 2 — judge durability, then distill UP (sometimes)

Ask: **does this change alter a standing truth about the project?** (a current
capability, the environment/deploy model, the schema/security posture, the context
architecture, an app's identity, etc.)

- **Yes →** update the matching line in CLAUDE.md's "Current state and standing
  decisions", **superseding** the stale statement (don't pile a new one next to the
  old one). State the new truth as a conclusion, not a history.
- **No →** it lives only in the log. Most bug fixes, refactors, and one-off
  operational steps are log-only.

## Rule of thumb

- **CLAUDE.md = conclusions + current truths.** Lean and high-signal. If the state
  section drifts toward a pile of overlapping statements, **compress it**.
- **`docs/decisions/` = chronology.** Full detail, append-only, never pruned.
- One entry per PR; one source of current-state truth (CLAUDE.md). If
  `devops-overview` and CLAUDE.md ever disagree on current state, CLAUDE.md wins —
  `devops-overview` describes the *process*, CLAUDE.md the *live state*.

## Related skills

`branch-and-pr-workflow` (one entry per PR; local integration merges),
`resume-cold-handoff` (reads what this skill writes).
