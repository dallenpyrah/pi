import { estimateTokens, formatTombstone, sha256Text, type ContextStore } from "./context-store.ts";
import type { ContextReplacementReport, ContextReplacementResult, Tombstone } from "./types.ts";

type AnyMessage = Record<string, any>;

type LoadedRecord = {
	tombstone: Tombstone;
	content: string;
	replacement: string;
};

function byteLength(text: string): number {
	return Buffer.byteLength(text, "utf8");
}

function countOccurrences(haystack: string, needle: string): number {
	if (!needle) return 0;
	let count = 0;
	let index = 0;
	while ((index = haystack.indexOf(needle, index)) !== -1) {
		count += 1;
		index += needle.length;
	}
	return count;
}

function replaceExactText(
	text: string,
	record: LoadedRecord,
	report: ContextReplacementReport,
	seenTextReplacementKeys: Set<string>,
): string {
	const occurrences = countOccurrences(text, record.content);
	if (occurrences === 0) return text;
	seenTextReplacementKeys.add(record.tombstone.key);
	report.replacements += occurrences;
	report.replacementBytes += byteLength(record.content) * occurrences;
	report.replacementTokens += estimateTokens(record.content) * occurrences;
	if (!report.appliedKeys.includes(record.tombstone.key)) report.appliedKeys.push(record.tombstone.key);
	return text.split(record.content).join(record.replacement);
}

function replaceTextBlocks(
	content: unknown,
	records: LoadedRecord[],
	report: ContextReplacementReport,
	seenTextReplacementKeys: Set<string>,
): unknown {
	if (typeof content === "string") {
		return records.reduce((text, record) => replaceExactText(text, record, report, seenTextReplacementKeys), content);
	}
	if (!Array.isArray(content)) return content;
	return content.map((part) => {
		if (!part || typeof part !== "object" || part.type !== "text" || typeof part.text !== "string") return part;
		let text = part.text;
		for (const record of records) {
			text = replaceExactText(text, record, report, seenTextReplacementKeys);
		}
		return text === part.text ? part : { ...part, text };
	});
}

function evictToolResultKeyByCallId(messages: AnyMessage[]): Map<string, string> {
	const result = new Map<string, string>();
	for (const message of messages) {
		if (message?.role !== "toolResult" || message.toolName !== "evict_context") continue;
		const keyFromDetails = message.details?.contextEviction?.key;
		if (typeof keyFromDetails === "string" && message.toolCallId) {
			result.set(message.toolCallId, keyFromDetails);
			continue;
		}
		const text = Array.isArray(message.content)
			? message.content
					.filter((part: any) => part?.type === "text" && typeof part.text === "string")
					.map((part: any) => part.text)
					.join("\n")
			: "";
		const parsed = text.match(/key=(ev_[a-z0-9_]+)/i) ?? text.match(/"(ev_[a-z0-9_]+)"/i);
		if (parsed?.[1] && message.toolCallId) result.set(message.toolCallId, parsed[1]);
	}
	return result;
}

function scrubEvictToolCallArguments(
	message: AnyMessage,
	recordByToolCallId: Map<string, LoadedRecord>,
	keyByToolCallId: Map<string, string>,
	recordByKey: Map<string, LoadedRecord>,
	report: ContextReplacementReport,
): AnyMessage {
	if (message?.role !== "assistant" || !Array.isArray(message.content)) return message;
	let changed = false;
	const nextContent = message.content.map((part: any) => {
		if (!part || part.type !== "toolCall" || part.name !== "evict_context" || !part.id) return part;
		const record = recordByToolCallId.get(part.id) ?? recordByKey.get(keyByToolCallId.get(part.id) ?? "");
		if (!record) return part;
		const args = part.arguments;
		if (!args || typeof args !== "object" || typeof args.content !== "string") return part;
		if (args.content !== record.content && sha256Text(args.content) !== record.tombstone.contentHash) return part;
		changed = true;
		report.scrubbedToolArgs += 1;
		report.scrubbedBytes += byteLength(args.content);
		report.scrubbedTokens += estimateTokens(args.content);
		if (!report.scrubbedKeys.includes(record.tombstone.key)) report.scrubbedKeys.push(record.tombstone.key);
		return {
			...part,
			arguments: {
				...args,
				content: `[content evicted; key=${record.tombstone.key}; ~${record.tombstone.tokens} tok]`,
				contentHash: record.tombstone.contentHash,
				evictedKey: record.tombstone.key,
			},
		};
	});
	return changed ? { ...message, content: nextContent } : message;
}

function shouldSkipTextReplacement(message: AnyMessage): boolean {
	return (
		message?.role === "toolResult" &&
		(message.toolName === "recall_context" ||
			message.toolName === "evict_context" ||
			message.toolName === "list_evicted_context")
	);
}

function replaceMessageText(
	message: AnyMessage,
	records: LoadedRecord[],
	report: ContextReplacementReport,
	seenTextReplacementKeys: Set<string>,
): AnyMessage {
	if (shouldSkipTextReplacement(message)) return message;
	let changed = false;
	let next = message;

	if ("content" in message) {
		const nextContent = replaceTextBlocks(message.content, records, report, seenTextReplacementKeys);
		if (nextContent !== message.content) {
			changed = true;
			next = { ...next, content: nextContent };
		}
	}

	if (typeof message.output === "string") {
		let output = message.output;
		for (const record of records) {
			output = replaceExactText(output, record, report, seenTextReplacementKeys);
		}
		if (output !== message.output) {
			changed = true;
			next = { ...next, output };
		}
	}

	return changed ? next : message;
}

export function loadEvictionRecords(store: ContextStore): LoadedRecord[] {
	return store
		.all()
		.map((tombstone) => {
			const content = store.readBlob(tombstone.key);
			if (content === null) return undefined;
			return { tombstone, content, replacement: formatTombstone(tombstone) } satisfies LoadedRecord;
		})
		.filter((record): record is LoadedRecord => record !== undefined)
		.sort((a, b) => b.content.length - a.content.length);
}

export function applyExplicitEvictions<TMessage extends AnyMessage>(
	messages: TMessage[],
	records: LoadedRecord[],
): ContextReplacementResult<TMessage> {
	const report: ContextReplacementReport = {
		replacements: 0,
		replacementBytes: 0,
		replacementTokens: 0,
		scrubbedToolArgs: 0,
		scrubbedBytes: 0,
		scrubbedTokens: 0,
		misses: 0,
		appliedKeys: [],
		scrubbedKeys: [],
		missedKeys: [],
	};

	if (records.length === 0) return { messages, report };

	const keyByToolCallId = evictToolResultKeyByCallId(messages);
	const recordByKey = new Map(records.map((record) => [record.tombstone.key, record]));
	const recordByToolCallId = new Map(
		records
			.filter((record) => record.tombstone.createdByToolCallId)
			.map((record) => [record.tombstone.createdByToolCallId as string, record]),
	);
	const seenTextReplacementKeys = new Set<string>();

	const nextMessages = messages.map((message) => {
		const scrubbed = scrubEvictToolCallArguments(
			message,
			recordByToolCallId,
			keyByToolCallId,
			recordByKey,
			report,
		);
		return replaceMessageText(scrubbed, records, report, seenTextReplacementKeys) as TMessage;
	});

	for (const record of records) {
		if (!seenTextReplacementKeys.has(record.tombstone.key) && !report.scrubbedKeys.includes(record.tombstone.key)) {
			report.misses += 1;
			report.missedKeys.push(record.tombstone.key);
		}
	}

	return { messages: nextMessages, report };
}

export function applyExplicitEvictionsFromStore<TMessage extends AnyMessage>(
	messages: TMessage[],
	store: ContextStore,
): ContextReplacementResult<TMessage> {
	return applyExplicitEvictions(messages, loadEvictionRecords(store));
}
