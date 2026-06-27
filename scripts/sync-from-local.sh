#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_HOME="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
AGENTS_HOME="$HOME/.agents"

mkdir -p \
  "$ROOT/configs/pi-agent" \
  "$ROOT/configs/agents/shelf" \
  "$ROOT/extensions" \
  "$ROOT/agents" \
  "$ROOT/skills" \
  "$ROOT/prompts" \
  "$ROOT/themes"

rm -rf "$ROOT/extensions.disabled" "$ROOT/skills.disabled"
COMMON_EXCLUDES=(
  --exclude='node_modules/'
  --exclude='.git/'
  --exclude='dist/'
  --exclude='build/'
  --exclude='coverage/'
  --exclude='.DS_Store'
)

rsync -a --delete "${COMMON_EXCLUDES[@]}" "$AGENTS_HOME/skills/" "$ROOT/skills/"
if [ -d "$PI_HOME/skills" ]; then
  rsync -aL "${COMMON_EXCLUDES[@]}" --exclude='code-search/' "$PI_HOME/skills/" "$ROOT/skills/"
fi
if [ -d "$PI_HOME/extensions" ]; then
  rsync -a --delete "${COMMON_EXCLUDES[@]}" --exclude='*.tar.gz' --exclude='semantic-search/' "$PI_HOME/extensions/" "$ROOT/extensions/"
  rm -f "$ROOT/extensions/package.json" "$ROOT/extensions/package-lock.json"
fi
if [ -d "$PI_HOME/agents" ]; then
  rsync -a --delete "${COMMON_EXCLUDES[@]}" "$PI_HOME/agents/" "$ROOT/agents/"
fi
if [ -d "$PI_HOME/prompts" ]; then
  rsync -a --delete "${COMMON_EXCLUDES[@]}" "$PI_HOME/prompts/" "$ROOT/prompts/"
fi

if [ -d "$PI_HOME/themes" ]; then
  rsync -a --delete "${COMMON_EXCLUDES[@]}" "$PI_HOME/themes/" "$ROOT/themes/"
fi

for file in AGENTS.md README.md settings.json models.json mcp.json mcp-onboarding.json tmux-bash.jsonc semantic-search.json; do
  if [ -f "$PI_HOME/$file" ]; then
    cp "$PI_HOME/$file" "$ROOT/configs/pi-agent/$file"
  fi
done

if [ -f "$AGENTS_HOME/.skill-lock.json" ]; then
  cp "$AGENTS_HOME/.skill-lock.json" "$ROOT/configs/agents/.skill-lock.json"
fi

for file in config.json daemon.json registry.json; do
  if [ -f "$AGENTS_HOME/shelf/$file" ]; then
    cp "$AGENTS_HOME/shelf/$file" "$ROOT/configs/agents/shelf/$file"
  fi
done

: > "$ROOT/prompts/.gitkeep"
: > "$ROOT/themes/.gitkeep"
find "$ROOT" -name .DS_Store -delete
bun run verify --silent
