# Global pi agent instructions

- Prefer FFF-powered search for repository exploration by default.
- Use `fffind` or FFF-backed `find` as the first step for file/path discovery.
- Use `ffgrep` or FFF-backed `grep` as the first step for content search when the query is literal text, strings, identifiers, or verification.
- Use `ast_grep_search` before grep for syntax-shaped questions: calls, imports, exports, functions, classes, object patterns, decorators, catch blocks, Effect pipelines, control flow, or other code structure.
- Prefer `ast_grep_search` presets over custom patterns when possible: `mode: "calls"` with `name`, `mode: "imports"` with `module`, `mode: "functions"`/`"classes"`/`"exports"` with `name`.
- Use `ast_grep_replace` for structural replacements. Keep the default dry run first; pass `apply: true` only after confirming the preview matches the intended code shape.
- If generic tool guidance mentions LSP or Semble but those tools are not available in the session, do not wait for them; use `ast_grep_search` for structural code and FFF-backed `grep` for literals.
- Use `bash` with `rg`, `find`, `ls`, or `sg` only when FFF/ast-grep cannot express the query, exact shell command output is required, shell composition is needed, or diagnosing search tooling itself.
- After one or two FFF or ast-grep searches, read the most relevant file instead of continuing to search broadly.

