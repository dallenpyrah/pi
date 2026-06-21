# Private Pi Context Eviction Extension

Global private extension for the local Pi dev coding agent.

## Location

Installed at:

```text
~/.pi/agent/extensions/context-eviction/
```

Pi discovers global extensions from `~/.pi/agent/extensions/*/index.ts`. Use `/reload` in Pi after edits.

## What it does

This extension gives the model three explicit tools:

- `evict_context` — store exact bulky text on disk and create a tombstone/key.
- `recall_context` — recall exact stored text by key.
- `list_evicted_context` — list tombstones for the current session.

It also injects heavy system-prompt guidance telling the model to call the tools when managing context.

## Important behavior

There is no automatic pruning or automatic candidate selection. The extension only reduces provider-bound context after the model explicitly calls `evict_context`.

The `context` hook does two explicit-only rewrites on future model calls:

1. Replaces exact prior matching text with a compact tombstone.
2. Scrubs the completed `evict_context` tool-call `content` argument, so the act of calling the tool does not keep the large blob in context.

Stored Pi session JSONL is not rewritten. The external context store is append-only/auditable.

## Store

Default store root:

```text
~/.pi/agent/context-store/<sessionId>/
```

Files:

- `index.jsonl` — append-only tombstone index.
- `events.jsonl` — append-only audit/metrics log.
- `ev_*.txt` — one stored blob per evicted context item.

Override the root with:

```bash
PI_CONTEXT_EVICTION_STORE_ROOT=/path/to/store pi
```

## Commands

Inside Pi:

- `/context-eviction-stats` — show counters and store path.
- `/context-eviction-list [query]` — list tombstones.
- `/context-eviction-recall <key>` — manually recall a blob for debugging.

## Private checks

From the Pi monorepo (uses its dev `tsx` dependency):

```bash
cd /path/to/repos/pi
npx tsx ~/.pi/agent/extensions/context-eviction/check.ts
```

Expected output:

```text
context-eviction checks passed
```

## Synthetic benchmark

```bash
cd /path/to/repos/pi
npx tsx ~/.pi/agent/extensions/context-eviction/benchmark.ts
```

The benchmark hard-gates:

- nonzero eviction in eviction-required scenarios;
- nonzero recall in recall-required scenarios;
- exact recall correctness;
- provider-bound context reduction after explicit eviction;
- no deletion without explicit eviction;
- audit-safe target misses.

Cost and latency are reported-only for future live-model benchmarks because baseline variance needs to be measured first.

## Known caveats

- The model has to choose to call `evict_context`; prompt/tool descriptions strongly encourage this, but compliance should be benchmarked with real model runs.
- Exact replacement requires the content passed to `evict_context` to match prior provider-bound text. If the model paraphrases or only partially copies the text, the extension scrubs the tool argument but may not replace the original source text; this is logged as a target miss.
- `recall_context` results are left visible to the next model call so the agent can actually use exact recalled content. Long recalled blobs can re-expand context if the conversation continues.
