/**
 * Amp-style animated dot-matrix startup screen for Pi.
 *
 * Ports the engine from the `dotmatrix` library (zzzzshawn/matrix, MIT):
 * a circular-masked grid whose per-dot brightness is driven by an animation
 * "resolver" plus a stepped phase clock. The original renders a 5x5 web loader;
 * here the grid is parameterized to fill a large terminal dot sphere and the
 * per-dot opacity is mapped to ANSI color/brightness instead of CSS opacity.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Logical grid (rows x cols). Cols are rendered with a trailing space so each
// dot occupies a ~square visual cell in the terminal.
const ROWS = 21;
const COLS = 29;

const AMP_GREEN = "#84ecb3";
const AMP_CYAN = "#4bb7ce";
const AMP_BLUE = "#2231c6";
const AMP_MUTED = "#7a7a7a";
const AMP_TEXT = "#eeeeee";

const COPY_WIDTH = 28;
const STEP_MS = 90;

// --- dotmatrix core primitives (generalized to ROWS x COLS) ---

const CX = (COLS - 1) / 2;
const CY = (ROWS - 1) / 2;

function normalizedRadius(row: number, col: number): number {
  const nx = (col - CX) / (COLS / 2);
  const ny = (row - CY) / (ROWS / 2);
  return Math.hypot(nx, ny);
}

function polarAngle(row: number, col: number): number {
  return Math.atan2((row - CY) / (ROWS / 2), (col - CX) / (COLS / 2));
}

// Circular mask: keep dots inside the unit disc (the library masks corners).
function isWithinCircularMask(row: number, col: number): boolean {
  return normalizedRadius(row, col) <= 1.02;
}

// --- color helpers ---

function rgb(color: string): [number, number, number] {
  return [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
}

function fgRgb(r: number, g: number, b: number, text: string): string {
  return `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m${text}\x1b[39m`;
}

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[22m`;
}

function gradient(row: number): [number, number, number] {
  const amount = row / (ROWS - 1);
  const [ar, ag, ab] = rgb(AMP_GREEN);
  const [br, bg, bb] = rgb(AMP_CYAN);
  const [cr, cg, cb] = rgb(AMP_BLUE);
  if (amount < 0.52) {
    const t = amount / 0.52;
    return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
  }
  const t = (amount - 0.52) / 0.48;
  return [br + (cr - br) * t, bg + (cg - bg) * t, bb + (cb - bb) * t];
}

// --- animation resolver: returns per-dot "opacity" 0..1 (dotmatrix style) ---
// loadingRipple: concentric rings emanating outward, plus a slow swirl so it
// reads like Amp's shimmering sphere rather than a perfect bullseye.
function resolveOpacity(row: number, col: number, step: number): number {
  const r = normalizedRadius(row, col);
  const angle = polarAngle(row, col);
  const phase = step * 0.22;

  const ripple = Math.sin(r * 6.5 - phase * 2.0);
  const swirl = Math.sin(angle * 2 + r * 3.0 - phase * 1.3);
  const combined = ripple * 0.62 + swirl * 0.38; // -1..1

  // Bias brighter toward the center, fading at the rim.
  const rimFalloff = 1 - Math.min(1, r) * 0.35;
  return Math.max(0, Math.min(1, (combined * 0.5 + 0.5) * rimFalloff));
}

function renderLogo(step: number): string[] {
  const lines: string[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    let line = "";
    for (let col = 0; col < COLS; col += 1) {
      if (!isWithinCircularMask(row, col)) {
        line += "  ";
        continue;
      }
      const opacity = resolveOpacity(row, col, step);
      const lit = opacity > 0.6;
      const [gr, gg, gb] = gradient(row);
      const [hr, hg, hb] = rgb(AMP_GREEN);
      // Dim dots recede; lit crests brighten and pull toward Amp green.
      const brightness = 0.22 + opacity * 0.95;
      const litMix = lit ? 0.45 : 0;
      line +=
        fgRgb(
          gr * brightness * (1 - litMix) + hr * litMix,
          gg * brightness * (1 - litMix) + hg * litMix,
          gb * brightness * (1 - litMix) + hb * litMix,
          lit ? "\u2022" : "\u00b7",
        ) + " ";
    }
    lines.push(line.replace(/\s+$/, ""));
  }
  return lines;
}

function visibleLength(text: string): number {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "").length;
}

function padRight(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - visibleLength(text)));
}

function logoSpan(): number {
  return COLS * 2 - 1;
}

function renderScreen(step: number, width: number): string[] {
  const logo = renderLogo(step);
  const title = `${fgRgb(...rgb(AMP_GREEN), "Welcome to ")}${bold(fgRgb(...rgb(AMP_GREEN), "Pi"))}`;
  const commands = `${bold(fgRgb(...rgb(AMP_TEXT), "ctrl+o"))} ${fgRgb(...rgb(AMP_MUTED), "for commands")}`;
  const shortcuts = `${bold(fgRgb(...rgb(AMP_TEXT), "?"))} ${fgRgb(...rgb(AMP_MUTED), "for shortcuts")}`;
  const span = logoSpan();

  if (width >= span + COPY_WIDTH + 8) {
    const gap = 8;
    const total = span + gap + COPY_WIDTH;
    const left = Math.max(0, Math.floor((width - total) / 2));
    const copyStart = Math.floor(ROWS / 2) - 3;
    return logo.map((line, index) => {
      const copy =
        index === copyStart
          ? title
          : index === copyStart + 3
            ? commands
            : index === copyStart + 4
              ? shortcuts
              : "";
      return " ".repeat(left) + padRight(line, span) + " ".repeat(gap) + copy;
    });
  }

  const center = (text: string) =>
    " ".repeat(Math.max(0, Math.floor((width - visibleLength(text)) / 2))) + text;
  return [...logo.map(center), "", center(title), "", center(commands), center(shortcuts)];
}

export default function ampStartupScreen(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    ctx.ui.setHeader((tui) => {
      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        tui.requestRender();
      }, STEP_MS);

      return {
        render(width: number): string[] {
          const content = renderScreen(step, width);
          // Keep the editor pinned at the bottom by filling vertical space above it.
          const available = Math.max(content.length, tui.terminal.rows - 9);
          const top = Math.max(1, Math.min(18, Math.floor((available - content.length) / 2)));
          const bottom = Math.max(0, available - content.length - top);
          return [
            ...Array.from({ length: top }, () => ""),
            ...content,
            ...Array.from({ length: bottom }, () => ""),
          ];
        },
        invalidate() {},
        dispose() {
          clearInterval(interval);
        },
      };
    });
  });

  pi.registerCommand("builtin-header", {
    description: "Restore pi's built-in startup header",
    handler: async (_args, ctx) => {
      ctx.ui.setHeader(undefined);
      ctx.ui.notify("Built-in header restored", "info");
    },
  });
}
