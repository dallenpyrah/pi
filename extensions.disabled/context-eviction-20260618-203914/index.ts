import { createHash } from "node:crypto";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { ContextStore, formatTombstone, sessionIdFromSessionFile } from "./context-store.ts";
import { applyExplicitEvictionsFromStore } from "./eviction-records.ts";
import {
	CONTEXT_EVICTION_SYSTEM_PROMPT,
	EVICT_TOOL_DESCRIPTION,
	LIST_TOOL_DESCRIPTION,
	RECALL_TOOL_DESCRIPTION,
	TOOL_PROMPT_GUIDELINES,
} from "./prompt.ts";
import type { EvictContextParams, ListEvictedContextParams, RecallContextParams } from "./types.ts";

const stores = new Map<string, ContextStore>();
const reportedMisses = new Set<string>();

function cwdHash(cwd: string): string {
	return createHash("sha1").update(cwd).digest("hex").slice(0, 12);
}

function getSessionId(ctx: ExtensionContext): string {
	const manager = ctx.sessionManager as any;
	return (
		(typeof manager.getSessionId === "function" ? manager.getSessionId() : undefined) ??
		sessionIdFromSessionFile(typeof manager.getSessionFile === "function" ? manager.getSessionFile() : undefined) ??
		`ephemeral-${cwdHash(ctx.cwd)}`
	);
}

function getStore(ctx: ExtensionContext): ContextStore {
	const sessionId = getSessionId(ctx);
	let store = stores.get(sessionId);
	if (!store) {
		store = new ContextStore(sessionId);
		stores.set(sessionId, store);
	}
	return store;
}

function statsText(store: ContextStore): string {
	const stats = store.stats();
	return [
		`Context eviction store: ${stats.storeDir}`,
		`session: ${stats.sessionId}`,
		`blobs: ${stats.blobCount} · parked ~${stats.totalBlobTokens} tok / ${stats.totalBlobBytes} bytes`,
		`tool calls: evict=${stats.evictions}, recall=${stats.recalls}, recallMiss=${stats.recallMisses}, list=${stats.lists}`,
		`context: replacements=${stats.contextReplacements}, toolArgScrubs=${stats.toolArgScrubs}, targetMisses=${stats.targetMisses}`,
		`replaced: ~${stats.replacedTokens} tok / ${stats.replacedBytes} bytes`,
	].join("\n");
}

function showCommandText(ctx: ExtensionContext, title: string, text: string): void {
	if (ctx.hasUI) {
		ctx.ui.notify(title, "info");
		ctx.ui.setWidget("context-eviction", text.split("\n").slice(0, 20));
	} else {
		console.log(`\n${title}\n${text}`);
	}
}

const evictSchema = {
type: "object",
properties: {
	content: {
		type: "string",
		description:
			"Exact text to park outside future active context. Pass the full bulky text to evict; the extension stores it and scrubs this argument on future turns.",
	},
	gist: {
		type: "string",
		description:
			"Short decision-useful summary that remains in context. Include what this is, why it matters, and when to recall it.",
	},
	source: { type: "string", description: "Where the content came from, e.g. read:src/foo.ts, bash:npm test, docs:api." },
	matchHint: {
		type: "string",
		description:
			"Optional short unique quote from the original content for auditing/debugging. The MVP still requires safe exact matching for context replacement.",
	},
},
required: ["content", "gist"],
additionalProperties: false,
} as const;

const recallSchema = {
type: "object",
properties: {
	key: { type: "string", description: "Evicted context key, e.g. ev_mabc1234_deadbeef." },
},
required: ["key"],
additionalProperties: false,
} as const;

const listSchema = {
type: "object",
properties: {
	query: { type: "string", description: "Optional case-insensitive filter over key, source, gist, or hash." },
	limit: { type: "number", description: "Maximum tombstones to return; default 50, max 200." },
},
additionalProperties: false,
} as const;

export default function contextEvictionExtension(pi: ExtensionAPI) {
	pi.on("before_agent_start", (event) => ({
		systemPrompt: `${event.systemPrompt}\n\n${CONTEXT_EVICTION_SYSTEM_PROMPT}`,
	}));

	pi.on("context", (event, ctx) => {
		const store = getStore(ctx);
		const result = applyExplicitEvictionsFromStore(event.messages as any[], store);
		const report = result.report;

		if (report.replacements > 0) {
			store.logContextReplacement({
				count: report.replacements,
				replacedBytes: report.replacementBytes,
				replacedTokens: report.replacementTokens,
				keys: report.appliedKeys,
			});
		}
		if (report.scrubbedToolArgs > 0) {
			store.logToolArgScrub({
				count: report.scrubbedToolArgs,
				replacedBytes: report.scrubbedBytes,
				replacedTokens: report.scrubbedTokens,
				keys: report.scrubbedKeys,
			});
		}
		const newMisses = report.missedKeys.filter((key) => {
			const missKey = `${store.sessionId}:${key}`;
			if (reportedMisses.has(missKey)) return false;
			reportedMisses.add(missKey);
			return true;
		});
		store.logTargetMiss(newMisses);

		if (report.replacements || report.scrubbedToolArgs) {
			return { messages: result.messages as any };
		}
		return undefined;
	});

	pi.registerTool({
		name: "evict_context",
		label: "evict context",
		description: EVICT_TOOL_DESCRIPTION,
		promptSnippet: "Park exact bulky context outside the active model context and keep a recall key.",
		promptGuidelines: TOOL_PROMPT_GUIDELINES,
		parameters: evictSchema,
		async execute(toolCallId, params: EvictContextParams, signal, _onUpdate, ctx) {
			if (signal?.aborted) throw new Error("evict_context aborted");
			if (!params.content || params.content.length === 0) {
				return {
					content: [{ type: "text", text: "evict_context failed: content must not be empty." }],
					details: { contextEviction: { ok: false, reason: "empty_content" } },
				};
			}
			const store = getStore(ctx);
			const tombstone = store.evict(params.content, {
				gist: params.gist,
				source: params.source,
				matchHint: params.matchHint,
				createdByToolCallId: toolCallId,
			});
			const text = `${formatTombstone(tombstone)}\n\nEvicted ${tombstone.bytes} bytes (~${tombstone.tokens} tokens). Future provider context will replace exact matching content with this tombstone. The large content argument for this tool call will also be scrubbed from future provider context.`;
			return {
				content: [{ type: "text", text }],
				details: { contextEviction: { ok: true, key: tombstone.key, tombstone } },
			};
		},
	});

	pi.registerTool({
		name: "recall_context",
		label: "recall context",
		description: RECALL_TOOL_DESCRIPTION,
		promptSnippet: "Recall exact text previously parked by evict_context.",
		promptGuidelines: TOOL_PROMPT_GUIDELINES,
		parameters: recallSchema,
		async execute(toolCallId, params: RecallContextParams, signal, _onUpdate, ctx) {
			if (signal?.aborted) throw new Error("recall_context aborted");
			const store = getStore(ctx);
			const content = store.recall(params.key, toolCallId);
			if (content === null) {
				return {
					content: [{ type: "text", text: `No evicted context found for key=${params.key}` }],
					details: { contextEviction: { ok: false, key: params.key, reason: "not_found" } },
				};
			}
			return {
				content: [{ type: "text", text: content }],
				details: { contextEviction: { ok: true, kind: "recall", key: params.key } },
			};
		},
	});

	pi.registerTool({
		name: "list_evicted_context",
		label: "list evicted context",
		description: LIST_TOOL_DESCRIPTION,
		promptSnippet: "List evicted context tombstones and keys.",
		promptGuidelines: TOOL_PROMPT_GUIDELINES,
		parameters: listSchema,
		async execute(toolCallId, params: ListEvictedContextParams, signal, _onUpdate, ctx) {
			if (signal?.aborted) throw new Error("list_evicted_context aborted");
			const store = getStore(ctx);
			const tombstones = store.list(params.query, params.limit ?? 50);
			const text = tombstones.length
				? tombstones.map((t) => formatTombstone(t)).join("\n\n")
				: "No evicted context blobs found for this session.";
			return {
				content: [{ type: "text", text }],
				details: { contextEviction: { ok: true, kind: "list", count: tombstones.length, toolCallId } },
			};
		},
	});

	pi.registerCommand("context-eviction-stats", {
		description: "Show context eviction store statistics for this session",
		handler: async (_args, ctx) => {
			showCommandText(ctx, "Context eviction stats", statsText(getStore(ctx)));
		},
	});

	pi.registerCommand("context-eviction-list", {
		description: "List evicted context tombstones for this session",
		handler: async (args, ctx) => {
			const store = getStore(ctx);
			const tombstones = store.list(args.trim() || undefined, 50);
			const text = tombstones.length ? tombstones.map((t) => formatTombstone(t)).join("\n\n") : "No evicted context.";
			showCommandText(ctx, "Evicted context", text);
		},
	});

	pi.registerCommand("context-eviction-recall", {
		description: "Recall an evicted context blob by key for manual debugging",
		handler: async (args, ctx) => {
			const key = args.trim();
			if (!key) {
				showCommandText(ctx, "Context eviction recall", "Usage: /context-eviction-recall <key>");
				return;
			}
			const store = getStore(ctx);
			const content = store.recall(key);
			showCommandText(ctx, `Recall ${key}`, content ?? `No evicted context found for key=${key}`);
		},
	});
}
