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
npm run install:local
```

`install:local` copies the snapshot into `~/.pi/agent` and `~/.agents`. It does not copy secrets and does not delete existing local files.

## Refresh this repo from my machine

```bash
cd ~/projects/pi
npm run sync
npm run verify
```

`sync` copies the allowed parts of my current setup into the repo and deletes stale files inside the managed resource directories.

## Layout

| Path | Purpose |
| --- | --- |
| `configs/pi-agent/` | Snapshot of safe `~/.pi/agent` config files. |
| `configs/agents/` | Snapshot of safe `~/.agents` metadata. |
| `extensions/` | Active and supporting Pi extension files. Only `fff-defaults.ts` is loaded by this package manifest. |
| `extensions.disabled/` | Disabled extension experiments, kept for history. |
| `skills/` | Active shared skills from `~/.agents/skills` plus dereferenced global Pi skills. |
| `skills.disabled/` | Disabled skills, kept out of package discovery. |
| `prompts/` | Prompt templates. |
| `themes/` | Custom themes. |
| `scripts/` | Sync, install, and verification helpers. |

## Intentionally excluded

The repo excludes auth, OAuth stores, session history, caches, SQLite databases, env files, binaries, package install directories, and generated run history. See `.gitignore` and `scripts/verify-no-secrets.mjs`.

Some entries in `configs/pi-agent/settings.json` are machine-local snapshots, such as local project package paths. They document my machine setup and may need editing before another person installs the full config snapshot.
