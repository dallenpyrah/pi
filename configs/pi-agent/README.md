# Pi global agent folder

This folder stores user-wide Pi configuration and runtime state.

## Live configuration

- `settings.json` — global Pi settings, packages, theme, and local resource paths.
- `models.json` — custom model providers and model metadata.
- `AGENTS.md` — global agent instructions loaded into every project.
- `mcp.json`, `mcp-cache.json`, `mcp-onboarding.json`, `mcp-oauth/` — MCP server configuration and OAuth/cache state.
- `semantic-search.json`, `semantic-search.env` — semantic search settings and environment.
- `tmux-bash.jsonc` — tmux-backed bash tool defaults.
- `auth.json`, `trust.json`, `*.env` — private credentials, trust decisions, and local secrets.

## User resources

- `extensions/` — local user extensions. `extensions/fff-defaults.ts` is enabled by `settings.json`.
- `skills/` — local user skills. Empty by design when skills are supplied by packages.
- `npm/` — installed user Pi packages listed in `settings.json`.
- `git/` — user Pi packages installed from git sources.
- `extensions.disabled/` — disabled or parked extension experiments.

## Runtime state

- `sessions/` — saved conversation history.
- `semantic-search/` — repository search indexes.
- `context-store/` — context-mode storage.
- `pi-web/`, `pi-web.sqlite`, `pi-web-version` — Pi web UI state.
- `session-status/`, `run-history.jsonl`, `cursor-model-cache.json` — small runtime caches.
- `tmp/` — disposable temporary work area.

## Backups and archives

- `backups/pre-cleanup-*` — snapshots of important configs before cleanup runs.
- `backups/config-history/` — old root-level `.bak` and `.backup` files.
- `backups/removed-skills/` — archived skill bundles that are no longer loaded.

Keep `auth.json`, `*.env`, `mcp-oauth/`, and `trust.json` private.
