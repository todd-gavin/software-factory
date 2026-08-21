#!/usr/bin/env bash
#
# Scan SQL (read from stdin) for genuinely data-destructive operations.
#
#   <sql on stdin> | scan-destructive-sql.sh [display-name]
#
# Exit 1 (and print findings) if any destructive operation is found; else exit 0.
# Used by .github/workflows/destructive-migration-check.yml on the ADDED lines of
# changed supabase/migrations files. Standalone + dependency-light so it can be
# unit-tested locally: `printf 'DROP TABLE x;' | scan-destructive-sql.sh`.
#
# Precision by design (low false positives):
#   • Flags ONLY: DROP TABLE, DROP SCHEMA, DROP COLUMN (ALTER TABLE … DROP COLUMN),
#     DELETE FROM, TRUNCATE.
#   • Does NOT flag DROP INDEX / DROP POLICY / DROP TRIGGER / DROP CONSTRAINT /
#     DROP FUNCTION, nor "DELETE" inside ON DELETE CASCADE / FOR DELETE — the
#     patterns are specific (require the destructive keyword pair + a following
#     token), so recreate patterns and FK clauses don't match.
#   • Comments are stripped first, so prose like `-- delete the old rows` or a
#     `/* DROP TABLE … */` note never triggers the gate.

set -euo pipefail

name="${1:-<stdin>}"
sql="$(cat || true)"

# 1. strip block comments /* … */ (possibly multi-line), then line comments -- …
# 2. join lines + collapse whitespace so multi-line statements still match
clean="$(
  printf '%s' "$sql" \
    | perl -0777 -pe 's{/\*.*?\*/}{ }gs' \
    | sed -E 's/--.*$//' \
    | tr '\n' ' ' \
    | tr -s ' '
)"

# pattern|||human description. Each pattern requires a trailing token so
# `drop table_name` (an identifier) does NOT match `DROP TABLE`.
checks=(
  'drop[[:space:]]+table[[:space:]]|||DROP TABLE — drops a table and ALL its rows'
  'drop[[:space:]]+schema[[:space:]]|||DROP SCHEMA — drops a schema and its objects'
  'drop[[:space:]]+column[[:space:]]|||DROP COLUMN — drops a column and its data'
  'delete[[:space:]]+from[[:space:]]|||DELETE FROM — deletes rows'
  'truncate[[:space:]]|||TRUNCATE — empties a table'
)

found=0
for entry in "${checks[@]}"; do
  pat="${entry%%|||*}"
  desc="${entry##*|||}"
  if printf '%s' "$clean" | grep -iqE "$pat"; then
    found=1
    echo "  ✗ ${name}: ${desc}"
    # show the offending statement(s), up to the next ';', max 5
    printf '%s' "$clean" \
      | grep -ioE "${pat}[^;]*" \
      | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
      | head -5 \
      | sed 's/^/        • /'
  fi
done

exit "$found"
