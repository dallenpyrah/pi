# Grounding Sources

Use the strongest source that can answer the question:

| Question | Source |
|---|---|
| What exists in this repo? | `rg`, file reads, tests, package scripts |
| What code shape exists independent of spelling? | `rg` / built-in structural search |
| What changed before? | `git log`, `git show`, PRs, issues, review comments |
| What did this repo already learn? | `docs/learnings/`, previous review comments |
| What does the installed package do? | lockfile, `node_modules` source/types |
| What does the owner promise? | official docs (`parallel-cli extract <url>`) |
| What is the current API shape / what's on the web? | `parallel-cli search` (then `parallel-cli extract`) |
| How do real projects wire it? | `parallel-cli search` for public usage |
| I need a deep, multi-source, cited answer | `parallel-cli research run` |

Local code beats memory. Installed source beats generic docs for actual runtime behavior. Official docs beat blog posts for product semantics.
