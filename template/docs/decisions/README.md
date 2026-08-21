# Decision log — index

The chronological, per-PR record of substantive decisions, split into per-month
files (newest entries at the bottom of each file). This is the full
*what-happened-and-why*; the **durable conclusions** are distilled up into
`CLAUDE.md` → "Current state and standing decisions". Pick the month slice you
need rather than loading everything — and when resuming, load only what is newer
than your last commit (see the `resume-cold-handoff` skill).

`.gitattributes` sets `merge=union` on `docs/decisions/*.md`, so concurrent per-PR
appends auto-resolve **on local merges** (the GitHub web UI bypasses the driver).
Append + distill per the `logging-and-curation` skill.

## What belongs here

Schema changes, architecture choices, new dependencies, security-relevant changes,
and anything that resolves a real fork in the road. Trivial bug fixes do not need
an entry.

A stack of related PRs produces **one** entry, riding the topmost PR.

## Months

| File | Span | Summary |
|---|---|---|
| [`{{FIRST_MONTH}}.md`]({{FIRST_MONTH}}.md) | {{FIRST_MONTH}} | *(one-line summary of the month's arc — written at month end)* |
