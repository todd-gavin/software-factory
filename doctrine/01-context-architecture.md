# Context architecture

Four surfaces, four distinct jobs. The discipline is knowing which one a given
piece of information belongs in, and never letting two of them try to be the
same thing.

| Surface | Job | Shape | Lifecycle |
|---|---|---|---|
| `CLAUDE.md` | Current truth | Curated conclusions | **Superseded** in place |
| `docs/decisions/<month>.md` | What happened and why | Dated entries, one per PR | **Append-only**, never pruned |
| `docs/HANDOFF.md` | What the next session needs *right now* | Short, newest on top | **Pruned** as content is absorbed |
| `docs/reports/<date>-*.md` | A portable briefing you can paste elsewhere | Dated snapshot | **Disposable**, regenerated |

## CLAUDE.md — the curated present

Loaded automatically into every session, so every line costs context on every
turn. That constraint is the point: it forces curation.

It holds the rules that always apply, a "current state and standing decisions"
section, and an index of where everything else lives. It states conclusions:
"observability failures block; the event emitter throws on a configured write
failure." It does not state history: "on the 3rd we tried swallowing errors, then
on the 9th we changed our minds."

**When a change alters a standing truth, supersede the sentence.** Do not append
a newer sentence beside the stale one. A state section that grows by accretion
becomes a pile of overlapping half-truths, which is worse than no state section,
because the agent believes it.

If the section drifts long, compress it. Length is a bug here, not thoroughness.

## docs/decisions/ — the chronology

One entry per substantive PR, appended to the current month's file, newest at
the bottom. Format:

```markdown
### YYYY-MM-DD — <short title>
**Decision:** what was decided
**Alternatives considered:** what was rejected and why
**Reasoning:** why this choice
**Context:** branch, base, PR link, held or follow-up items
```

"Substantive" means schema changes, architecture choices, new dependencies,
security-relevant changes, or anything that resolves a real fork in the road.
Trivial bug fixes do not need an entry.

**Alternatives considered is the highest-value field and the one most often
skipped.** Six months later the question is almost never "what did we do" — the
code answers that. It is "did we already rule this out, and why." An entry
without rejected alternatives cannot answer that.

Set `merge=union` on this directory in `.gitattributes` so concurrent appends
from parallel branches auto-resolve. **The union driver only runs on local
merges** — integrating through a web UI bypasses it and hands you conflicts.
Deliberately do *not* union-merge the curated current-truth file; its synthesis
deserves manual conflict resolution.

## docs/HANDOFF.md — the rolling note

The short "what just landed, what the next session needs to know" note. Newest on
top. Entries are **disposable orientation**, pruned once the durable content has
been absorbed into the curated file or the log.

It exists because there is a real category of knowledge that is neither a durable
truth nor a decision: "after merging #165, re-run the reconcile script against
staging," or "watch the two stuck records sweep on the first page load," or "the
next mount point is the reserved slot on the compose step." Load-bearing for
exactly one or two sessions, then worthless.

**It is not a second decision log.** If you find yourself writing full rationale
here, it belongs in `docs/decisions/`.

## docs/reports/ — the portable briefing

A dated, self-contained snapshot **composed from** the three surfaces above, so it
can be pasted into a fresh conversation, handed to a teammate, or read by someone
with zero repository access.

The hard rule: a report **assembles, it never re-derives.** The moment a report
re-scans the codebase to describe the project from scratch, you have introduced a
second, unversioned source of truth that will drift from the first. Reports
compose; they do not investigate.

Reports are durable artifacts: they land through a PR like anything else, never
committed directly to a long-lived branch and never left loose in the working
tree.

## Delta loading — the read protocol

The counterpart to all this writing discipline. When resuming:

1. Identify the reader (`git config user.email`).
2. Find their last commit on the staging branch. That timestamp is the **anchor**.
3. Load only what is newer than the anchor: merged PRs, commits, new migrations,
   decision entries dated after it.
4. Load `CLAUDE.md` in full, because it is always current by construction.
5. Load nothing else.

If there is no such commit, or the machine has multiple identities, **ask** for
the date rather than guessing.

This is why the writing discipline matters. Delta loading only works if the delta
is honestly recorded and the current-truth file is genuinely current. The read
protocol and the write protocol are one system.

---

*Related: [`02-branches-and-flow.md`](02-branches-and-flow.md) for how entries
attach to PRs.*
