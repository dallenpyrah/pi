import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ContextStore, estimateTokens, formatTombstone } from "./context-store.ts";
import { applyExplicitEvictionsFromStore } from "./eviction-records.ts";

type BenchResult = {
	name: string;
	passed: boolean;
	metrics: Record<string, number | string | boolean>;
	errors: string[];
};

function makeBlob(label: string, needlePosition: "begin" | "middle" | "end" = "middle", lines = 900): string {
	const needle = `NEEDLE_${label}=VALUE_${label}`;
	const filler = Array.from({ length: lines }, (_, i) => `${label} distractor ${i.toString().padStart(4, "0")} ${"x".repeat(60)}`);
	if (needlePosition === "begin") filler.unshift(needle);
	else if (needlePosition === "end") filler.push(needle);
	else filler.splice(Math.floor(filler.length / 2), 0, needle);
	return filler.join("\n");
}

function bytes(value: unknown): number {
	return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function allText(value: unknown): string {
	const values: string[] = [];
	const visit = (item: unknown) => {
		if (typeof item === "string") {
			values.push(item);
			return;
		}
		if (Array.isArray(item)) {
			for (const child of item) visit(child);
			return;
		}
		if (item && typeof item === "object") {
			for (const child of Object.values(item)) visit(child);
		}
	};
	visit(value);
	return values.join("\n");
}

function result(name: string, metrics: Record<string, number | string | boolean>, checks: Array<[boolean, string]>): BenchResult {
	const errors = checks.filter(([ok]) => !ok).map(([, message]) => message);
	return { name, passed: errors.length === 0, metrics, errors };
}

function evictionCompliance(root: string): BenchResult {
	const store = new ContextStore("bench-compliance", root);
	const payload = makeBlob("COMPLIANCE", "middle");
	const tombstone = store.evict(payload, {
		gist: "Compliance blob with a middle-position needle",
		source: "benchmark:compliance",
		createdByToolCallId: "call_evict_compliance",
	});
	const messages = [
		{ role: "toolResult", toolName: "read", toolCallId: "read_compliance", content: [{ type: "text", text: payload }] },
		{
			role: "assistant",
			content: [
				{
					type: "toolCall",
					id: "call_evict_compliance",
					name: "evict_context",
					arguments: { content: payload, gist: tombstone.gist, source: tombstone.source },
				},
			],
		},
		{
			role: "toolResult",
			toolName: "evict_context",
			toolCallId: "call_evict_compliance",
			content: [{ type: "text", text: formatTombstone(tombstone) }],
			details: { contextEviction: { ok: true, key: tombstone.key } },
		},
	];
	const beforeBytes = bytes(messages);
	const beforeTokens = estimateTokens(JSON.stringify(messages));
	const applied = applyExplicitEvictionsFromStore(messages, store);
	const afterBytes = bytes(applied.messages);
	const afterTokens = estimateTokens(JSON.stringify(applied.messages));
	const afterText = allText(applied.messages);
	return result(
		"eviction-compliance",
		{
			beforeBytes,
			afterBytes,
			beforeTokens,
			afterTokens,
			evictions: store.stats().evictions,
			replacements: applied.report.replacements,
			scrubbedToolArgs: applied.report.scrubbedToolArgs,
			contextReductionPct: Math.round((1 - afterBytes / beforeBytes) * 1000) / 10,
		},
		[
			[store.stats().evictions > 0, "evict_context-equivalent store event count must be nonzero"],
			[applied.report.replacements > 0, "explicit text replacement must occur"],
			[applied.report.scrubbedToolArgs > 0, "evict_context content argument must be scrubbed"],
			[afterBytes < beforeBytes * 0.35, "provider-bound context should shrink by at least 65% in synthetic case"],
			[!afterText.includes(payload), "provider-bound context must not contain the evicted payload"],
			[afterText.includes(tombstone.key), "provider-bound context must retain the tombstone key"],
		],
	);
}

function recallRequired(root: string): BenchResult {
	const store = new ContextStore("bench-recall", root);
	const payload = makeBlob("RECALL", "middle");
	const tombstone = store.evict(payload, { gist: "Recall blob with exact planted fact", source: "benchmark:recall" });
	const recalled = store.recall(tombstone.key);
	const answer = recalled?.match(/NEEDLE_RECALL=(VALUE_RECALL)/)?.[1];
	return result(
		"recall-required-needle",
		{ evictions: store.stats().evictions, recalls: store.stats().recalls, recalledBytes: recalled?.length ?? 0, answer: answer ?? "" },
		[
			[store.stats().evictions > 0, "eviction count must be nonzero"],
			[store.stats().recalls > 0, "recall count must be nonzero"],
			[answer === "VALUE_RECALL", "recalled exact needle answer must match"],
		],
	);
}

function lostPositionMatrix(root: string): BenchResult {
	const positions = ["begin", "middle", "end"] as const;
	const store = new ContextStore("bench-lost-position", root);
	const answers: string[] = [];
	for (const position of positions) {
		const payload = makeBlob(position.toUpperCase(), position);
		const tombstone = store.evict(payload, { gist: `Needle at ${position}`, source: `benchmark:lost:${position}` });
		const recalled = store.recall(tombstone.key) ?? "";
		answers.push(recalled.match(new RegExp(`NEEDLE_${position.toUpperCase()}=(VALUE_${position.toUpperCase()})`))?.[1] ?? "missing");
	}
	return result(
		"lost-position-matrix",
		{ evictions: store.stats().evictions, recalls: store.stats().recalls, answers: answers.join(",") },
		[
			[store.stats().evictions === 3, "all three position blobs must be evicted"],
			[store.stats().recalls === 3, "all three position blobs must be recalled"],
			[answers.every((answer) => answer.startsWith("VALUE_")), "all position needles must be recovered"],
		],
	);
}

function multiNeedleAggregation(root: string): BenchResult {
	const store = new ContextStore("bench-multi", root);
	const values = [7, 11, 13];
	const keys = values.map((value, index) => {
		const payload = `${makeBlob(`MULTI_${index}`, "middle", 250)}\nAGG_VALUE=${value}`;
		return store.evict(payload, { gist: `Aggregation value ${value}`, source: `benchmark:multi:${index}` }).key;
	});
	const sum = keys.reduce((acc, key) => {
		const recalled = store.recall(key) ?? "";
		return acc + Number(recalled.match(/AGG_VALUE=(\d+)/)?.[1] ?? 0);
	}, 0);
	return result(
		"multi-needle-aggregation",
		{ evictions: store.stats().evictions, recalls: store.stats().recalls, sum },
		[
			[store.stats().evictions === values.length, "all aggregation blobs must be evicted"],
			[store.stats().recalls === values.length, "all aggregation blobs must be recalled"],
			[sum === values.reduce((a, b) => a + b, 0), "aggregation over recalled values must be correct"],
		],
	);
}

function noEvictionControl(root: string): BenchResult {
	const store = new ContextStore("bench-control", root);
	const messages = [
		{ role: "user", content: [{ type: "text", text: "Small active instruction: do not evict me." }] },
		{ role: "assistant", content: [{ type: "text", text: "Acknowledged." }] },
	];
	const applied = applyExplicitEvictionsFromStore(messages, store);
	return result(
		"no-eviction-control",
		{ evictions: store.stats().evictions, replacements: applied.report.replacements, scrubbedToolArgs: applied.report.scrubbedToolArgs },
		[
			[store.stats().evictions === 0, "control should have zero evictions"],
			[applied.report.replacements === 0, "control should have zero replacements"],
			[applied.report.scrubbedToolArgs === 0, "control should have zero scrubs"],
		],
	);
}

const root = mkdtempSync(join(tmpdir(), "pi-context-eviction-bench-"));
try {
	const results = [
		evictionCompliance(root),
		recallRequired(root),
		lostPositionMatrix(root),
		multiNeedleAggregation(root),
		noEvictionControl(root),
	];
	for (const r of results) {
		console.log(`${r.passed ? "PASS" : "FAIL"} ${r.name} ${JSON.stringify(r.metrics)}`);
		for (const error of r.errors) console.log(`  - ${error}`);
	}
	const failed = results.filter((r) => !r.passed);
	console.log(JSON.stringify({ passed: failed.length === 0, results }, null, 2));
	if (failed.length > 0) process.exitCode = 1;
} finally {
	rmSync(root, { recursive: true, force: true });
}
