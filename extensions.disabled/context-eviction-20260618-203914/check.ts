import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { ContextStore, formatTombstone } from "./context-store.ts";
import { applyExplicitEvictionsFromStore } from "./eviction-records.ts";

function largePayload(label = "alpha"): string {
	const filler = Array.from({ length: 300 }, (_, i) => `${label} filler line ${i.toString().padStart(3, "0")}`).join("\n");
	return `BEGIN_PAYLOAD_${label}\n${filler}\nNEEDLE_${label}=value-${label}\nEND_PAYLOAD_${label}`;
}

function textOf(messages: unknown): string {
	const values: string[] = [];
	const visit = (value: unknown) => {
		if (typeof value === "string") {
			values.push(value);
			return;
		}
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
			return;
		}
		if (value && typeof value === "object") {
			for (const item of Object.values(value)) visit(item);
		}
	};
	visit(messages);
	return values.join("\n");
}

const root = mkdtempSync(join(tmpdir(), "pi-context-eviction-check-"));
try {
	const store = new ContextStore("check-session", root);
	const payload = largePayload();
	const tombstone = store.evict(payload, {
		gist: "Large alpha payload containing NEEDLE_alpha for recall tests",
		source: "check:payload",
		createdByToolCallId: "call_evict_alpha",
	});

	assert.equal(store.readBlob(tombstone.key), payload, "evicted blob should be read back exactly");
	assert.equal(store.recall(tombstone.key), payload, "recall should return exact content");
	assert.equal(store.list("alpha", 10).length, 1, "list should find tombstone by gist");

	const messages = [
		{ role: "user", content: [{ type: "text", text: "Please inspect the bulky output." }] },
		{ role: "toolResult", toolName: "read", toolCallId: "read_1", content: [{ type: "text", text: payload }] },
		{
			role: "assistant",
			content: [
				{
					type: "toolCall",
					id: "call_evict_alpha",
					name: "evict_context",
					arguments: { content: payload, gist: tombstone.gist, source: tombstone.source },
				},
			],
		},
		{
			role: "toolResult",
			toolName: "evict_context",
			toolCallId: "call_evict_alpha",
			content: [{ type: "text", text: formatTombstone(tombstone) }],
			details: { contextEviction: { ok: true, key: tombstone.key } },
		},
	];
	const replaced = applyExplicitEvictionsFromStore(messages, store);
	const replacedText = textOf(replaced.messages);
	assert.equal(replacedText.includes(payload), false, "provider-bound context should not contain evicted payload");
	assert.equal(replacedText.includes(tombstone.key), true, "provider-bound context should contain tombstone key");
	assert.ok(replaced.report.replacements >= 1, "should replace prior matching text");
	assert.ok(replaced.report.scrubbedToolArgs >= 1, "should scrub evict_context content argument");

	const recallMessages = [
		{
			role: "toolResult",
			toolName: "recall_context",
			toolCallId: "recall_1",
			content: [{ type: "text", text: payload }],
			details: { contextEviction: { ok: true, kind: "recall", key: tombstone.key } },
		},
	];
	const recallVisible = applyExplicitEvictionsFromStore(recallMessages, store);
	assert.equal(textOf(recallVisible.messages).includes(payload), true, "recall_context result should remain visible to the next model call");

	const emptyStore = new ContextStore("empty-session", root);
	const noAuto = applyExplicitEvictionsFromStore(
		[{ role: "toolResult", toolName: "bash", toolCallId: "bash_1", content: [{ type: "text", text: largePayload("beta") }] }],
		emptyStore,
	);
	assert.equal(noAuto.report.replacements, 0, "large payload must not be auto-pruned without explicit eviction");
	assert.equal(textOf(noAuto.messages).includes("NEEDLE_beta"), true, "no-auto payload should remain visible");

	const missStore = new ContextStore("miss-session", root);
	missStore.evict(largePayload("gamma"), { gist: "Gamma missing payload", source: "check:miss" });
	const miss = applyExplicitEvictionsFromStore([{ role: "user", content: [{ type: "text", text: "no matching payload here" }] }], missStore);
	assert.equal(miss.report.misses, 1, "unmatched explicit eviction should be reported as a miss");
	assert.equal(textOf(miss.messages).includes("no matching payload here"), true, "miss should not delete unrelated context");

	console.log("context-eviction checks passed");
} finally {
	rmSync(root, { recursive: true, force: true });
}
