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
