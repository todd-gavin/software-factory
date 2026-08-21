#!/usr/bin/env bash
#
# check-drift.sh — report where software-factory/reference/ has fallen behind the
# live files it was copied from.
#
# The reference copies exist so a reader can see how this repo actually filled in
# each template. That value decays as the live files change. This script names the
# drift; it never writes.
#
# Deliberately NOT wired into CI: adding a required check would change how this
# repo operates, which the kit's extraction was explicitly not supposed to do.
# Run it by hand, or before copying the kit into another project.
#
#   ./software-factory/check-drift.sh
#
# Exit 0 = in sync, 1 = drift found (or a source file is missing).

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

drift=0
missing=0

# reference path <-> live path
pairs=(
  "software-factory/reference/CLAUDE.md|CLAUDE.md"
  "software-factory/reference/gitattributes|.gitattributes"
  "software-factory/reference/docs/decisions/README.md|docs/decisions/README.md"
  "software-factory/reference/claude/skills/README.md|.claude/skills/README.md"
)

for f in software-factory/reference/claude/commands/*.md; do
  pairs+=("$f|.claude/commands/$(basename "$f")")
done

for f in software-factory/reference/claude/skills/*/SKILL.md; do
  name="$(basename "$(dirname "$f")")"
  pairs+=("$f|.claude/skills/$name/SKILL.md")
done

for pair in "${pairs[@]}"; do
  ref="${pair%%|*}"
  live="${pair##*|}"

  if [ ! -f "$live" ]; then
    echo "MISSING LIVE: $live (reference exists at $ref)"
    missing=1
    continue
  fi
  if [ ! -f "$ref" ]; then
    echo "MISSING REF:  $ref"
    missing=1
    continue
  fi
  if ! diff -q "$ref" "$live" >/dev/null 2>&1; then
    echo "DRIFT: $live"
    echo "       $(diff "$ref" "$live" | grep -c '^[<>]') changed lines vs $ref"
    drift=1
  fi
done

# HANDOFF is a deliberate excerpt, not a full copy — never compared.
echo ""
echo "note: reference/docs/HANDOFF.md is a deliberate 3-entry excerpt; not compared."

if [ "$drift" -eq 0 ] && [ "$missing" -eq 0 ]; then
  echo "✓ reference/ is in sync with the live harness files."
  exit 0
fi

echo ""
echo "To refresh a reference copy, re-copy the live file over it and commit."
exit 1
