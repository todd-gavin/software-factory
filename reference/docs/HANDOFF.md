# HANDOFF — rolling work-in-flight handoff

The short, current "what just landed / what the next session needs to know"
note that recent task conventions expect (`docs/HANDOFF.md`). This file was
absent until C0 (PRs #97/#98/#101 each flagged the miss); it now exists as the
rolling handoff surface. Keep it SHORT and CURRENT: newest entry on top, prune
entries once their content is absorbed by CLAUDE.md / the decision log. This is
NOT a second decision log — the durable record stays in `docs/decisions/`
(per-PR, append-only) and CLAUDE.md (current truths). Entries here are
disposable orientation for whoever picks the work up next.

---

## 2026-07-17 RL-6a/6b: per-round cycle reframe + briefings clarity

**Branches/PRs:** `feat/rl6a-cycle-reframe` (#190) → `fix/rl6b-briefings-clarity`,
stacked, merge bottom-up. Decision log (LOCKED cycle-framing doctrine +
approve-flow decision) + this note ride RL-6b. RL-6a: the stepper presents
Todd's four-step loop per round (`RoundCycle[]` additive on the loader; flat
steps survive; current cycle advances at mine-complete; prior cycles
collapsed/browsable; CO-2 slot preserved on the compose step — **BO-1/BO-2
mounts there next**). RL-6b: "Approve all & continue" was vestigial (pure
link, no state, nothing gated) — DELETED; D1 brief blocks show "generated
<when>"; round-2+ sections list who was composed when/by which run, linking
to session composition panels; roster/profile gain "briefed <date>" pointers
(`EmployeeRoundState.briefedAt`). No new capture — display only.

---

## 2026-07-17 SL-1/2/3: session lifecycle — auto-end, force-end, re-interview

**Branches/PRs:** `fix/sl1-session-auto-end` (#187) → `feat/sl2-admin-force-end`
(#188) → `feat/sl3-reinterview-open-round`, stacked, merge bottom-up.
Decision log (incl. the LOCKED lifecycle policy entry) + this note ride SL-3.
SL-1: 60s client heartbeat (additive `sessions.last_heartbeat_at`, migration
20260720000001 APPLIED to dev branch) + pagehide hint + the lazy admin-load
sweeper (`lib/session-sweep.ts`, 10-min `STALE_ATTEMPT_MS`) → `abandoned` +
`auto_stale`, never completion. SL-2: `forceEndAttempt` (audit-logged
`session.force_end`, actor recorded) + the timeline button. SL-3: reopening
an unmined round serves the snapshot with the returning welcome variant;
a completed mine closes the link (`round_closed` serve reason + honest
page); pipeline math already counts distinct employees (no change).
**After merge: watch the two stuck dev attempts (7:56:06/4:44:13) sweep to
abandoned on the first /interviews load.** Prod promotion carries the new
migration; untyped casts standard.

---

## 2026-07-17 R4-refresh: #165/#166 rebased onto current dev

Both reliability PRs are refreshed and green on the K/E/B/D/RL-era codebase
(force-pushed to the existing PRs; stack preserved, merge bottom-up: #165 →
#166). R4a is confirmed COMPATIBLE with the pipeline loader (it fixes the
stored status cache writer-side; the loader stays completed_at-keyed — same
artifact truth), and it is the fix G3/RL-4 were waiting on: the roster/
profile status badges become truthful and agree with the RL-4 chips. R4b's
session log mounts after the current Attempts section; its mint telemetry
threads cleanly around the E2 gates. **After merging #165, re-run
`scripts/reconcile-session-status.ts` against dev (and on prod after
promotion) — the one-time corrective pass.** SL-2's force-end will mount in
the R4b session-log surface.

---
---

<!-- REFERENCE-COPY NOTE (added by software-factory, not part of the original)

     TRUNCATED: the live docs/HANDOFF.md carries 1198 lines / ~69KB. Only the
     header and the three most recent entries are reproduced here, which is
     enough to show the format.

     WORTH KNOWING: that length is itself a finding. This file's own header says
     "Keep it SHORT and CURRENT ... prune entries once their content is absorbed
     by CLAUDE.md / the decision log." In practice the pruning step was the one
     that got skipped, and the rolling note grew into a shadow chronology.

     The lesson for your repo: HANDOFF pruning does not happen on its own. Either
     prune it as part of writing each new entry, or accept that it will become a
     second decision log and stop pretending otherwise. The doctrine is right;
     the enforcement was missing.
-->
