# Evidence Quality

Rank evidence in this order:

1. Current repo code, tests, scripts, config, and generated artifacts
2. Current git history, deleted approaches, issues, PRs, review comments, and learning files
3. Installed package source, lockfiles, and type definitions
4. Official product or library documentation
5. Vendored reference repos
6. `parallel-cli` search/extract/research output (cited URLs only)
7. Release notes, issue threads, and war stories
8. Inference

Every non-obvious claim should be labeled as:

- **grounded:** directly supported by cited evidence
- **inferred:** reasoned from evidence, but not directly stated
- **unknown:** material and not yet answered
- **deferred:** intentionally outside the current phase

Do not let weaker evidence override stronger local evidence. If evidence conflicts, name the conflict and stop guessing.
