import { Effect } from "effect";

export default function fffDefaults(pi: any) {
  process.env.PI_FFF_MODE = process.env.PI_FFF_MODE || "override";

  const guidance = `

Search and code-structure defaults:
- FFF is the default repository search layer.
- Use FFF-backed find/grep, or fffind/ffgrep when those names are active, before bash rg/ls/find for repo exploration.
- Use ast_grep_search before grep for syntax-shaped questions: calls, imports, exports, functions, classes, object patterns, decorators, catch blocks, Effect pipelines, control flow, or other code structure.
- Use ast_grep_search presets when possible: mode calls/name, imports/module, functions/name, classes/name, or exports/name; use mode pattern only for custom ast-grep shapes.
- Use ast_grep_replace for structural replacements. Keep the default dry run first; set apply:true only after confirming the preview matches the intended code shape.
- If generic tool guidance mentions LSP or Semble but those tools are not available in this session, do not wait for them; use ast_grep_search for structural code and FFF-backed grep for literals.
- Use grep for exact literals, strings, identifiers, verification, and fallback after ast-grep or FFF cannot express the query.
- Use bash with rg/find/ls/sg only for shell pipelines, exact command output, fallback after tool limitations, or diagnosing search tooling itself.
- After one or two FFF or ast-grep searches, read the most relevant file instead of continuing broad search.
`;

  function applyGuidance(systemPrompt: string) {
    let next = systemPrompt
      .replace(
        /- Use bash for file operations like ls, rg, find\n/g,
        "- Prefer FFF-backed find/grep, or fffind/ffgrep when those names are active, for repository file discovery and content search. Use bash with rg/ls/find only when shell-specific behavior, exact command output, fallback, or search-tool diagnosis is required.\n",
      )
      .replace(
        /- Use `rg` \/ `rg --files` for repo search\. /g,
        "- Prefer FFF-backed find/grep, or fffind/ffgrep when those names are active, for repo search. Use `rg` / `rg --files` only when FFF cannot express the query, exact shell output is required, or diagnosing search tooling itself. ",
      );

    if (!next.includes("Search and code-structure defaults:")) {
      next += guidance;
    }

    return next;
  }

  pi.on("before_agent_start", (event: any) =>
    Effect.runSync(Effect.succeed({ systemPrompt: applyGuidance(event.systemPrompt) }))
  );
}
