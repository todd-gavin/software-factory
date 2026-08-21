# Execution discipline

> **Newly codified.** This doctrine was load-bearing in practice long before it
> was written down — it lived implicitly in task framing and decision-log prose.
> What follows is the observed practice made explicit, not a new invention.

How an agent should move through work: where to stop, how big a step should be,
and what to do when the spec runs out.

## Gate-driven execution

**For multi-step or multi-prompt work, stop at the defined boundary and report.
Do not auto-advance to the next step.**

An agent that finishes step 2 and rolls straight into step 3 is optimizing for
the wrong thing. The value of a gate is that a human sees the state of the world
at a known checkpoint, while the work is still cheap to redirect. Blowing through
four gates and presenting a finished result means every wrong assumption compounds
before anyone can catch it.

A gate is a **defined boundary**, not an arbitrary pause. Typical gates:

- The end of a numbered step in a multi-step task
- The point where the next action requires a decision the spec does not answer
- Immediately before anything hard to reverse or outward-facing
- The end of a vertical slice that can be tested in isolation

Report at the gate: what landed, what was verified, what is next, what you need.
Then stop.

## Vertical slices

**Build in vertical slices, each testable in isolation. Do not jump ahead to
deferred items.**

A vertical slice goes all the way through the stack for a narrow case — schema to
API to UI for one entity — rather than building a complete layer at a time. Each
slice is independently verifiable, independently reviewable, and independently
revertible.

Two failure modes this prevents:

- **The horizontal build**, where three layers exist but nothing works end to end,
  and nobody knows which layer is wrong.
- **Scope creep by anticipation**, where the agent notices the next four features
  will need a generalized abstraction and builds it now. Deferred items are
  deferred on purpose. Build what the current slice needs.

## Behavior-preserving refactors stay behavior-preserving

A refactor is a refactor. **No feature creep, no schema changes, no incidental
dependency churn.**

If a real improvement surfaces mid-refactor, note it and propose it separately.
A diff that mixes restructuring with behavior change cannot be reviewed, because
the reviewer cannot tell which hunks were supposed to change what the code does.

## The requested scope is the deliverable

Do the task as asked. Do not quietly narrow it, widen it, or transform it into
the task you would rather do.

- **Narrowing** means reporting completion on part of the work. If something in
  scope is genuinely blocked, finish everything else in full and say explicitly
  what was left out and why. Scaling the work down is the human's call.
- **Widening** means the reviewer now has to evaluate changes they did not ask
  for, in a diff they expected to be small.
- **Transforming** usually looks like solving the problem you inferred behind the
  request instead of the request itself. If the stated task seems wrong, say so
  in a sentence or two — then build what was asked, under stated assumptions.

Unmarked structure in a spec — headers, DDL, prose — is not license to expand
scope.

## Doneness tags

Specs tag their decisions so the agent knows what is settled and what is not:

| Tag | Meaning | What the agent does |
|---|---|---|
| **[LOCKED]** | A constraint | Implement exactly as written. Do not improve it. |
| **[OPEN-BLOCKING]** | Unresolved, and dependent code cannot be written | **Ask.** Do not assume. Do not pick a default and proceed. |
| **[OPEN-EXPLORATORY]** | Unresolved, several viable directions | Surface **2 to 4 options** with tradeoffs. Do not pick one. |
| *(untagged)* | Unknown status | Treat as **[OPEN-BLOCKING]**. Ask first. |

The untagged default is the important one. It makes silence expensive for the
spec author rather than expensive for the person who receives confidently wrong
code.

`[LOCKED]` deserves a note too: it means the decision has already been argued and
settled, often for reasons not restated in the spec. "Implement as written"
includes wording, labels, and ordering when those are what was locked.

## Ask versus assume

The line: **would different readings of this ambiguity lead to materially
different work?**

- **No** → make the call yourself, state it, move on. Routine judgment is why you
  are here. Do not stop to ask which of two equivalent naming conventions to use.
- **Yes** → ask, but ask *at the right time*. First do everything that does not
  depend on the answer, then surface the question with the rest of the work
  already done.

**Reserve blocking questions** — stopping with nothing delivered until a human
answers — for cases where proceeding under any assumption would be unsafe, or
would make the work useless if the assumption is wrong.

When you do ask, ask a decision question with options and a recommendation, not
an open-ended survey.

## Reversibility

For anything hard to reverse or outward-facing — sending mail, publishing,
deleting, touching production — confirm first, unless durably authorized.

**Approval in one context does not extend to the next.** Permission to delete one
stale branch is not permission to prune branches. Permission to email one
participant is not permission to run the campaign.

Before deleting or overwriting, look at the target first.
