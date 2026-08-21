#!/usr/bin/env node
// Scan APP CODE (apps/ + packages/) for destructive database/storage patterns
// that lack a `// destructive-allowed: <reason>` annotation. Sibling to
// scan-destructive-sql.sh, which covers supabase/migrations SQL — the two scopes
// are deliberately disjoint (this scanner never looks at supabase/, .github/,
// scripts/, or docs/). Runs standalone and dependency-light so it can be
// executed locally from the repo root:
//
//   node .github/scripts/scan-destructive-app-code.mjs
//
// Exit 1 (printing every finding as file:line + snippet) if any destructive
// pattern is unannotated; exit 0 otherwise. Used by the `app-code-scan` job in
// .github/workflows/destructive-migration-check.yml. Protocol + doctrine:
// .claude/skills/database-and-migrations → "App-code destructive-call guard".
//
// PATTERNS (each verified against the full current tree for zero false
// positives — see PR #102's inventory):
//   1. Supabase table delete: `.delete()` with empty parens or an options
//      object (`.delete({`). JS Map/Set/WeakMap `.delete(key)` always carries a
//      non-`{` argument and never matches. Matches mid-chain continuation lines
//      (`.delete()` alone on its line).
//   2. Storage remove: `.remove(<arg>)` with a non-empty argument (supabase
//      storage removes take a paths array). An argless DOM `el.remove()` never
//      matches. If UI code ever adds `classList.remove("x")`, refine this
//      pattern rather than adding a meaningless annotation.
//   3. Raw destructive SQL in code strings: DELETE FROM, DROP TABLE/SCHEMA/
//      COLUMN (case-insensitive), TRUNCATE TABLE/ONLY (case-insensitive) plus
//      bare TRUNCATE (case-SENSITIVE, word-bounded: lowercase `truncate` is
//      Tailwind/helper vocabulary throughout the tree, and the `\b` excludes
//      "TRUNCATED" in telemetry strings).
//
// ANNOTATION RULE (LOCKED): a destructive call is permitted ONLY when its line
// or the immediately preceding line carries `// destructive-allowed: <reason>`
// with a non-empty reason. Every annotation is a human-review surface: adding
// one requires explicit sign-off in PR review. The agent must never add an
// annotation to silence the guard without that review.
//
// Precision limits (documented, acceptable for a tripwire): line comments are
// stripped with a quote-aware scan (a `//` inside a string, e.g. a URL, is not
// treated as a comment); block comments are tracked line-by-line. A /* marker
// inside a string literal could confuse the tracker — none exist in the tree,
// and a miss here fails LOUD (false positive), never silent.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["apps", "packages"];
const EXTS = [".ts", ".tsx", ".js", ".mjs", ".cjs"];
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".turbo", ".vercel"]);

const ANNOTATION = /\/\/\s*destructive-allowed:\s*\S/;

const PATTERNS = [
  {
    re: /\.delete\(\s*[){]/,
    desc: "supabase table .delete()",
  },
  {
    re: /\.remove\(\s*\S/,
    desc: "storage .remove(paths)",
  },
  {
    re: /\bdelete\s+from\s/i,
    desc: "raw SQL DELETE FROM in a code string",
  },
  {
    re: /\bdrop\s+(table|schema|column)\s/i,
    desc: "raw SQL DROP TABLE/SCHEMA/COLUMN in a code string",
  },
  {
    re: /\btruncate\s+(table|only)\s/i,
    desc: "raw SQL TRUNCATE in a code string",
  },
  {
    re: /\bTRUNCATE\b/,
    desc: "raw SQL TRUNCATE in a code string",
  },
];

function listFiles(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) listFiles(join(dir, e.name), out);
    } else if (
      EXTS.some((ext) => e.name.endsWith(ext)) &&
      !e.name.endsWith(".generated.ts")
    ) {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

// Strip the trailing `// …` comment from a line, ignoring `//` inside ' " `
// strings (so URLs never truncate the scannable code). Returns the code part.
function stripLineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === "\\") i++; // skip escaped char inside a string
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === "`") {
      quote = c;
    } else if (c === "/" && line[i + 1] === "/") {
      return line.slice(0, i);
    }
  }
  return line;
}

const violations = [];
let annotatedAllowed = 0;

for (const root of ROOTS) {
  for (const file of listFiles(root, [])) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];

      // crude block-comment tracking: skip lines wholly inside /* … */
      let code = raw;
      if (inBlockComment) {
        const end = code.indexOf("*/");
        if (end === -1) continue;
        code = code.slice(end + 2);
        inBlockComment = false;
      }
      // remove inline /* … */ spans; detect an unclosed opener
      code = code.replace(/\/\*[\s\S]*?\*\//g, " ");
      const opener = code.indexOf("/*");
      if (opener !== -1) {
        code = code.slice(0, opener);
        inBlockComment = true;
      }
      code = stripLineComment(code);
      if (!code.trim()) continue;

      const hit = PATTERNS.find((p) => p.re.test(code));
      if (!hit) continue;

      const annotated =
        ANNOTATION.test(raw) || (i > 0 && ANNOTATION.test(lines[i - 1]));
      if (annotated) {
        annotatedAllowed++;
      } else {
        const posix = file.split("\\").join("/");
        violations.push({ file: posix, line: i + 1, desc: hit.desc, snippet: raw.trim() });
      }
    }
  }
}

if (violations.length === 0) {
  console.log(
    `✓ No unannotated destructive database/storage calls in app code ` +
      `(${annotatedAllowed} annotated site(s) allowed).`
  );
  process.exit(0);
}

console.log("⚠ Unannotated destructive database/storage calls detected in app code:\n");
for (const v of violations) {
  console.log(`  ✗ ${v.file}:${v.line} — ${v.desc}`);
  console.log(`        • ${v.snippet}`);
}
console.log(`
✗ ${violations.length} destructive call(s) lack the required annotation.
  A destructive database/storage call is permitted only when its line, or the
  immediately preceding line, carries an explicit annotation with a reason:

      // destructive-allowed: <reason>

  Adding an annotation requires human sign-off in PR review — do not annotate
  to silence the guard. Prefer soft-delete / archive / supersede patterns; see
  the database-and-migrations skill → "App-code destructive-call guard".`);
process.exit(1);
