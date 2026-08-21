# Skills

Claude Code auto-discovers project skills at **`.claude/skills/<name>/SKILL.md`**,
so the real skills live here and auto-load when an agent's task matches a skill's
`description`. The repo-root **`skills/`** symlink points here for browsing; the
auto-trigger comes from `.claude/skills/`.

Each `SKILL.md` has YAML frontmatter (`name`, `description`) — **the `description`
is the trigger.** Write it as a list of the situations and literal phrases that
should load the skill, not as a summary of its contents.

| Skill | Triggers when you are… |
|---|---|
| `branch-and-pr-workflow` | creating a branch, opening/merging a PR, promoting to prod |
| `environments-and-env-vars` | setting/reading env vars, deployments, which DB/keys |
| `database-and-migrations` | writing/applying a migration, touching the DB, reseeding |
| `staging-verification` | verifying environment isolation / that staging works |
| `resume-cold-handoff` | picking up work cold / resuming (delta-loads only the changes) |
| `logging-and-curation` | finishing a PR / writing a decision entry / updating CLAUDE.md |
| `devops-overview` | needing the big picture / a task spanning several of the above |

This `README.md` is not a skill (discovery only reads `<name>/SKILL.md` folders).

Skills auto-load on a best-effort recognition match — **reliable, not
guaranteed.** If one doesn't fire, name it or its topic explicitly.
