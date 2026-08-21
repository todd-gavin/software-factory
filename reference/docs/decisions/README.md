# Decision log — index

The chronological, per-PR record of substantive decisions, split into per-month
files (newest entries at the bottom of each file). This is the full
*what-happened-and-why*; the **durable conclusions** are distilled up into
`CLAUDE.md` → "Current state and standing decisions". Pick the month slice you
need rather than loading everything — and when resuming, load only what is newer
than your last commit (see the `resume-cold-handoff` skill).

`.gitattributes` sets `merge=union` on `docs/decisions/*.md`, so concurrent per-PR
appends auto-resolve **on local merges** (do `dev`-integration merges locally, not
via the GitHub web UI). Append + distill per the `logging-and-curation` skill.

## Months

| File | Span | Summary |
|---|---|---|
| [`2026-06.md`](2026-06.md) | 2026-06 | Platform build-out: context-miner audit, monorepo env-file convention + canonical-DB repoint, RLS coverage audit + lockdown, architecture v1 (`prompts`/`audit` schemas), app renames (kickoff→admin-platform, miner→context-miner), admin-platform IA restructure, prompts moved to `prompts.templates` (versioned), rounds made real + round-aware composition, live context-mining observability (`pipeline_events` + SSE + operator view), the persistent dev Supabase branch + one-time prod→dev seed, per-app `.env.example` regeneration, the CLAUDE.md local→dev→prod entry point + DevOps skills, and this context-architecture relocation. |
| [`2026-07.md`](2026-07.md) | 2026-07 | The C-series rebuild completed and consumed: DB-stored prompts + per-prompt call config (C0), the R1 deterministic spine (C1), truncation-can-never-store-as-complete (C2), canonical summaries (C3), LLM-composed rounds 2 and 3+ (C4/C5) with the legacy weave torn down, dynamic serve-time composition (C6), and composition observability re-pointed at the as-built graph (C7). Then Solo Mine V0 (S0+S1), the kickoff restructure (K1–K3), the metrics-truthfulness audit and its remediations (A1), the round-lifecycle loader + stepper (RL-1 through RL-6), interview reliability (R1–R4), and the session-lifecycle policy with auto-end, force-end, and re-interview (SL-1/2/3). Promoted to production via PR #128 on 2026-07-17. |
| [`2026-08.md`](2026-08.md) | 2026-08 | The development harness extracted as `software-factory/` — a portable, indexed kit (doctrine + placeholdered templates + worked reference copies + an agent-executable install runbook) for carrying this repo's process into other projects. |
