export interface Tombstone {
	key: string;
	gist: string;
	tokens: number;
	bytes: number;
	source: string;
	createdAt: string;
	contentHash: string;
	matchHint?: string;
	createdByToolCallId?: string;
}

export type StoreEventType =
	| "evict"
	| "recall"
	| "recall_missing"
	| "list"
	| "context_replace"
	| "tool_arg_scrub"
	| "eviction_target_missed"
	| "check"
	| "benchmark";

export interface StoreEvent {
	type: StoreEventType;
	timestamp: string;
	sessionId: string;
	key?: string;
	toolCallId?: string;
	bytes?: number;
	tokens?: number;
	replacedBytes?: number;
	replacedTokens?: number;
	count?: number;
	message?: string;
	details?: Record<string, unknown>;
}

export interface StoreStats {
	sessionId: string;
	storeDir: string;
	blobCount: number;
	totalBlobBytes: number;
	totalBlobTokens: number;
	evictions: number;
	recalls: number;
	recallMisses: number;
	lists: number;
	contextReplacements: number;
	toolArgScrubs: number;
	targetMisses: number;
	replacedBytes: number;
	replacedTokens: number;
}

export interface ContextReplacementReport {
	replacements: number;
	replacementBytes: number;
	replacementTokens: number;
	scrubbedToolArgs: number;
	scrubbedBytes: number;
	scrubbedTokens: number;
	misses: number;
	appliedKeys: string[];
	scrubbedKeys: string[];
	missedKeys: string[];
}

export interface ContextReplacementResult<TMessage = unknown> {
	messages: TMessage[];
	report: ContextReplacementReport;
}

export interface EvictContextParams {
	content: string;
	gist: string;
	source?: string;
	matchHint?: string;
}

export interface RecallContextParams {
	key: string;
}

export interface ListEvictedContextParams {
	query?: string;
	limit?: number;
}
