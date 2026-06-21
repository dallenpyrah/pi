# Security

This repository is meant to be public-shareable.

Do not commit:

- `auth.json`, `trust.json`, OAuth directories, or provider credential stores
- `.env` files or any file ending in `.env`
- sessions, run history, cache files, SQLite databases, package installs, binaries, or backups
- private keys, access tokens, refresh tokens, cookies, or copied browser profile state

Run this before pushing:

```bash
bun run verify
```
