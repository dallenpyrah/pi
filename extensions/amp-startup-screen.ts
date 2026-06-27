/**
 * Amp-style animated dot-matrix startup screen for Pi.
 *
 * Ports the engine shape from `dotmatrix` (zzzzshawn/matrix, MIT):
 * circular mask + per-dot opacity resolver + stepped animation clock. The web
 * library renders CSS dots; this terminal version packs logical dots into
 * Unicode braille cells so the matrix stays compact and tiny like Amp.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Dense logical matrix packed into braille: each rendered character contains
// a 2x4 dot cell. This keeps the sphere compact and smaller than text dots.
const DOT_ROWS = 80;
const DOT_COLS = 92;
const CELL_DOT_ROWS = 4;
const CELL_DOT_COLS = 2;

const AMP_GREEN = "#84ecb3";
const AMP_CYAN = "#4bb7ce";
const AMP_BLUE = "#2231c6";
const AMP_MUTED = "#7a7a7a";
const AMP_TEXT = "#eeeeee";

const COPY_WIDTH = 28;
const STEP_MS = 90;
const CLEAR_SCREEN = "\x1b[2J\x1b[3J\x1b[H";

const CX = (DOT_COLS - 1) / 2;
const CY = (DOT_ROWS - 1) / 2;

const BRAILLE_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const;

function normalizedRadius(row: number, col: number): number {
  const nx = (col - CX) / (DOT_COLS / 2);
  const ny = (row - CY) / (DOT_ROWS / 2);
  return Math.hypot(nx, ny);
}

function polarAngle(row: number, col: number): number {
  return Math.atan2((row - CY) / (DOT_ROWS / 2), (col - CX) / (DOT_COLS / 2));
}

function isWithinCircularMask(row: number, col: number): boolean {
  return normalizedRadius(row, col) <= 1.015;
}

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
  const amount = row / (DOT_ROWS - 1);
  const [ar, ag, ab] = rgb(AMP_GREEN);
  const [br, bg, bb] = rgb(AMP_CYAN);
  const [cr, cg, cb] = rgb(AMP_BLUE);
  if (amount < 0.5) {
    const t = amount / 0.5;
    return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
  }
  const t = (amount - 0.5) / 0.5;
  return [br + (cr - br) * t, bg + (cg - bg) * t, bb + (cb - bb) * t];
}

// dotmatrix-style resolver: returns per-logical-dot opacity 0..1.
function resolveOpacity(row: number, col: number, step: number): number {
  const r = normalizedRadius(row, col);
  const angle = polarAngle(row, col);
  const phase = step * 0.18;

  const ripple = Math.sin(r * 9.5 - phase * 2.3);
  const swirl = Math.sin(angle * 2.2 + r * 4.5 - phase * 1.35);
  const diagonal = Math.sin((col - row * 0.45) * 0.16 - phase * 1.6);
  const combined = ripple * 0.42 + swirl * 0.32 + diagonal * 0.26;
  const rimFalloff = 1 - Math.min(1, r) * 0.45;
  return Math.max(0, Math.min(1, (combined * 0.5 + 0.5) * rimFalloff));
}

function brailleBit(dotRow: number, dotCol: number): number {
  return BRAILLE_BITS[dotRow]?.[dotCol] ?? 0;
}

function renderLogo(step: number): string[] {
  const lines: string[] = [];

  for (let cellRow = 0; cellRow < DOT_ROWS; cellRow += CELL_DOT_ROWS) {
    let line = "";

    for (let cellCol = 0; cellCol < DOT_COLS; cellCol += CELL_DOT_COLS) {
      let bits = 0;
      let opacityTotal = 0;
      let count = 0;
      let rowTotal = 0;

      for (let dy = 0; dy < CELL_DOT_ROWS; dy += 1) {
        for (let dx = 0; dx < CELL_DOT_COLS; dx += 1) {
          const row = cellRow + dy;
          const col = cellCol + dx;
          if (row >= DOT_ROWS || col >= DOT_COLS || !isWithinCircularMask(row, col)) continue;
          bits |= brailleBit(dy, dx);
          opacityTotal += resolveOpacity(row, col, step);
          rowTotal += row;
          count += 1;
        }
      }

      if (bits === 0 || count === 0) {
        line += " ";
        continue;
      }

      const opacity = opacityTotal / count;
      const avgRow = rowTotal / count;
      const [gr, gg, gb] = gradient(avgRow);
      const [hr, hg, hb] = rgb(AMP_GREEN);
      const brightness = 0.16 + opacity * 0.95;
      const litMix = opacity > 0.58 ? 0.38 : 0;
      const char = String.fromCharCode(0x2800 + bits);
      line += fgRgb(
        gr * brightness * (1 - litMix) + hr * litMix,
        gg * brightness * (1 - litMix) + hg * litMix,
        gb * brightness * (1 - litMix) + hb * litMix,
        char,
      );
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
  return Math.ceil(DOT_COLS / CELL_DOT_COLS);
}

function center(text: string, width: number): string {
  return " ".repeat(Math.max(0, Math.floor((width - visibleLength(text)) / 2))) + text;
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
    const copyStart = Math.floor(logo.length / 2) - 3;
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

  return [...logo.map((line) => center(line, width)), "", center(title, width), "", center(commands, width), center(shortcuts, width)];
}

export default function ampStartupScreen(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    // Amp starts from a clean viewport. Clear prompt/cwd text left by the shell
    // before Pi's TUI begins drawing.
    process.stdout.write(CLEAR_SCREEN);
    ctx.ui.setTitle("pi");

    ctx.ui.setHeader((tui) => {
      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        tui.requestRender();
      }, STEP_MS);

      return {
        render(width: number): string[] {
          const content = renderScreen(step, width);
          // Fill almost all rows above the editor so the input remains bottom-fixed.
          const editorReserveRows = 5;
          const available = Math.max(content.length, tui.terminal.rows - editorReserveRows);
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
