# The software factory, in one page

A **software factory** is the repo-resident harness that makes an AI coding agent
productive and disciplined on day one of every session. It is not a methodology
you read and remember. It is a set of files that live in the repository and are
loaded, executed, and maintained as part of normal work.

The problem it solves is **cold start plus drift**. An agent begins every session
with no memory. Left alone it re-scans the codebase, re-derives conclusions that
were already settled, and re-litigates decisions the team made weeks ago. Worse,
whatever it learns evaporates when the session ends. The factory replaces that
with a small number of curated, durable surfaces the agent reads instead of
re-deriving.

## The four moving parts

1. **Curated current truth.** One file (`CLAUDE.md`) states what is true *now*.
   Conclusions, not history. It is deliberately lean and deliberately superseded
   in place rather than appended to.
2. **A chronological record.** One append-only log (`docs/decisions/`) states
   what happened and why, one entry per PR. Never pruned, never the place you
   look for current state.
3. **Executable procedure.** Skills that auto-load when a task matches, and
   slash commands you invoke explicitly. Procedure lives as instructions the
   agent follows, not as prose a human has to remember to quote.
4. **Enforcement.** CI guards and doctrine that make the dangerous paths fail
   loudly instead of relying on everyone remembering the rule.

## The loop

```
  /start ──▶ delta-load what changed since your last commit
             (never the whole history)
        │
        ▼
   cut a feature branch off the staging branch
        │
        ▼
   build a vertical slice, stop at the defined gate, report
        │
        ▼
   verify: typecheck + lint + build green, say plainly what a human
   still needs to click
        │
        ▼
   append one decision entry ──▶ distill any durable conclusion UP
                                  into the curated current-truth file
        │
        ▼
   PR into staging (never a direct commit) ──▶ human review ──▶ merge
        │
        ▼
   deliberate staging ──▶ production promotion PR
```

Every arrow in that loop is backed by a file in this kit.

## The three principles underneath it

**Conclusions and chronology are different files.** Mixing them produces a
document that is either stale or enormous. Separating them lets the current-truth
file stay small enough to load every session and the log stay complete enough to
answer "why did we do that?" a year later.

**Load the delta, not the history.** An agent resuming work needs what changed
since the reader last committed, plus the current-truth file. Nothing else.
Bulk-loading history is how you burn a context window and still miss the point.

**Failures are loud.** Silent fallbacks, swallowed errors, and unenforced
conventions all decay the same way: they work until they don't, and nobody
notices. Everything in this kit prefers a visible failure to a quiet one.

## What this kit is not

It is not a replacement for thinking about your architecture, and it is not a
process you should adopt wholesale without adapting. The templates carry
placeholders precisely because the values are yours. The doctrine documents carry
reasoning precisely so you can tell which parts are load-bearing and which are
this-repo-specific taste.

---

*Read next: [`01-context-architecture.md`](01-context-architecture.md) for how the
four surfaces relate, or jump to [`../INSTALL.md`](../INSTALL.md) to stand it up.*
