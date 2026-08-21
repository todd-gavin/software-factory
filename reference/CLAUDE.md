# Miine Platform — Global Conventions

This file governs all work in this repository. It is the `miine-platform`
pnpm-workspace monorepo. Read it before making changes; keep it current when a
convention changes.

> Note: these conventions are synthesized from the platform specs in `docs/`
> (the context-mining spec's reading-instructions + conventions, and the
> control-center/kickoff spec's architecture). If a canonical "build playbook"
> exists elsewhere, fold it in here and supersede this note.

---

## Environments and workflow (read first)

The platform runs a strict **local → dev → prod** model. The rules below always
apply; the detail lives in the **DevOps skills** (`.claude/skills/`), which
**auto-load when your task matches** — listed at the end of this section.

**Branches (two, long-lived).** `main` = production, `dev` = staging. **Never
commit or push directly to `main` or `dev`.** All work is a feature branch cut
from `dev`, merged via PR **into `dev`**. Stacked PRs merge **bottom-up**.
Promoting to production is a deliberate PR from **`dev` → `main`**.

**Environments (three, no shared resources).**

| | git branch | Supabase | Vercel | API keys |
|---|---|---|---|---|
| **local** | a feature branch | dev branch `bfbphxbnboaibguawiov` | — (`pnpm dev`) | local `.env.local` |
| **dev / preview** | `dev` | dev branch `bfbphxbnboaibguawiov` | every Preview deploy | dev keys |
| **production** | `main` | project `xhudgqbdsvvsjtfmjmor` | Production deploy | prod keys |

**Nothing but `main` touches a production resource.**

**Vercel env scoping.** The Production scope holds prod values and serves `main`
only; the Preview scope (all branches) holds dev values and serves the `dev`
branch and every PR preview. Cross-app and self URLs (`INTERVIEW_AGENT_URL`,
`NEXT_PUBLIC_APP_URL`) must be environment-consistent — dev points at dev, prod
at prod, local at localhost. The committed `apps/*/.env.example` is the
**variable list**; real values live in `.env.local` (local) and the Vercel
dashboard (prod and dev) — for all three apps, the miner included.

**Database & migrations.** Migrations in `supabase/migrations/` **auto-apply to
the dev branch on push to `dev`**; the `dev → main` promotion runs them on prod.
**Never run `supabase db push` or a blanket `supabase migration up` against
production.** Re-seed dev from prod with `scripts/seed-dev-from-prod.sh`. **Always
verify which database and environment you are writing to before writing.**

**Decision log.** Append **one entry per PR** to the current month's file in
`docs/decisions/` (NOT to CLAUDE.md), then distill any durable conclusion up into
"Current state and standing decisions" below — see the `logging-and-curation`
skill. `.gitattributes` sets `merge=union` on `docs/decisions/*.md` so concurrent
appends auto-resolve — **but only on local merges.** Do `dev` integration merges
**locally**, not through the GitHub web UI, or the union driver won't run and
conflicts surface by hand.

**Detail (DevOps skills — in `.claude/skills/`, auto-load on the matching task;
also browsable via the repo-root `skills/` symlink):**
[`branch-and-pr-workflow`](.claude/skills/branch-and-pr-workflow/SKILL.md) —
branches/PRs/promotion ·
[`environments-and-env-vars`](.claude/skills/environments-and-env-vars/SKILL.md) —
variable→scope reference ·
[`database-and-migrations`](.claude/skills/database-and-migrations/SKILL.md) —
migration safety ·
[`staging-verification`](.claude/skills/staging-verification/SKILL.md) —
isolation runbook ·
[`resume-cold-handoff`](.claude/skills/resume-cold-handoff/SKILL.md) — cold-start
handoff · [`devops-overview`](.claude/skills/devops-overview/SKILL.md) — the map.

---

## Current state and standing decisions

The durable, current truths that define the project **now** — conclusions, not
chronology. The per-PR record lives in `docs/decisions/`. When a change alters one
of these truths, **supersede** the statement here (don't append); see the
`logging-and-curation` skill. Keep this section lean.

**Context architecture (this repo's own docs).** CLAUDE.md is the curated, lean
source of *current truth* (rules + this section + the index). `docs/decisions/<month>.md`
is the chronological *what-happened-and-why* per-PR log (`merge=union`, append-only).
DevOps guidance lives as auto-loading skills in `.claude/skills/` (browsable via the
root `skills/` symlink). Resume work via **delta loading** (`resume-cold-handoff`
skill): load only what changed since you last worked, not the whole history. The
`/report` command (`.claude/commands/report.md`) serializes these curated sources
into a dated, paste-into-a-fresh-chat briefing under `docs/reports/` — it composes,
never re-derives — and commits it via a dedicated `report/<slug>` branch + PR into
`dev` (a docs artifact: no direct `dev` commit, no decision-log entry). The `/dash` command (`.claude/commands/dash.md`) prints a
read-only, dynamically-enumerated inventory of the custom commands (explicit) and
skills (auto-loading) — no file written.

**Environments (local → dev → prod, no shared resources).** Only `main` touches a
production resource. Prod Supabase project `xhudgqbdsvvsjtfmjmor`; persistent **dev
Supabase branch `bfbphxbnboaibguawiov`** bound to git `dev`, schema from
`supabase/migrations/`, **seeded once from prod** via `scripts/seed-dev-from-prod.sh`
(`supabase/config.toml` carries `[remotes.dev]`); archive `jfmkvvbaazqgfqdgjprm` is
do-not-use. Vercel Production scope serves `main`; Preview scope (all branches) serves
`dev` + every PR preview. Cross-app/self URLs are environment-consistent; the per-app
`apps/*/.env.example` is the authoritative variable list. Detail: the
`environments-and-env-vars` + `database-and-migrations` skills.

**Observability is live.** A single append-only `public.pipeline_events` table (applied
to prod, in the `supabase_realtime` publication) is both the event log and the live
read-model; `emitEvent()` in `@miine/shared` is the one write path;
`@miine/shared/pipeline-topology.ts` is the single source of truth for nodes/edges +
semantic copy. The miner and admin emit at stage/per-call granularity (never per-row).
**Observability failures BLOCK (PR7, item-15 doctrine pulled forward):** when Supabase
is configured, `emitEvent`/`writeCallIO` THROW on a write failure (no more silent
swallow) so a broken pipeline is visible; when Supabase is entirely unconfigured they
no-op but warn loudly once per process. In-scope callers do NOT handle the throw — they
die loudly: all **four** magic-link mint paths (`mintLinks`, `mintNextWave`,
`mintEmployeeLink`, `reMintSession`) now `await` a shared `emitMintCompleted` helper
(one identical `fn_compose`/`completed` event) so a telemetry failure aborts the mint
visibly; the miner's run-scoped tracer stays fire-and-forget but LATCHES the first
telemetry error and re-throws it at the next op (and `assertHealthy()` awaits pending
tail emits before a run is stamped `complete`), so a mine fails through its existing
run-level capture with the telemetry op named in `mining_runs` — that failure handler is
the ONE place that guards its own telemetry writes so a telemetry failure there can't
mask the original error. Best-effort side outputs the doctrine leaves out of scope (the
export `db.json` event, the `mine_context`/`max_tokens` truncation warnings, briefing
observability) use `emitEventBestEffort` — a loud, non-blocking `console.error` on
failure — so they surface without breaking the operation they observe.
The **Pipeline** client-detail tab has two surfaces, both fed by a company-scoped SSE
relay (`/api/companies/[id]/pipeline/live`): the raw hand-laid-SVG trace
(`pipeline-trace-live.tsx`) and an additive `@xyflow/react` **operator view**
(`pipeline-operator-view.tsx`). **Miner telemetry is two-tier** (the run-scoped tracer
in `packages/miner-core/src/instrument.ts`): tier-1 = the coarse stage spine (topology
node ids, existing surfaces) PLUS fine per-operation events under the sentinel node
`miner_op` (op taxonomy in the payload; outside the topology so the existing surfaces
exclude them with no change); tier-2 = full LLM call I/O (prompt + context manifest +
raw/parsed output + write summary) in `public.miner_call_io`, **deliberately NOT in
`supabase_realtime`** (fetched on demand, field-capped). Stage `completed` events fire
at each stage's true boundary. The **miner ledger** renders this: a third view in the
client Pipeline tab's `PipelineViewSwitcher` (`components/miner-ledger.tsx` + the pure
`lib/ledger.ts` data layer), a run-scoped hierarchical list (run→stage→pass→op built
from the fine `miner_op` events) with each `llm_call` expandable to its `miner_call_io`
detail. Initial paint = a run-scoped server fetch of all events ordered by `seq` (read
routes under `app/api/companies/[id]/runs/...`); live tail = the same SSE relay filtered
to the run. The synchronized timeline/waterfall over this same data layer is a later pass.
**Failure is captured, not silent:** the run-level catch + the tracer's `failOpen()` emit a
terminal `failed` event naming the exact op (e.g. `stage_c/insights/llm_call`) with error +
truncated stack, and auto-stamp `mining_runs` `failed` (guarded to a `running` row, so no
stranded `running` rows); the ledger renders a failed op red and the run as failed. The Opus
calls retry transient errors (429/529/5xx/connection) with bounded exponential backoff,
observable as `attempt:N` on the `llm_call` span (the miner owns retrying — the SDK's silent
retries are off). Hard platform kills still escape (a best-effort client-disconnect stamp
catches some; the durable fix is the deferred fire-and-poll rearchitecture). A fourth
Pipeline-switcher surface, the global **Logs** console (`miner-logs-console.tsx`), is a flat
chronological conveyor of every `pipeline_events` row across ALL runs/clients (backfill +
live tail, 500-row buffer, filter, click-to-expand) — fed by a thin global read relay
`GET /api/pipeline/live` (the cross-company analogue of `/api/mining/live`, on
`pipeline_events`). **A clickable per-run instance page** (`app/clients/[companyId]/mining/run/
[runId]`, linked additively from the round detail + global console) hosts two new **live figures**
rebuilt from the committed design `docs/design/miner-llm-dataflow-v2.html`: the per-call I/O lanes
and the three-column dataflow graph (`mining-run-io-lanes.tsx` + `mining-run-dataflow.tsx`, data in
`lib/run-dataflow-spec.ts`). Both animate off ONE run-scoped stream (the seq-ordered
`/runs/[runId]/events` fetch + the company SSE filtered to the run) with a replay/live driver, and
click-to-logs filters the run's events by node/op; the page also embeds the run-scoped Ledger
(`MinerLedger` gained an additive `initialRunId`). It is **purely additive** — the four
Pipeline-switcher views and the Knowledge tab are unchanged.

**Canonical summaries (the miner's terminal Summaries stage, C3).** After Knowledge,
every mine ends by regenerating `public.canonical_summaries` (insert-only history;
`previous_id` = the D13 handoff chain; latest per (company, scope, user_id) is the
composition read shape — NOTHING composes it until C4/C5): deterministic LLM-free
dumps (`miner-core/summaries-dump.ts` — byte-stable ordering, per-scope char budgets,
oldest-first row truncation with a loud warning) feed three DB-seeded generators
(`generate_canonical_business_summary` HIGH / `_user_` / `_team_` MEDIUM; caps in the
seeded call_config: 10666/8000/6000) through the C2 truncation policy. Business = full
corpus + previous business summary + fresh user/team roll-ups (D13); user = keyed +
name/role-mention rows cross-interview (D12, reusing the miner's name resolution);
team v0 = relationship adjacency around the subject. Scope per mine: business always,
user+team per employee with interview data (calls/mine = 9 + 2N). The run's terminal
`fn_run completed` event fires only after summaries complete (the C6 trigger
contract). Migrations 20260707000001–2 applied to dev, pending prod promotion.

**Knowledge stage + edges (the miner's 4th stage, after C).** Derives
`canonical_tribal_knowledge` + `canonical_decisions` from the previously-unmined raw
sources (tribal_knowledge + exceptions; decisions), resolving holder/topic/decider names to
canonical ids (kept alongside the originals in `*_raw`). A deterministic, **no-LLM** step then
projects those resolved ids into `canonical_relationships` as `held_by` / `applies_to` /
`decided_by` edges. **`canonical_relationships` is now multi-writer, scoped by an `origin`
column** (`'stage_c'` vs `'knowledge'`): each writer's id-preserving recompute reads/retires
only its own origin, so neither clobbers the other. The shared `archive_canonical_row` history
trigger maps columns **by name** (jsonb), so additive canonical columns can't break archival.
**Consumers are now wired to the knowledge output** (the build-1/2 derivation shipped ahead of its
readers; corrected per `docs/miner-dataflow-current.md` §6): the round-2 brief loader
(`mine_context`, `admin-platform/lib/{mining-results,round-context}.ts`) loads `canonical_tribal_
knowledge` + `canonical_decisions` and renders them as their own brief sections via the
`source_claim_ids`-overlap rule, while **excluding `origin='knowledge'` edges** from the brief's
relationships (live `stage_c` only — knowledge surfaces as knowledge, not as a bare-UUID edge); and
`C.insights` reads `canonical_relationships` scoped to `origin='stage_c'` + `valid_to IS NULL` (read
scope only — prompt/parse/write unchanged). The knowledge tables + the `origin` column are not in
the generated `Database` types yet (their migrations are pending prod promotion), so these
consumers read them via the untyped admin client.

**Prompts are DB-stored, versioned, and carry per-prompt call config (C0).** All prompt
kinds live in `prompts.templates` (one-active-per-kind; atomic `save_version`/
`restore_version` RPCs), runtime-editable via the admin Prompts page, with a code-baked
fallback so a missing row never breaks a run — and **a fallback serve is never silent**:
the shared store (`getActivePromptRecord`/`getActivePrompts` in `@miine/shared`)
`console.error`s and (with a `PromptFallbackObs`) emits a `warning` pipeline event naming
kind + cause. The registered vocabulary is the full C0 target set (24 kinds; the one
code-side registry is `PROMPT_KINDS` in `admin-platform/lib/prompts-data.ts`); the three
interview synthesis prompts (`interview_summary`/`interview_analysis`/`interview_db_json`)
are DB rows read through the store by the export route (constants remain as fallback);
eight rebuild kinds are registered-but-unconsumed until C1–C6. Every template row has a
nullable `call_config` jsonb (`{model?, max_output_tokens?, thinking?}`, versioned WITH
content, editable on the Prompts page; cap ≤ 21333, the non-streaming SDK ceiling); NULL
= the `@miine/shared/llm` platform defaults, applied via `llmParamsFor(kind, config)` at
every DB-prompt call site (synthesis, briefings, miner) — a null config is byte-identical
to `llmParams(kind)`. The C0 migrations (20260704000001–3) are applied to dev, pending
prod promotion — `call_config` reads/writes stay untyped/cast until types regenerate.

**LLM calls are centrally configured, with thinking ON.** Every Anthropic Messages call
on the platform (interview synthesis, admin briefings, all context-miner stages) consults
ONE config surface, `@miine/shared/llm` (SDK-free so it stays out of client bundles): the
`LLM_CALLS` map (logical kind → `{effort, maxTokens}`), `llmParams(kind)` (the request
fragment call sites spread into `messages.create`), `minerCallKind(stage)`, and
`handleStop()`. Model is `claude-opus-4-7` (`LLM_MODEL`); thinking is enabled via
`thinking:{type:'adaptive'}` + `output_config.effort` (adaptive = no `budget_tokens`;
never `temperature`/`top_p`/`top_k` — all 400 on 4.7). effort is **HIGH** for briefing
composition, interview analysis, and miner Stage C (`stage:'stage_c'` — both the
relationships and insights passes); **MEDIUM** for everything else (interview summary,
db.json extraction, miner Stages A/B, miner knowledge). Output cap is one shared constant
`MAX_OUTPUT_TOKENS = 20000` — not 128k: every call is non-streaming and the installed SDK
throws before sending when `max_tokens > ~21.3k` for opus-4-7 (a true 128k cap needs the
deferred streaming rearchitecture). **Truncation can no longer store as
complete (C2):** every app-side call family (interview summary/analysis, db.json
extraction, briefs incl. the whole pause_turn loop, deciphering, the D2 decision) runs
under `withTruncationRetry` — a `max_tokens` stop records the loud warning and retries
ONCE at `min(2×cap, NONSTREAMING_MAX_TOKENS = 21333)`; a second truncation emits a
terminal `failed` event naming the call + both caps and THROWS `LlmTruncationError`, so a
truncated output is never stored. `llm_stop_reason`/`llm_attempts` stamp `briefing_runs`
+ `session_outputs` (additive columns pending prod promotion → cast writes); db.json
parse failures are a failed run (terminal event, nothing partial in the raw layer, no
swallow; the export response carries `dbJson: ok|skipped|failed`). The MINER deliberately
keeps `handleStop()` record-and-continue (truncation ⇒ parse failure ⇒ re-roll ⇒ loud run
failure — its own guarantee of no truncated write). `interview_summary` is the v-next
ROUND-MEMORY rewrite (role/team state, timeframed commitments, open threads, keyed
entities; gaps stated as gaps); `position_brief_toggle` is a registered, seeded,
config-carrying kind read through the store. Text extraction filters
`type==='text'` blocks only, so the leading thinking block(s) are ignored by construction
(no parser change needed). **Server-side tools are declared on the same surface:** the
`briefing` kind carries web search (`web_search_20260209`, `max_uses` 5 — a `webSearch`
flag on its `LLM_CALLS` entry; `llmParams` omits the `tools` key for every other kind) so
briefs ground in current public info; `generateBrief` resumes `pause_turn` server-tool
pauses (bounded at 5 continuations; on exhaustion it records loudly and keeps the
accumulated output — never a hard failure) and the `t_briefings` completed event carries
`web_searches`. No other call kind sends tools. Round-2 `prior_summary` composes **uncapped**; `mine_context`
keeps `CAP_PER_TYPE` + `MINE_CONTEXT_MAX_CHARS` and emits a `warning` event whenever a
bound clips (truncation is never silent). **The miner is single-shot per pass** — the
old `has_more` output-pagination batch loop (`paginatedCollect`, `MAX_BATCHES`,
`MINER_PAGE_SIZE`) is deleted; each pass is one `collectPass` call (keeps the 3× JSON
re-roll + citation validation), and a `has_more:true` response is treated as a
re-rollable failure that fails the run loudly rather than writing a truncated set as
complete (a guard against un-mirrored DB prompt rows still instructing batched emit).

**Rounds are real; composition is round-aware; Round 1 is the C1 target assembly.**
`sessions.round_number` and `mining_runs.round_number` are first-class (a "round" = a
wave of newly-minted interviews). **Round 1 (C1):** the designated onboarding transcript
(`client_documents.doc_type='onboarding_transcript'`, at most one per company, Documents
tab) feeds the `transcript_deciphering` pass (DB prompt, HIGH), whose synthesis persists
through the brief conventions (kind `onboarding_synthesis`) and is the spine all three
briefs ingest — company (name+website+GENERAL docs+synthesis; the transcript never rides
as a raw doc), industry (synthesis), position (synthesis+role+industry brief, the D3
edge) — generated deciphering → company+industry → position, single and bulk regenerate
sharing one input assembly. The D2 toggle (one `position_toggle` structured call per
role) stamps `position_brief_include`/`_reason` per employee; `position_brief_override`
is the manual control that always wins and survives regeneration; an excluded position
brief composes to nothing. `briefing_user` is retired (soft — historical rows intact,
Prompts page groups it Deprecated). The RD1 prompt is the exact deterministic summation:
`interview_system` SOUL + company + industry + position (when included) + the three
variables — no user brief, no `{{ROUND_FOCUS}}`/steering. **Round 2 (C4) is LLM-composed:**
on every mine completion (and via `POST /api/companies/[id]/recompose-round2`), the R2
chain in `miner-core/compose-round2.ts` runs per eligible employee (has rd1
summary+analysis, no completed R2): the D16 onboarding REVISION (`onboarding_compaction`
— three R1 briefs + rd1 record → corrected, compacted background) → the
`rd2_dynamic_prompt_creator` (revision + rd1 record + the three canonical summaries →
the full R2 agent prompt: model-authored contextual sections + a `[[METHODOLOGY]]` mark
where the chain SPLICES the fixed SOUL block in deterministically — byte-identical by
construction, re-asserted every composition; `verify:creator` is the CI fixture floor) →
the shared `first_message_composition` temporal opener (written around the literal
`{{time_since_last_interview}}`, filled deterministically at mint via
`@miine/shared/elapsed`). Artifacts land in `public.composed_prompts` (insert-only,
`composed_from` = every input id + template versions, `mining_run_id`); failures are
per-employee loud events (`rd2_compose`) that never un-complete the mine. Round-2
minting copies the latest composed rows into the frozen serving columns and FAILS LOUDLY
when none exist; `composeForCompany(2)` throws; the new R2 path reads NO steering.
**Rounds 3+ (C5) are LLM-composed
by the same chain**, round-dispatched (D14 taxonomy R1 → R2 → R3+N): the ROUND-AGNOSTIC
`interview_system_rd3plus` creator composes from the ACCUMULATED record alone — every
prior round's summary+analysis, round-delimited with LOUD `[GAP]` markers + a
`record_gap` warning event for missing records — plus the latest three canonical
summaries; NO onboarding material, NO revision (that is R2's step). Eligibility:
highest completed session round N → compose N+1 on every mine (chain
`miner-core/compose-rounds.ts`, `runRoundPrecompute`, node `rd_compose`, manual route
`recompose-rounds`). **The legacy machinery is GONE (C5 teardown):** the r2plus weave
(`composeSystemPrompt` is R1-only; `composeForCompany` throws for rounds ≥2),
`prior_summary`/`mine_context` generation, `{{ROUND_FOCUS}}`, the steering surface
(`round_settings` column unread everywhere; table intact per additive-only doctrine),
and the `interview_system_r{N}`/`r2plus` editor kinds (Prompts page groups them
Deprecated; history intact). **Serving is dynamic (C6 — D9 done): nothing
freezes at mint.** Minting is bookkeeping (session row + round + token; the old
edit-and-re-mint retired with the freeze — `reMintSession(sessionId)` only). The link
CLICK resolves the latest artifacts with ZERO LLM calls
(`packages/db/serve.ts` `resolveAndSnapshotServe`, called by the interview-agent token
page): round 1 = the C1 summation AT SERVE TIME over the latest briefs + SOUL (an
edited brief reaches the very next click); rounds 2+ = the latest `composed_prompts`
rows with `{{time_since_last_interview}}` filled with true elapsed time. The session
records what was ACTUALLY served: `composed_system_prompt`/`composed_first_message`
are SERVE-TIME SNAPSHOTS since C6 (NULL = not served yet), plus `served_composed_ids`
(lineage → `composed_from`) + `served_at`; reconnects serve the snapshot (one
interview, one coherent prompt, resolved once). A round-2+ click with nothing composed
fails LOUDLY: participant-facing page, terminal `fn_serve` event, session stamped
`serve_failed` — no silent fallback (the sole documented exception: employee-less
legacy CLI sessions keep the dashboard-default prompt). Measured serve latency on dev:
R1 ~1s cold, R2 ~0.4s. `verify:rounds` (post-teardown
shapes) + `verify:creator` (rd2 + rd3plus fixtures incl. gap markers) run keyless in
CI. **Composition observability is re-pointed at the as-built graph (C7).**
`packages/shared/src/composition-topology.ts` describes ONLY the rebuilt
architecture (seven lanes: library → client context → R1 spine → interview record →
mined summaries → round composition → serving; mechanism-labeled edges; no retired
ghosts), and its node ids coincide with the rebuild's own event nodes (`summaries`,
`rd_compose`, `fn_serve`; mint's `fn_compose` event re-projects onto `fn_mint`;
C4-era `rd2_compose` events re-project onto `rd_compose`) so real events light the
graph with zero new emit sites. The Prompts-tab Composition view renders it: the
frozen-vs-live staleness badge + `diffComposed` are REMOVED (structurally
meaningless post-C6), the latest composed rows per employee/round are the pre-click
preview, and the headline is the LINEAGE WALK — session → serve snapshot
(`served_composed_ids`) → served `composed_prompts` rows → `composed_from` inputs
(revision, canonical summaries + D13 previous chain, record outputs, template
versions) → producing mining run, via the read-only
`/api/companies/[id]/composition/lineage` route (R1: snapshot → brief rows +
template versions resolved at serve). `docs/interview-prompt-composition.html` is
regenerated as-built (two figures: the R1 spine; the R2/R3+ chain with
round-dispatch bands); the pre-rebuild composition docs
(`prompt-composition-view-proposal.md`, `pipeline-trace.md` §3/§4/§12) carry
superseded banners. Rebuild migrations C1 20260705000001–2, C3 20260707000001–2,
C4 20260708000001–2, C5 20260709000001 are applied to dev, pending prod promotion (new
columns/tables read via untyped casts until types regenerate).

**Schema & security.** `public` plus the `prompts` and `audit` schemas; RLS on every
table (tenant isolation via the `app.current_company_id` GUC), least-privilege grants
(anon gets nothing). Migrations live in `supabase/migrations/`; generated types in
`packages/db`. Data-destructive migration SQL (DROP TABLE/SCHEMA/COLUMN, DELETE FROM,
TRUNCATE) is flagged by the `destructive-migration-check` CI workflow and the
`database-and-migrations` skill's protocol — a PR carrying it needs the human
`destructive-migration-reviewed` label (advisory until branch protection requires the
check). **Destructive fencing now covers app code too (PR9 doctrine):** soft-delete/
archive/supersede over hard deletes; a supabase `.delete()`, storage `.remove()`, or
raw destructive SQL string in `apps/`/`packages/` is permitted only with a
`// destructive-allowed: <reason>` annotation on the same/preceding line + explicit
human sign-off in PR review — enforced by the `app-code-scan` job (full-tree scan,
`.github/scripts/scan-destructive-app-code.mjs`) sibling to the migration guard. The
companion doctrine — **failures block during development** (observability/pipeline
failures throw and surface; nothing silently continues) — is stated in the
Observability paragraph above (PR7's `emitEvent`/`writeCallIO` are the implemented
example) and both doctrines are codified in the `devops-overview`,
`database-and-migrations`, and `branch-and-pr-workflow` skills.

**Solo Mine — a one-off interview mode over the rebuild (S0 shipped; S1 stacked).**
A second interview product on the SAME machinery: instant product demos and solo
knowledge workers extracting a personal context document to paste into their AI
tools. `sessions.session_type` ('standard'|'solo') is the behavior switch;
`solo_focus` carries an optional procurement focus. All solo participants are
employee rows under ONE migration-seeded house company (`companies.company_kind=
'solo_house'`, id `solo-house`) — existing tables/RLS/session machinery unchanged,
the house company excluded from client-facing enumerations by that marker
(`employees.archived_at` soft-deletes a participant). **Solo serve is
deterministic** (`packages/db/serve.ts` solo branch, ZERO LLM, holds D9): the
click resolves `interview_system_solo` (the solo SOUL) + `solo_first_message`
through the store with the participant name + focus filled by `composeSoloPrompt`,
and snapshots identically (`served_composed_ids.solo`); `ServeResolution.served`
carries `sessionType`. **Solo sessions never touch mining** and the post-interview
summary/analysis/db trio is SKIPPED — the ONLY post-interview work is the context
document: the export route's solo branch (after the transcript write) runs
`solo_context_doc` (one HIGH `synthesize()` call over ALL the participant's
transcripts via `listEmployeeTranscripts` — a second interview DEEPENS the doc,
never replaces it) and stores `session_outputs.file_type='solo_context_doc'`;
failure is loud (terminal `solo_doc` event + 500). Three registered/seeded/
byte-identical prompt kinds (Prompts-page "Solo Mine" group). Procurement is the
`/solo` admin page (`procureSoloParticipant` — bookkeeping mint under the house
company). **The participant experience + admin roster shipped (S1):** the token
page threads `sessionType` into `InterviewClient` (a solo welcome variant); the
completion screen polls a token-verified `GET /api/interview/[token]/solo-doc`
(refresh-proof) and renders the doc with copy / download-.md (client Blob) /
per-tool paste instruction cards; the `/solo` roster (`loadSoloParticipants` +
`SoloSessionsList`) offers doc access, re-interview (deepens the doc), and
soft-delete (`employees.archived_at`). The house company is excluded from
client-facing enumerations (`clients`/`home`/`mining`/prompts-composition lists
`.neq("id","solo-house")`; the Interviews global list excludes it too; constants
in `admin-platform/lib/solo.ts`). **Returning participants retake from the
link:** a link whose solo session is COMPLETED (`completed_at` stamped) renders
an end-state screen (interview line items + the doc + "Take the interview
again") instead of the welcome screen; the retake is a token-verified
participant mint (`POST /api/interview/[token]/retake` →
`remintSoloSession`/`getSoloReturnState` in `packages/db/src/solo.ts`, awaited
`fn_compose` mint event with `retake:true`, archived participants blocked) and
a fresh pending link ALWAYS opens the start page. The `/solo` roster shows each
instance's own context doc per session line item. **Solo Mine V0 is complete
(S0+S1);** V1+ defers email-the-doc, split demo/context modes, and public
self-serve. Migrations 20260711000001–3 applied to dev, pending prod promotion
(new columns read via untyped casts until types regenerate).

**Apps.** interview-agent (Vercel, :3000), admin-platform (Vercel, :3001; formerly
"kickoff"), context-miner (Vercel, :3002; formerly "miner") — a minimal Next app
exposing one secret-gated triggered HTTP route `POST /api/mine` (runtime nodejs,
`maxDuration` 800) that runs a full A→B→C→knowledge→summaries pass and returns; on-demand trigger now,
nightly cron later. The tsx CLI (`pnpm mine`) still works for local manual runs.
The derivation engine lives in `packages/miner-core`, so the deploy platform is a
property of the entrypoint, not the engine. `pnpm dev:all` runs all three locally.

---

## Standing Rules (Always Apply)

### Supabase CLI — installed, linked, pointed at the right project

- Any session that touches Supabase must first verify `supabase --version`
  works and `supabase projects list` shows the correct project as **LINKED**.
  If the CLI is missing, install via Homebrew (`brew install supabase/tap/supabase`)
  and link before doing other work.
- **Currently-canonical Supabase: project ref `xhudgqbdsvvsjtfmjmor`** (the new
  org's DB — has the context-miner work).
- **The old DB `jfmkvvbaazqgfqdgjprm` is a dormant archive — do NOT write to it.**

### GitHub CLI — installed and authenticated

- Any session that does git work must first verify `gh --version` works and
  `gh auth status` shows authentication for the relevant org. If missing,
  install via Homebrew (`brew install gh`) and prompt the user to run
  `gh auth login` interactively (browser auth).
- Constraints on `gh` usage:
  - **May:** create branches, commit, push, open PRs (`gh pr create`), comment
    on issues, view PRs/issues.
  - **Must NOT:** merge PRs, close PRs without explicit instruction,
    force-push, delete branches, alter repository settings.
  - **Every PR created by Claude Code must be reviewed by a human before merge.**

### Decision log — maintained automatically

Every session that makes a **substantive** architectural, schema, or design
decision MUST append an entry to the **current month's file in `docs/decisions/`**
(e.g. `docs/decisions/2026-06.md`, newest at the bottom) before reporting
completion — NOT to CLAUDE.md. Then distill any durable conclusion up into
"Current state and standing decisions" above. The full append-then-distill
workflow lives in the `logging-and-curation` skill. "Substantive" means: schema
changes, architecture choices, new dependencies, security-related changes. Trivial
bug fixes don't need an entry. Format:

```markdown
### YYYY-MM-DD — <short title>
**Decision:** what was decided
**Alternatives considered:** what was rejected and why
**Reasoning:** why this choice
**Context:** which prompt or session, link to PR if applicable
```

### Security defaults — never skip

- **RLS enabled on every table by default.** New tables get RLS policies in the
  same commit as table creation.
- **Service role keys are server-side only.** Never exposed to the browser.
  Never committed to git.
- **All secrets in `.env.local` or platform env vars.** Never inlined in code.
- **JWT validation on every authenticated API route.** Verify server-side,
  never trust client claims.
- **Pre-commit secret scanning recommended** (note in audit reports if not
  configured).
- **Admin actions write to an `audit.action_logs` table** once the audit schema
  is created.
- **Principle of least privilege:** grants should be minimal. Don't grant ALL
  on schemas to the `anon` role.
- **Soft-delete only; destructive calls are fenced.** Prefer archive/supersede/
  retire over hard deletes; migrations are additive. Any destructive database or
  storage call in app code requires `// destructive-allowed: <reason>` on the
  same/preceding line **plus** human sign-off in PR review (CI: the
  `app-code-scan` job). Never add the annotation to silence the guard.
- **Failures block during development.** Observability and pipeline failures
  THROW and surface; nothing silently continues with unintended behavior
  (implemented example: `emitEvent`/`writeCallIO`, PR7). A deliberate
  best-effort path must still log its failure loudly.

### Schema placement — new tables go in the right PostgreSQL schema

New tables MUST be placed in the appropriate schema from the start, not in
`public`:

| Table kind | Schema |
|---|---|
| Mining-related tables | `mining` — **note:** existing miner tables already in `public` stay there for now; only NEW mining tables get the new schema |
| Prompt templates / versioned prompts | `prompts` |
| Audit logs / admin action history | `audit` |
| Operational data (companies, employees, sessions, briefings, kickoff workflow) | `public` (default) |
| System-managed | `auth`, `storage` — don't touch |

When in doubt, ask before creating a table.

---

## 1. Monorepo layout

```
miine-platform/
├── apps/                 # deployable applications (own Vercel project each)
│   ├── interview-agent/  # voice interview app — Next.js 16 (:3000)
│   ├── admin-platform/   # control center + kickoff workflow — Next.js 16 (:3001)
│   │                     #   (renamed from apps/kickoff, 2026-06-12)
│   └── context-miner/    # minimal Next app — triggered HTTP route POST /api/mine (Vercel) + tsx CLI
├── packages/             # shared libraries, owned by neither app
│   ├── db/               # the data seam: storage layer + row/record types + SQL schema
│   ├── shared/           # Supabase client factories, tenant/RLS helpers, shared utils
│   ├── miner-core/       # context-miner derivation engine (used by miner CLI + admin-platform)
│   └── prompts/          # shared prompt methodology & composition
└── docs/                 # platform specs (authoritative design intent)
```

- **`apps/*`** are deployables; **`packages/*`** are shared libraries.
- Internal packages are named **`@miine/*`** and depended on via **`workspace:*`**.
- **The seam discipline (from the specs):** the Postgres schema, migrations,
  generated types, and the (future) `db.json` contract live **once**, in the
  shared package layer (`packages/db` / `packages/shared`), imported by both
  halves of the pipeline. Never duplicate the schema; never import one app's
  internals from another. One source of truth, consumed by both.

## 2. Package boundaries & dependency direction

- `shared` depends on nothing internal. `db` depends on `shared`. `apps/*`
  depend on packages. **No cycles.**
- If logic is needed by more than one app, promote it into a package rather than
  importing across an app boundary.
- `packages/db` is the only place that talks to the database. Apps call the
  storage layer (`@miine/db`); they don't hand-roll Supabase queries.

## 3. Workspace mechanics

- **pnpm workspaces.** Packages export TypeScript source directly; Next apps
  compile them via `transpilePackages` (in `next.config.ts`) + matching
  `tsconfig` `paths` — **no separate build step** for internal packages.
- Run everything from the repo root:
  - `pnpm dev` / `pnpm build` / `pnpm start` / `pnpm lint` (filtered to the app)
  - CLI: `pnpm --filter @miine/interview-agent cli <args>` (args forward after the script)
- A new app/package: add it under `apps/` or `packages/`, name it `@miine/*`,
  wire `workspace:*` deps, add it to the consumer's `transpilePackages` +
  `tsconfig.paths`, then `pnpm install`.

## 4. Tech stack (keep consistent across apps)

- **Next.js 16** App Router, **React 19**, **TypeScript strict**.
- **Tailwind v4 + shadcn/ui** (radix-ui, lucide icons).
- **Supabase** (Postgres + Storage) for persistence, with a filesystem fallback
  when Supabase env is unset.
- **Anthropic Claude** for all LLM synthesis.
- **Read env lazily** — inside request handlers / functions, never at module
  top-level — so builds and imports don't require secrets.

## 5. Data & schema discipline (from the context-mining spec)

- **Provenance is mandatory.** Raw rows carry `interview_id`, `employee_id`,
  `round`. Canonical rows carry `source_claim_ids` tracing back to raw.
- **Raw is append-only and round-tagged.** Canonical is **recomputed from the
  full raw corpus each round** — never derived from prior canonical output.
- **Canonical history is retained** (trigger-based `*_history` tables) so any
  round's worldview is reconstructable.
- Migrations live in **`supabase/migrations/`** (the single canonical home, applied
  via `supabase db push`). Generated types live in `packages/db/src/database.types.ts`
  — regenerate from the live schema with `supabase gen types`; don't hand-edit them.
  The one-time `set_app_context` RPC stays at `packages/db/sql/set-app-context.sql`.

## 6. Decision protocol — doneness tags (applies to all spec-driven work)

Specs in `docs/` tag decisions. Respect the tags:

- **[LOCKED]** — a constraint. Implement as written.
- **[OPEN-BLOCKING]** — resolve with Todd **before** writing dependent code.
  Ask, don't assume.
- **[OPEN-EXPLORATORY]** — surface 2–4 options for Todd to choose. Do not pick
  one yourself.
- **Untagged** — treat as **[OPEN-BLOCKING]**: ask first.

Do not treat unmarked structure (headers, DDL, prose) as license to expand scope.

## 7. Working discipline

- **Behavior-preserving refactors stay behavior-preserving:** no feature creep,
  no schema changes, no incidental dependency churn.
- **Gate-driven execution:** for multi-step / multi-prompt work, stop at the
  defined boundary and report — do not auto-advance to the next step.
- **Build in vertical slices**, each testable in isolation; don't jump ahead to
  deferred items.
- **`docs/` is authoritative** for design intent; update the relevant spec (and
  `docs/interview-agent-spec.md` for as-built behavior) when behavior changes.

## 8. Env file convention

Every app under `apps/` follows the same layout:

```
apps/<app>/
├── .env.local       ← actual values, gitignored, never committed
├── .env.example     ← committed template: every var the app reads, placeholder
│                      values, a comment per var (what it does, where to get it)
└── .env.production  ← OPTIONAL, gitignored — only if values differ from
                       .env.local (we use a single canonical DB, so usually
                       unnecessary)
```

- **Supabase URL in every app's `.env.local` is the canonical project**
  (`https://xhudgqbdsvvsjtfmjmor.supabase.co` — see Standing Rules). Never the
  old archive project.
- **Keep `.env.example` in sync**: when an app gains/loses an env var, update
  its `.env.example` in the same commit. No real secrets in examples, ever.
- The root `.gitignore` ignores `.env*` and un-ignores `.env.example` — only
  example templates are tracked.
- **Deployed apps** get their values via per-app Vercel env vars (same
  canonical Supabase URL; service-role key server-side only, never
  `NEXT_PUBLIC_*`). Vercel changes are made by Todd in the dashboard with
  intentional review — not from agent sessions.
- `apps/context-miner` is a CLI, not a deployable: its scripts load
  `apps/context-miner/.env.local` first and fall back per-variable to
  `apps/interview-agent/.env.local`.

## 9. Deployment

- Each app deploys as its **own Vercel project**. Set the project's **Root
  Directory to `apps/<app>`** (e.g. `apps/interview-agent`) so `process.cwd()`
  resolves the app's runtime `prompts/` and `data/` directories, and so env vars
  are read from the app.
- Apps share one Supabase project; each app supplies its own integration env
  vars (e.g. ElevenLabs, Anthropic, OAuth) as needed.

---

## Index / where to find things

- **Current truths & rules (this file):** "Environments and workflow (read first)",
  "Current state and standing decisions", "Standing Rules", and the numbered
  conventions (§1–§9).
- **Decision log (chronological, per-PR):** `docs/decisions/` — per-month files +
  [`docs/decisions/README.md`](docs/decisions/README.md) index. `merge=union`
  applies here (do `dev`-integration merges locally).
- **Auto-loading DevOps skills** (`.claude/skills/`; root `skills/` symlinks here):
  - `branch-and-pr-workflow` — branches, PRs, stacking, `dev`→`main` promotion.
  - `environments-and-env-vars` — the variable→scope reference.
  - `database-and-migrations` — migration safety + Supabase IDs/connection.
  - `staging-verification` — the environment-isolation runbook.
  - `resume-cold-handoff` — delta-load when picking up cold.
  - `logging-and-curation` — append a decision entry + distill durable truths up.
  - `devops-overview` — the map of the above.
- **Reference docs (`docs/`):** specs (`miine-context-mining-spec.md`,
  `interview-agent-spec.md`, `miine-control-center-kickoff-spec-v0.md`),
  `db-architecture-v1.md`, audits (`miner-audit.md`, `rls-audit.md`), pipeline
  (`pipeline-trace.md` / `.html`), UX snapshots under `docs/ux/`.
