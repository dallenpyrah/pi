# Dallen's Pi setup

This repo is my shareable Pi setup: global configs, skills, prompts, themes, and small extensions.

## Use as a Pi package

```bash
pi install git:https://github.com/dallenpyrah/pi.git
```

That loads the package resources declared in `package.json`:

- `extensions/amp-startup-screen.ts` — an animated, Amp-style "Welcome to Pi" startup screen (dot-matrix shimmer)
- the `amp-dark` theme plus Amp-style appearance/editor/user-message extensions from the `amp-themes` package
- every skill in `skills/`
- pi-web's bundled memory skill
- prompt templates in `prompts/`
- themes in `themes/`

## Restore my full local setup

```bash
git clone https://github.com/dallenpyrah/pi.git ~/projects/pi
cd ~/projects/pi
bun run install:local
```

`install:local` copies the snapshot into `~/.pi/agent` and `~/.agents`, installs pi-web through Pi when `pi` is on `PATH`, and disables opencode-web auto-start entries. It does not copy secrets and does not delete existing local files outside the managed resource directories.

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
| `extensions/` | Active Pi extension files. The package manifest loads `amp-startup-screen.ts` (the animated Welcome to Pi dot-matrix screen). Amp appearance/editor/user-message extensions come from the `amp-themes` package. |
| `skills/` | Active shared skills from `~/.agents/skills` plus dereferenced global Pi skills. |
| `prompts/` | Prompt templates. |
| `themes/` | Custom themes. |
| `scripts/` | Sync, install, and verification helpers. |

## Catalog

### Installed packages and extensions

| Extension/package | Source | Why it is here / what it is for |
| --- | --- | --- |
| Amp themes/UI | `npm:amp-themes` with `amp-appearance`, `amp-editor`, `amp-user-message` | Provides the `amp-dark` theme plus Amp-style appearance switching, editor chrome, and compact user-message rendering. |
| Welcome to Pi | `extensions/amp-startup-screen.ts` | Local extension that renders an animated, Amp-style dot-matrix "Welcome to Pi" startup header, based on dotmatrix-style per-dot animation. |


### Skills

| Skill | Why it is here / what it is for |
| --- | --- |
| `address` | Executes PR review-comment triage and fixes, including pushback/escalation rules and check follow-up. |
| `agent-browser` | Drives real browser workflows for websites, QA, screenshots, scraping, login flows, and Electron apps. |
| `architect` | Re-derives clean architecture from first principles before implementation. |
| `ask-matt` | Routes ambiguous requests to the right Matt-style workflow or skill. |
| `code-review` | Runs focused multi-persona PR review across correctness, tests, maintainability, standards, security, and prior findings. |
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
