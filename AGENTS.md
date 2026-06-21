# Pi setup repo instructions

- Keep this repository shareable and secret-free.
- Do not commit auth files, OAuth stores, sessions, caches, SQLite databases, env files, binaries, package install directories, or run history.
- Put active Pi package resources in `extensions/`, `skills/`, `prompts/`, and `themes/`.
- Put machine snapshots that must be copied into a Pi home under `configs/`.
- Run `bun run verify` before pushing.
