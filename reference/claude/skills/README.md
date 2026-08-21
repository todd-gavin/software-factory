# DevOps skills

Claude Code auto-discovers project skills at **`.claude/skills/<name>/SKILL.md`**,
so the real skills live here and auto-load when an agent's task matches a skill's
`description`. The repo-root **`skills/`** is a symlink to this directory (for
browsing); the auto-trigger comes from `.claude/skills/`.

These were converted from the former `docs/devops/` (single source of truth now
lives in the skills). Each `SKILL.md` has YAML frontmatter (`name`, `description`)
— the `description` is the trigger.

| Skill | Triggers when you are… |
|---|---|
| `branch-and-pr-workflow` | creating a branch, opening/merging a PR, promoting to prod |
| `environments-and-env-vars` | setting/reading env vars, deployments, which DB/keys |
| `database-and-migrations` | writing/applying a migration, touching the DB, reseeding |
| `staging-verification` | verifying environment isolation / that staging works |
| `resume-cold-handoff` | picking up work cold / resuming (delta-loads only what changed since your last commit) |
| `logging-and-curation` | finishing a PR / writing a decision entry / updating CLAUDE.md |
| `devops-overview` | needing the big picture / a task spanning several of the above |

This `README.md` is not a skill (skill discovery only reads `<name>/SKILL.md`
folders).
