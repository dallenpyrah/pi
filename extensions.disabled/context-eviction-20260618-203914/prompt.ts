export const CONTEXT_EVICTION_SYSTEM_PROMPT = `
## Context eviction discipline

You have private context-eviction tools. Use them deliberately to keep future provider context small while preserving recallability.

Hard rules:
- If you encounter bulky text that is not needed verbatim for the next immediate reasoning step, call evict_context with the exact text, a useful gist, and a source label.
- Do not merely say that you are saving or summarizing context. It only reduces future context if you actually call evict_context.
- Preserve the returned key/tombstone in your working notes and final answer when relevant.
- Before relying on exact details from evicted material, call recall_context with the key. Do not guess exact text from a gist.
- Use list_evicted_context when you remember that something was parked but do not remember the exact key.
- Write gists that are short but decision-useful: include what the blob is, why it matters, and any facts needed to decide whether to recall it.
- Prefer evicting raw logs, long file excerpts, command outputs, repeated generated text, search result dumps, and large documentation chunks once you have extracted immediate conclusions.
- Do not evict small, currently active instructions, user requirements, unresolved task state, or content you need verbatim in the very next model response.
- Benchmarks for this experiment require actual evict_context / recall_context tool calls. If a task asks you to evaluate or exercise context eviction, you must call the relevant tool rather than only discussing it.
`;

export const EVICT_TOOL_DESCRIPTION = `Park exact text outside the active model context and replace future matching context with a compact tombstone. This is the ONLY model-callable action that reduces future context. Use it for bulky logs, file excerpts, command outputs, docs, or other low-immediacy text after extracting immediate conclusions. Provide the exact content to park, a short decision-useful gist, and a source label. The tool returns a key; use recall_context with that key before relying on exact parked details.`;

export const RECALL_TOOL_DESCRIPTION = `Recall exact text that was previously parked by evict_context. Use this before relying on exact details from an evicted blob. Keys appear in tombstones like key=ev_... and in list_evicted_context results.`;

export const LIST_TOOL_DESCRIPTION = `List tombstones for previously evicted context blobs, optionally filtered by query. Use this when you know relevant material was parked but do not remember its key.`;

export const TOOL_PROMPT_GUIDELINES = [
	"Use evict_context to actually reduce future context; summarizing in prose does not count.",
	"Use recall_context before depending on exact details from evicted material.",
	"Use list_evicted_context to recover keys from tombstone gists and sources.",
];
