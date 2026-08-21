# Verification and what "done" means

> **Newly codified.** Drawn from the verification claims that actually appear in
> this repo's decision entries — the practice existed; the rule did not.

The rule in one line: **the claim you make must match the check you ran.**

## The green bar

Before reporting any code change complete:

```
{{TYPECHECK_CMD}}     # strict typecheck, every affected package
{{LINT_CMD}}          # lint, every affected app
{{BUILD_CMD}}         # production build, every affected app
{{TEST_CMD}}          # whatever suite exists
```

Every affected app, not just the one you were looking at. In a monorepo a shared
package change compiles cleanly in one consumer and breaks another.

**If a check fails, say so, with the output.** A failing test reported as passing
is worse than no test. If you skipped a step, say which and why.

## State the verification method, not just the verdict

The convention that makes this repo's decision log trustworthy is that entries
say **how** something was verified, in the entry itself:

> **Verification (tsc/build/lint only):** tsc strict + eslint clean on both
> branches, both apps; both builds green; `verify:pipeline` + `verify:rounds`
> green on each.

That parenthetical is doing real work. It says exactly what class of confidence
this is: the types agree and it compiles. It is **not** a claim that the feature
behaves correctly.

Adopt the same shape. Name the tier:

| Tier | What it proves | What it does not |
|---|---|---|
| **Static** (typecheck, lint, build) | It compiles and satisfies its types | Nothing about runtime behavior |
| **Automated** (unit, integration, fixture) | The covered paths behave as asserted | Nothing about the uncovered ones |
| **Manual** (a human clicked it) | This path works in a real environment | Nothing about the paths not clicked |

Never let a static-tier check be reported as if it were a behavioral one.

## Grep-verification is a real tier, and it has real limits

A grep that proves an absence is legitimate evidence and worth recording:

> grep — no auto/force path stamps `completed_at`

It proves a textual absence in the tree at that moment. It does not prove the
behavior is impossible through an alias, a dynamic key, or a code path added
tomorrow. Record what you searched for so a reader can judge the strength.

## Name the click-test

For anything with a UI or a real integration, **name the specific manual test a
human should run**, in the PR body, in concrete steps:

> complete → reopen → choice → second completed attempt → both conversations in
> the next mine

Not "please test the flow." A named test is falsifiable, takes a known amount of
time, and tells the reviewer what you believed the risky path was.

When the human runs it, record the outcome in the decision entry. That is how a
behavioral claim earns the right to be stated as fact.

## Baselines: honest handling of pre-existing noise

Real repos have files with pre-existing lint findings. The honest technique:
**record the exact baseline and diff against it.**

> eslint clean (interview-client at its exact 11-finding baseline, diffed
> ignoring line shifts)

This says: the file had 11 findings before, it has the same 11 now, and none are
mine. Do not silently accept a rising count, and do not claim "lint clean" when
what you mean is "no new findings."

## No silent caps

If your work bounds its own coverage — you reviewed the top 20 of 60 files,
sampled instead of exhausting, capped a retry, skipped a slow suite — **say so
explicitly**.

Silent truncation reads to every future reader as "covered everything." That is
the single most expensive form of quiet dishonesty in engineering work, because
it is indistinguishable from thoroughness until it fails.

## Reporting

When done and verified, **state it plainly.** No hedging, no ceremonial
uncertainty about work you actually checked.

When not done, say what is incomplete and why. When something was skipped, name
it. When a test failed, show the output.

The goal is that a reader can calibrate on your reports without re-checking them.
That trust is built by the failures you report, not the successes.
