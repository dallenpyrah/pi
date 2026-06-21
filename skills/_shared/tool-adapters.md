# Tool Adapters

Workflow skills must be portable across Claude Code and Codex.

Do not require a specific tool name in the workflow contract. Use capability names:

- repo search
- structural search
- package source inspection
- official docs lookup
- web search
- GitHub issue/PR access
- read-only explorer subagent
- bounded worker subagent
- validator subagent

When a host-specific tool exists, use it. When it does not, use the closest local equivalent and state the gap.

## Skill Locations

Canonical authoring lives in `skills/`.

Generated runtime copies live in:

- `.agents/skills/` for Codex repo skill discovery
- `.claude/skills/` for Claude Code project skill discovery
- `~/.agents/skills/` for Codex user skill discovery
- `~/.claude/skills/` for Claude Code user skill discovery
- `~/.codex/skills/` for legacy Codex user skill discovery

Run `bun sync.ts` from the repo root after editing canonical skills. It deletes and replaces every generated user skill directory above. It preserves Codex-managed `~/.codex/skills/.system`. Do not hand-edit generated runtime copies.
