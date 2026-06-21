import { createHash, randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import type { StoreEvent, StoreEventType, StoreStats, Tombstone } from "./types.ts";

function defaultRoot(): string {
	return process.env.PI_CONTEXT_EVICTION_STORE_ROOT ?? join(homedir(), ".pi", "agent", "context-store");
}

function safePathSegment(value: string): string {
	const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
	return cleaned || "unknown-session";
}

function nowIso(): string {
	return new Date().toISOString();
}

export function sha256Text(content: string): string {
	return createHash("sha256").update(content, "utf8").digest("hex");
}

export function estimateTokens(content: string): number {
	return Math.max(1, Math.ceil(content.length / 4));
}

export function formatTombstone(t: Tombstone): string {
	return `[evicted ${t.source} · ~${t.tokens} tok · key=${t.key}] ${t.gist}\nUse recall_context with key "${t.key}" to retrieve exact content when needed.`;
}

export function sessionIdFromSessionFile(sessionFile: string | undefined): string | undefined {
	if (!sessionFile) return undefined;
	const file = basename(sessionFile).replace(/\.jsonl$/i, "");
	const parent = basename(dirname(sessionFile));
	return safePathSegment(`${parent}__${file}`);
}

export class ContextStore {
	readonly sessionId: string;
	readonly dir: string;
	readonly indexPath: string;
	readonly eventsPath: string;
	private readonly index = new Map<string, Tombstone>();
	private statsCounters = {
		evictions: 0,
		recalls: 0,
		recallMisses: 0,
		lists: 0,
		contextReplacements: 0,
		toolArgScrubs: 0,
		targetMisses: 0,
		replacedBytes: 0,
		replacedTokens: 0,
	};

	constructor(sessionId: string, root = defaultRoot()) {
		this.sessionId = safePathSegment(sessionId);
		this.dir = join(root, this.sessionId);
		this.indexPath = join(this.dir, "index.jsonl");
		this.eventsPath = join(this.dir, "events.jsonl");
		mkdirSync(this.dir, { recursive: true });
		this.replayIndex();
		this.replayEvents();
	}

	evict(
		content: string,
		meta: { gist: string; source?: string; matchHint?: string; createdByToolCallId?: string },
	): Tombstone {
		const key = this.createKey();
		const bytes = Buffer.byteLength(content, "utf8");
		const tombstone: Tombstone = {
			key,
			gist: meta.gist.trim() || "Evicted context blob",
			source: meta.source?.trim() || "model-requested",
			tokens: estimateTokens(content),
			bytes,
			contentHash: sha256Text(content),
			createdAt: nowIso(),
			matchHint: meta.matchHint?.trim() || undefined,
			createdByToolCallId: meta.createdByToolCallId,
		};

		writeFileSync(this.blobPath(key), content, { encoding: "utf8", flag: "wx" });
		this.index.set(key, tombstone);
		appendFileSync(this.indexPath, `${JSON.stringify(tombstone)}\n`, "utf8");
		this.logEvent("evict", {
			key,
			toolCallId: meta.createdByToolCallId,
			bytes,
			tokens: tombstone.tokens,
			details: { source: tombstone.source, contentHash: tombstone.contentHash },
		});
		return tombstone;
	}

	readBlob(key: string): string | null {
		const p = this.blobPath(key);
		return existsSync(p) ? readFileSync(p, "utf8") : null;
	}

	recall(key: string, toolCallId?: string): string | null {
		const content = this.readBlob(key);
		if (content === null) {
			this.logEvent("recall_missing", { key, toolCallId });
			return null;
		}
		this.logEvent("recall", {
			key,
			toolCallId,
			bytes: Buffer.byteLength(content, "utf8"),
			tokens: estimateTokens(content),
		});
		return content;
	}

	get(key: string): Tombstone | undefined {
		return this.index.get(key);
	}

	list(query?: string, limit = 50): Tombstone[] {
		const normalizedQuery = query?.trim().toLowerCase();
		const boundedLimit = Math.max(1, Math.min(Math.floor(limit || 50), 200));
		const values = [...this.index.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
		const filtered = normalizedQuery
			? values.filter((t) =>
					[t.key, t.gist, t.source, t.contentHash].some((field) => field.toLowerCase().includes(normalizedQuery)),
				)
			: values;
		this.logEvent("list", { count: Math.min(filtered.length, boundedLimit), details: { query: query ?? "" } });
		return filtered.slice(0, boundedLimit);
	}

	all(): Tombstone[] {
		return [...this.index.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}

	logContextReplacement(report: { replacedBytes: number; replacedTokens: number; count: number; keys: string[] }): void {
		this.logEvent("context_replace", {
			count: report.count,
			replacedBytes: report.replacedBytes,
			replacedTokens: report.replacedTokens,
			details: { keys: report.keys },
		});
	}

	logToolArgScrub(report: { count: number; keys: string[]; replacedBytes: number; replacedTokens: number }): void {
		this.logEvent("tool_arg_scrub", {
			count: report.count,
			replacedBytes: report.replacedBytes,
			replacedTokens: report.replacedTokens,
			details: { keys: report.keys },
		});
	}

	logTargetMiss(keys: string[]): void {
		if (keys.length === 0) return;
		this.logEvent("eviction_target_missed", { count: keys.length, details: { keys } });
	}

	logEvent(type: StoreEventType, partial: Omit<Partial<StoreEvent>, "type" | "timestamp" | "sessionId"> = {}): void {
		const event: StoreEvent = {
			...partial,
			type,
			timestamp: nowIso(),
			sessionId: this.sessionId,
		};
		appendFileSync(this.eventsPath, `${JSON.stringify(event)}\n`, "utf8");
		this.applyEventToStats(event);
	}

	stats(): StoreStats {
		let totalBlobBytes = 0;
		let totalBlobTokens = 0;
		for (const t of this.index.values()) {
			totalBlobBytes += t.bytes;
			totalBlobTokens += t.tokens;
		}
		return {
			sessionId: this.sessionId,
			storeDir: this.dir,
			blobCount: this.index.size,
			totalBlobBytes,
			totalBlobTokens,
			...this.statsCounters,
		};
	}

	private blobPath(key: string): string {
		return join(this.dir, `${safePathSegment(key)}.txt`);
	}

	private createKey(): string {
		for (let attempt = 0; attempt < 10; attempt++) {
			const key = `ev_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
			if (!this.index.has(key) && !existsSync(this.blobPath(key))) return key;
		}
		throw new Error("Could not allocate unique context eviction key");
	}

	private replayIndex(): void {
		if (!existsSync(this.indexPath)) return;
		for (const line of readFileSync(this.indexPath, "utf8").split("\n")) {
			if (!line.trim()) continue;
			try {
				const t = JSON.parse(line) as Tombstone;
				if (t.key) this.index.set(t.key, t);
			} catch {
				// Keep the store auditable: do not rewrite corrupted lines, just ignore for replay.
			}
		}
	}

	private replayEvents(): void {
		if (!existsSync(this.eventsPath)) return;
		for (const line of readFileSync(this.eventsPath, "utf8").split("\n")) {
			if (!line.trim()) continue;
			try {
				this.applyEventToStats(JSON.parse(line) as StoreEvent);
			} catch {
				// Append-only log remains untouched.
			}
		}
	}

	private applyEventToStats(event: StoreEvent): void {
		switch (event.type) {
			case "evict":
				this.statsCounters.evictions += 1;
				break;
			case "recall":
				this.statsCounters.recalls += 1;
				break;
			case "recall_missing":
				this.statsCounters.recallMisses += 1;
				break;
			case "list":
				this.statsCounters.lists += 1;
				break;
			case "context_replace":
				this.statsCounters.contextReplacements += event.count ?? 1;
				this.statsCounters.replacedBytes += event.replacedBytes ?? 0;
				this.statsCounters.replacedTokens += event.replacedTokens ?? 0;
				break;
			case "tool_arg_scrub":
				this.statsCounters.toolArgScrubs += event.count ?? 1;
				this.statsCounters.replacedBytes += event.replacedBytes ?? 0;
				this.statsCounters.replacedTokens += event.replacedTokens ?? 0;
				break;
			case "eviction_target_missed":
				this.statsCounters.targetMisses += event.count ?? 1;
				break;
		}
	}
}
