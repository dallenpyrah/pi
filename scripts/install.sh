#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_HOME="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
AGENTS_HOME="$HOME/.agents"

mkdir -p \
  "$PI_HOME/extensions" \
  "$PI_HOME/prompts" \
  "$PI_HOME/themes" \
  "$AGENTS_HOME/skills" \
  "$AGENTS_HOME/shelf"

rm -rf "$PI_HOME/skills/code-search"

rsync -a --exclude='.gitkeep' "$ROOT/configs/pi-agent/" "$PI_HOME/"
rsync -a --exclude='.gitkeep' "$ROOT/extensions/" "$PI_HOME/extensions/"
rsync -a --exclude='.gitkeep' "$ROOT/prompts/" "$PI_HOME/prompts/"
rsync -a --exclude='.gitkeep' "$ROOT/themes/" "$PI_HOME/themes/"
rsync -a "$ROOT/skills/" "$AGENTS_HOME/skills/"
rsync -a "$ROOT/configs/agents/shelf/" "$AGENTS_HOME/shelf/"

if [ -f "$ROOT/configs/agents/.skill-lock.json" ]; then
  cp "$ROOT/configs/agents/.skill-lock.json" "$AGENTS_HOME/.skill-lock.json"
fi

if command -v pi >/dev/null 2>&1; then
  pi install npm:@ygncode/pi-web
else
  echo "Skipped pi-web package install because pi is not on PATH."
fi

bash "$ROOT/scripts/disable-opencode-web-autostart.sh" || true

echo "Installed Pi setup snapshot from $ROOT"
echo "Restart Pi or run /reload in an active Pi session."
