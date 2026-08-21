# Branches, environments, and flow

## Two long-lived branches

`{{PROD_BRANCH}}` is production. `{{STAGING_BRANCH}}` is staging. That is the
whole branch model.

- **Never commit or push directly to either.** Every change is a feature branch
  cut from staging, merged by PR into staging.
- **Promotion to production is a deliberate PR** from staging to production. That
  PR *is* the release: it runs accumulated migrations against prod and ships the
  production deploy. It should feel like an event, because it is one.
- **The agent may** create branches, commit, push, and open PRs. **The agent must
  not** merge PRs, force-push, delete branches, or change repository settings.
  Every PR gets human review before merge.

The asymmetry is deliberate. Writing code is recoverable; merging and force-pushing
are the operations where a mistake costs someone else's afternoon.

## Three environments, no shared resources

| | git branch | Database | Hosting | Keys |
|---|---|---|---|---|
| **local** | a feature branch | staging DB | local dev server | local `.env.local` |
| **staging / preview** | `{{STAGING_BRANCH}}` | staging DB | every preview deploy | staging keys |
| **production** | `{{PROD_BRANCH}}` | production DB | production deploy | prod keys |

**Only the production branch touches a production resource.** Local development
points at the staging database, never production. This is the single most
valuable line in the whole kit: it means no local experiment, no preview deploy,
and no half-finished feature branch can reach real data.

The corollary is the **same-environment-peer rule**: any URL one service uses to
reach another, or itself, must point at its own tier. Staging to staging, prod to
prod, local to localhost. A staging deploy holding one production URL silently
crosses the isolation boundary and everything downstream of it is production
traffic wearing a staging label.

## Choosing what to branch from

Run this before starting any work. **The default is to branch off staging.**
Stacking is a deliberate exception.

1. `gh pr list` — see what is open and unmerged.
2. Ask: does this work require code that lives in an open, unmerged PR? A real
   **code dependency**, not mere thematic relatedness.
   - **No** → branch off staging. This is the common case.
   - **Yes, and the prerequisite is reviewed and ready** → merge the prerequisite
     first, then branch off updated staging. **Prefer this over stacking**; it
     dissolves the dependency entirely.
   - **Yes, but the prerequisite cannot merge yet** → stack: branch off the
     prerequisite's branch, merge bottom-up, rebase the stack if its base moves.
3. **The human confirms the dependency.** Surface the candidates ("this touches
   files PR #X also changes — does it depend on #X?"), but never silently infer a
   stack from topic similarity. Dependency is about coupling and intent, and the
   human owns that call.

## Stacked PRs and the single-writer convention

When work genuinely stacks, three rules keep it sane:

**Merge bottom-up.** If B is stacked on A, A merges into staging first. Always.

**One decision entry rides the top PR.** A stack of three related PRs produces
*one* combined decision-log entry, and one HANDOFF note, both riding the topmost
PR in the stack. Not one entry per PR.

Why: the decision was made once, not three times. Three entries describing one
architectural choice fragment the record and guarantee that a future reader finds
only one of the three. The PR bodies of the lower branches note that the entry
rides the top ("decision log + HANDOFF ride PR #189"), so the trail is followable.
This is the **single-writer convention**: for any one shared document, one branch
in a stack is the designated writer.

It also has a mechanical benefit. Even with `merge=union`, three branches
appending to the same log file produce three-way interleaving that reads badly.
One writer produces one clean entry.

**Rebase the stack when the base moves.** If staging advances significantly under
an open stack, rebase rather than merging staging in repeatedly. A stack whose
base has drifted for weeks needs a deliberate rebase-and-reconcile pass, and that
pass deserves its own decision entry describing what was reconciled.

## Integration merges run locally

`.gitattributes` sets `merge=union` on the decision-log directory so concurrent
appends auto-resolve. **The union driver only runs on a local merge.** Merging
staging integration through the GitHub web UI bypasses the driver entirely and
surfaces conflicts by hand.

So: do staging-integration merges locally.

## The PR checklist

Before opening any PR:

- [ ] Branched from staging (or a deliberate, confirmed stack base)
- [ ] Verification green — see [`04-verification-and-done.md`](04-verification-and-done.md)
- [ ] One decision entry appended (or explicitly riding the top of the stack)
- [ ] Durable conclusions distilled up into the curated file
- [ ] Any destructive annotation or label called out **explicitly** in the PR body,
      never buried — see [`05-safety-doctrines.md`](05-safety-doctrines.md)
- [ ] PR targets staging, never production

## Typical loop

```bash
git fetch origin
git checkout -b feat/my-change origin/{{STAGING_BRANCH}}
# ...work, verify...
git push -u origin feat/my-change
gh pr create --base {{STAGING_BRANCH}} --head feat/my-change
# human review → LOCAL integration merge → staging auto-deploys to preview
```

## Promotion

```bash
gh pr create --base {{PROD_BRANCH}} --head {{STAGING_BRANCH}} \
  --title "Promote {{STAGING_BRANCH}} → {{PROD_BRANCH}}"
# merging runs accumulated migrations on prod and ships the production deploy
```
