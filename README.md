# software-factory

A portable, indexed extraction of this repository's development harness: the
files that make an AI coding agent productive and disciplined from the first turn
of a session. Copy it into another repository, fill in the placeholders, and that
repo works the way this one does.

**This folder changes nothing about how this repo operates.** It is a copy plus
the reasoning behind it. The live harness stays exactly where it was.

---

## The 60-second version

An agent starts every session with no memory. Left alone it re-scans the
codebase, re-derives settled conclusions, and retains nothing when the session
ends. This kit replaces that with four durable surfaces:

- **`CLAUDE.md`** — curated current truth. Conclusions, superseded in place.
- **`docs/decisions/`** — the append-only chronology. One entry per PR, with the
  alternatives you rejected.
- **Skills** — procedure that auto-loads when a task matches it.
- **CI guards + doctrine** — the dangerous paths fail loudly instead of relying
  on memory.

Plus the read protocol that makes them pay off: **delta loading** — on resume,
load only what changed since your last commit, never the whole history.

## Layout

```
software-factory/
├── README.md          you are here — the index
├── INSTALL.md         the bootstrap runbook (point an agent at this)
├── PLACEHOLDERS.md    every {{TOKEN}}, its meaning, where the value comes from
├── MANIFEST.md        file-by-file: source → destination → templated? → required?
├── check-drift.sh     reports where reference/ has fallen behind the live files
│
├── doctrine/          WHY each rule exists — portable, stack-independent
├── template/          WHAT you copy — placeholdered, ready to fill
└── reference/         this repo's live files, verbatim, as a worked example
```

**Three layers, one idea:** `doctrine/` is the reasoning, `template/` is the
artifact, `reference/` is the proof it works somewhere real.

## Install it

In the target repository:

> Read `software-factory/INSTALL.md` and install the harness here.

The agent checks preconditions, interviews you for the placeholder values in one
batch, copies files to their destinations, seeds the first decision entry,
verifies, and lands it as a PR. Full detail and the manual fallback:
[`INSTALL.md`](INSTALL.md).

## The doctrine

| Document | What it covers |
|---|---|
| [`00-the-factory.md`](doctrine/00-the-factory.md) | The system in one page: the loop, the four surfaces, the three principles |
| [`01-context-architecture.md`](doctrine/01-context-architecture.md) | CLAUDE.md vs decisions vs HANDOFF vs reports; delta loading |
| [`02-branches-and-flow.md`](doctrine/02-branches-and-flow.md) | Two branches, three environments, stacking, the single-writer convention |
| [`03-execution-discipline.md`](doctrine/03-execution-discipline.md) | ★ Gates, vertical slices, doneness tags, scope, ask vs assume |
| [`04-verification-and-done.md`](doctrine/04-verification-and-done.md) | ★ The green bar, verification tiers, baselines, no silent caps |
| [`05-safety-doctrines.md`](doctrine/05-safety-doctrines.md) | Failures block, destructive fencing, single source of truth, security |

★ **Newly codified.** These three were load-bearing in practice but had never
been written down — they lived in task framing and decision-log prose. They are
the observed practice made explicit, not new invention.

## What travels well, and what needs rewriting

| Layer | Portability |
|---|---|
| `doctrine/` | **Fully portable.** No stack assumptions anywhere. |
| `branch-and-pr-workflow`, `logging-and-curation`, `resume-cold-handoff`, the 3 commands | **Portable.** Only branch names change. |
| `database-and-migrations`, `environments-and-env-vars`, `staging-verification` | **Supabase + preview-host adapter.** Rewrite the mechanics for a different stack; keep the invariants. |
| `CLAUDE.md` state section | **Never portable.** Its content is always this-project-only. The template ships the structure; you write the content. |

If your stack differs, rewrite the adapter skills **concretely**. A skill hedged
into vagueness so it fits every stack helps nobody — the agent needs the actual
command for the actual tool.

## Three things worth knowing before you adopt this

**The rules that lack enforcement are the ones that decay.** The clearest example
lives in this very kit: `docs/HANDOFF.md` opens with "keep it SHORT, prune
entries once absorbed," and the live file is 1198 lines. Nothing enforced the
pruning, so it never happened. Both CI guards have the same shape of gap — they
are advisory until branch protection requires them, and configuring that is a
manual dashboard step people skip. Assume any unenforced convention is optional
in practice.

**The curated file needs active superseding.** A state section maintained by
appending becomes a pile of overlapping half-truths, which is worse than no state
section, because the agent believes it. When this repo's own report was generated
during the extraction, roughly six paragraphs still read "pending prod promotion"
for migrations that had shipped a month earlier. Distilling up is a real step, and
it is the one that gets skipped under deadline.

**Start smaller than this.** The four required skills, CLAUDE.md, and the decision
log are the irreducible core, and they deliver most of the value on day one. The
rest earns its place as the project grows into it. Installing eleven files of
process into a two-week-old repo is how a harness becomes something people route
around.

## Maintaining the reference copies

`reference/` drifts as the live files change. `./check-drift.sh` names it:

```
$ ./software-factory/check-drift.sh
DRIFT: .claude/skills/branch-and-pr-workflow/SKILL.md
       14 changed lines vs software-factory/reference/…
```

Deliberately not wired into CI — a required check would change how this repo
operates, which the extraction was not supposed to do. Run it before copying the
kit somewhere new.

---

*Extracted from the miine-platform monorepo, 2026-08-19.*
