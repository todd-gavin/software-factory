---
description: Read-only dashboard of this repo's Claude Code tooling — lists all custom slash commands (explicit, you type them) and all skills (automatic, they auto-load when a prompt matches), each with its purpose and how it's invoked/triggered. Ephemeral lister: prints to the chat, writes no file.
allowed-tools: Bash
---

You are printing a **read-only tooling dashboard** for this repo's Claude Code
setup. It is an ephemeral session lister: **print the result to the chat, do NOT
write any file, do NOT modify/score/flag anything** — just list and summarize.

## Enumerated fresh at invocation (do NOT hardcode — use exactly what's below)

Custom slash commands (`.claude/commands/*.md`), with their frontmatter:
!`for f in $(find .claude/commands -maxdepth 1 -name '*.md' 2>/dev/null | sort); do echo "### $f"; awk '/^---/{c++;next} c==1{print} c>=2{exit}' "$f"; echo; done`

Skills (`.claude/skills/*/SKILL.md`), with their frontmatter:
!`for d in $(find .claude/skills -maxdepth 2 -name 'SKILL.md' 2>/dev/null | sort); do echo "### $d"; awk '/^---/{c++;next} c==1{print} c>=2{exit}' "$d"; echo; done`

## Print exactly this shape

Open with one line explaining the distinction:
> **Commands** are explicit — you type `/name`. **Skills** are automatic — they
> load themselves when your prompt matches their description.

Then two sections, built ONLY from the enumerated frontmatter above (if a section
has no entries, say "(none)"):

### Slash commands (explicit — you type them)
For each command file, a row: **`/<name>`** — one-line purpose (distilled from its
`description`). The `<name>` is the filename without `.md`.

### Skills (automatic — auto-load when a prompt matches)
For each skill, a row: **`<name>`** — one-line purpose, then a short
"*Triggers when:* …" drawn from its `description` (the key situations/phrases that
should auto-load it). Keep each to ~1–2 lines.

Close with one line: skills auto-load on a best-effort recognition match —
**reliable, not guaranteed** — so if one doesn't fire, name it or its topic
explicitly. Then stop (nothing is written).
