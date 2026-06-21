# Dallen's Pi setup

This repo is my shareable Pi setup: global configs, skills, prompts, themes, and small extensions.

## Use as a Pi package

```bash
pi install git:https://github.com/dallenpyrah/pi.git
```

That loads the package resources declared in `package.json`:

- `extensions/fff-defaults.ts`
- every skill in `skills/`
- prompt templates in `prompts/`
- themes in `themes/`

## Restore my full local setup

```bash
git clone https://github.com/dallenpyrah/pi.git ~/projects/pi
cd ~/projects/pi
bun run install:local
```

`install:local` copies the snapshot into `~/.pi/agent` and `~/.agents`. It does not copy secrets and does not delete existing local files.

## Refresh this repo from my machine

```bash
cd ~/projects/pi
bun run sync
bun run verify
```

`sync` copies the allowed parts of my current setup into the repo and deletes stale files inside the managed resource directories.

## Layout

| Path | Purpose |
| --- | --- |
| `configs/pi-agent/` | Snapshot of safe `~/.pi/agent` config files. |
| `configs/agents/` | Snapshot of safe `~/.agents` metadata. |
| `extensions/` | Active and supporting Pi extension files. Only `fff-defaults.ts` is loaded by this package manifest. |
| `skills/` | Active shared skills from `~/.agents/skills` plus dereferenced global Pi skills. |
| `prompts/` | Prompt templates. |
| `themes/` | Custom themes. |
| `scripts/` | Sync, install, and verification helpers. |

## Catalog

### Installed packages and extensions

| Extension/package | Source | Why it is here / what it is for |
| --- | --- | --- |
| FFF Search | `npm:@ff-labs/pi-fff` | Replaces file/content search with FFF-backed ranked search, multi-grep, and `@` autocomplete for faster repo discovery. |
| Context Mode | `npm:context-mode` | Adds sandbox execution, file/output indexing, FTS search, fetch-and-index, and diagnostics so large logs/docs/test output do not flood chat context. |
| Pi Subagents | `npm:pi-subagents` | Runs delegated child agents, chains, parallel fan-out, async status checks, and optional worktree isolation for review and broad analysis. |
| Goal Mode | `npm:@narumitw/pi-goal` | Adds `/goal` and `goal_complete` so long tasks keep moving until verified completion. |
| Computer Use | `npm:@amaster.ai/pi-computer-use` | Adds desktop automation tools for local GUI actions outside browser automation. |
| Agent Browser Native | `npm:pi-agent-browser-native` | Adds `agent_browser` for browser workflows, web QA, screenshots, extraction, login flows, and Electron app automation. |
| Dynamic Workflows | `npm:@quintinshaw/pi-dynamic-workflows` | Adds the `workflow` tool for deterministic JavaScript-orchestrated multi-agent fan-out/fan-in. |
| MCP Adapter | `npm:pi-mcp-adapter` | Adds a single `mcp` gateway for discovering and calling MCP server tools without loading every schema into the prompt. |
| Plannotator | `npm:@plannotator/pi-extension` | Adds browser-based markdown plan review, annotation, and approval flows for human feedback before implementation. |
| Amp themes/UI | `npm:amp-themes` with `amp-appearance`, `amp-editor`, `amp-user-message` | Provides the `amp-dark` theme plus Amp-style appearance switching, editor chrome, and compact user-message rendering. |
| Structured questions | `npm:@juicesharp/rpiv-ask-user-question` | Adds `ask_user_question` for structured clarification when requirements are ambiguous. |
| AST search/replace | `npm:pi-diet-ast` | Adds `ast_grep_search` and dry-run-first `ast_grep_replace` for syntax-aware code discovery and codemods. |
| Hashline edit | `npm:pi-hashline-edit` | Replaces plain edits with hash-anchored reads/edits so stale-context mutations are rejected. |
| Tmux Bash | `npm:@richardgill/pi-tmux-bash` | Runs shell commands in tmux windows with stable IDs, background polling, and inspection controls for long-running commands. |
| OpenAI Fast Mode | `npm:pi-openai-fast-mode` | Adds `/fast` and `--fast` priority-tier toggles for configured GPT-5.4/5.5 OpenAI targets. |
| Exa web research | `git:https://github.com/dallenpyrah/pi-exa.git` | Adds native Exa tools for live web search, sourced answers, content extraction, similar pages, code/company/people lookup, and deep research. |
| Semantic Search | `git:https://github.com/dallenpyrah/pi-semantic-search.git` | Adds `semantic_search` for hybrid code, history, and conversation search as the first-pass codebase discovery layer. |
| FFF defaults | `extensions/fff-defaults.ts` | Local extension that sets FFF mode and injects guidance to prefer FFF and AST search before raw shell search. |

### Skills

| Skill | Why it is here / what it is for |
| --- | --- |
| `address` | Executes PR review-comment triage and fixes, including pushback/escalation rules and check follow-up. |
| `agent-browser` | Drives real browser workflows for websites, QA, screenshots, scraping, login flows, and Electron apps. |
| `architect` | Re-derives clean architecture from first principles before implementation. |
| `ask-matt` | Routes ambiguous requests to the right Matt-style workflow or skill. |
| `code-review` | Runs focused multi-persona PR review across correctness, tests, maintainability, standards, security, and prior findings. |
| `code-search` | Finds code, docs, and symbols by meaning instead of scattered grep/read loops. |
| `codebase-design` | Provides deep-module vocabulary for API seams, testability, and AI-navigable architecture. |
| `decision-mapping` | Captures decision context, options, tradeoffs, and rationale. |
| `design-an-interface` | Explores multiple radically different API/interface designs before choosing a module shape. |
| `diagnosing-bugs` | Runs a disciplined diagnosis loop for broken, throwing, failing, or slow behavior. |
| `domain-modeling` | Sharpens domain language, terms, contexts, and architectural decisions. |
| `edit-article` | Tightens and restructures article drafts. |
| `effect-ts` | Keeps Effect-TS service, layer, runtime, error, and Next.js patterns close at hand. |
| `emil-design-eng` | Applies Emil Kowalski-style UI polish, component, and animation judgment. |
| `find-docs` | Retrieves current docs/API references instead of relying on stale model memory. |
| `git-guardrails-claude-code` | Sets up hooks that block dangerous git operations in Claude Code. |
| `grill-me` | Stress-tests plans with sharp questions before building. |
| `grill-with-docs` | Stress-tests plans while grounding the critique in referenced docs. |
| `grilling` | Interviews hard on assumptions, constraints, incentives, and failure modes. |
| `handoff` | Produces concise handoff context when work needs to continue elsewhere. |
| `implement` | Executes a locked plan into concrete code changes. |
| `improve-architecture` | Finds refactoring opportunities that deepen shallow modules and improve testability. |
| `improve-codebase-architecture` | Produces broader codebase architecture improvement analysis and reports. |
| `interview` | Runs structured five-question rounds until problem, values, constraints, and solution direction are clear. |
| `issue` | Turns locked architecture into a high-quality GitHub issue/epic. |
| `learn` | Captures post-cycle learnings from issues, PRs, reviews, commits, and final diffs. |
| `merge` | Safely merges a PR after learning capture, clean tree, pushed head, and passing checks. |
| `migrate-to-shoehorn` | Replaces test `as` assertions with `@total-typescript/shoehorn` partial fixtures. |
| `obsidian-vault` | Searches, creates, and organizes notes in the Obsidian vault. |
| `pr` | Opens pull requests with the preferred concise body and ASCII flow. |
| `prototype` | Builds throwaway prototypes with clear UI/logic boundaries and runnable commands. |
| `qa` | Runs conversational QA intake and files GitHub issues for found bugs. |
| `request-refactor-plan` | Interviews toward a tiny-commit refactor plan and files it as an issue. |
| `resolving-merge-conflicts` | Guides safe resolution of in-progress merge or rebase conflicts. |
| `review` | Reviews work since a fixed point against repo standards and the originating spec. |
| `scaffold-exercises` | Creates exercise sections, problems, solutions, and explainers that pass linting. |
| `scout` | Grounds unfamiliar libraries, modules, APIs, services, or repo areas before deeper planning. |
| `setup-matt-pocock-skills` | Sets up issue tracker, triage labels, and domain docs for Matt-style engineering skills. |
| `setup-pre-commit` | Adds Husky/lint-staged/typecheck/test pre-commit automation. |
| `tdd` | Runs red-green-refactor for features, fixes, and integration-test work. |
| `teach` | Teaches a concept or skill inside the workspace with durable learning records. |
| `test` | Audits changed work, derives missing edge cases, adds tests, and verifies tightly. |
| `to-issues` | Breaks a plan or PRD into implementable GitHub issues. |
| `to-prd` | Converts discovery or plans into a product requirements document. |
| `triage` | Sorts incoming work by scope, labels, routing, and next action. |
| `ubiquitous-language` | Maintains consistent domain vocabulary across docs, issues, and code. |
| `work` | Implements a GitHub issue on the current branch with commits referencing the issue. |
| `writing-beats` | Builds articles beat-by-beat from raw material. |
| `writing-fragments` | Mines raw writing fragments for later article shaping. |
| `writing-great-skills` | Captures principles and vocabulary for designing useful skills. |
| `writing-shape` | Turns markdown notes or drafts into a publishable article through iterative shaping. |

### Prompt templates

No prompt templates are currently checked in. `prompts/` is ready for future slash-command templates.
