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

rsync -a --exclude='.gitkeep' "$ROOT/configs/pi-agent/" "$PI_HOME/"
rsync -a --exclude='.gitkeep' "$ROOT/extensions/" "$PI_HOME/extensions/"
rsync -a --exclude='.gitkeep' "$ROOT/prompts/" "$PI_HOME/prompts/"
rsync -a --exclude='.gitkeep' "$ROOT/themes/" "$PI_HOME/themes/"
rsync -a "$ROOT/skills/" "$AGENTS_HOME/skills/"
rsync -a "$ROOT/configs/agents/shelf/" "$AGENTS_HOME/shelf/"

if [ -f "$ROOT/configs/agents/.skill-lock.json" ]; then
  cp "$ROOT/configs/agents/.skill-lock.json" "$AGENTS_HOME/.skill-lock.json"
fi

echo "Installed Pi setup snapshot from $ROOT"
echo "Restart Pi or run /reload in an active Pi session."
