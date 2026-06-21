# Subagent Contract

The main agent owns final decisions, synthesis, edits, verification, commits, posted comments, and handoff.

Use subagents only when the work is bounded and independent enough that delegation improves evidence quality, review quality, or throughput without hiding ownership.

## Roles

- **Explorer:** read-only evidence gathering. Reports facts and uncertainty; does not recommend unless asked.
- **Critic:** read-only pressure test from one lens. Attacks a proposal; does not rewrite it.
- **Designer:** produces one alternative under one constraint. The main agent chooses or rejects it.
- **Worker:** edits one bounded file set. Must respect explicit file ownership.
- **Validator:** accepts or rejects one claim, finding, or patch. Does not invent new work.

## Prompt Contract

Every subagent prompt must include:

- role
- inputs
- scope
- forbidden actions
- expected output shape
- evidence or confidence requirement
- stop condition

Worker prompts must also include:

- files the worker may edit
- files the worker may read
- files or directories the worker must not edit
- verification command or proof expectation
- final changed-file list

## Portability

Describe subagent work by role, not by a vendor-specific tool call.

- Claude Code: use the available Agent/Task mechanism or a project subagent.
- Codex: use the available subagent/spawn mechanism.
- Fallback: perform the role locally and state that parallel subagents were unavailable.

Subagents do not own architecture changes. If delegated work invalidates the plan, the main agent stops and escalates to the owning workflow phase.
