import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

type ModeConfig = {
  provider: string;
  model: string;
  thinking: ThinkingLevel;
  label: string;
};

const MODES: Record<string, ModeConfig> = {
  "deep 1": {
    provider: "vibeproxy",
    model: "gpt-5.5",
    thinking: "medium",
    label: "deep 1 · GPT 5.5 · extended thinking",
  },
  "deep 2": {
    provider: "vibeproxy",
    model: "gpt-5.5",
    thinking: "high",
    label: "deep 2 · GPT 5.5 · extended thinking",
  },
  "deep 3": {
    provider: "vibeproxy",
    model: "gpt-5.5",
    thinking: "xhigh",
    label: "deep 3 · GPT 5.5 · max extended thinking",
  },
  smart: {
    provider: "vibeproxy-claude",
    model: "claude-opus-4-8",
    thinking: "xhigh",
    label: "smart · Opus 4.8 · max reasoning",
  },
  rush: {
    provider: "vibeproxy",
    model: "gpt-5.5",
    thinking: "off",
    label: "rush · GPT 5.5 · no reasoning",
  },
};

function normalizeDeepArgs(args: string): "deep 1" | "deep 2" | "deep 3" {
  const level = args.trim() || "2";
  if (level === "1") return "deep 1";
  if (level === "3") return "deep 3";
  return "deep 2";
}

async function applyMode(pi: ExtensionAPI, ctx: ExtensionContext, key: keyof typeof MODES): Promise<void> {
  const mode = MODES[key];
  const model = ctx.modelRegistry.find(mode.provider, mode.model);

  if (!model) {
    ctx.ui.notify(`Mode ${key}: model not found: ${mode.provider}/${mode.model}`, "error");
    return;
  }

  const changed = await pi.setModel(model);
  pi.setThinkingLevel(mode.thinking);
  ctx.ui.setStatus("amp-mode", ctx.ui.theme.fg("accent", key));

  if (!changed) {
    ctx.ui.notify(`Mode ${key}: no API key for ${mode.provider}/${mode.model}`, "warning");
    return;
  }

  ctx.ui.notify(`Mode: ${mode.label}`, "info");
}

export default function ampModes(pi: ExtensionAPI): void {
  pi.registerCommand("deep", {
    description: "Switch to GPT 5.5 deep mode. Args: 1, 2, or 3.",
    handler: async (args, ctx) => applyMode(pi, ctx, normalizeDeepArgs(args)),
  });

  pi.registerCommand("smart", {
    description: "Switch to Opus 4.8 with max reasoning.",
    handler: async (_args, ctx) => applyMode(pi, ctx, "smart"),
  });

  pi.registerCommand("rush", {
    description: "Switch to GPT 5.5 with reasoning off.",
    handler: async (_args, ctx) => applyMode(pi, ctx, "rush"),
  });

  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setHiddenThinkingLabel("thinking hidden");
  });

  pi.on("model_select", (_event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setStatus("amp-mode", undefined);
  });
}
