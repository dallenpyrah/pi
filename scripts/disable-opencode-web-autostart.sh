#!/usr/bin/env bash
set -euo pipefail

PATTERN='opencode-web|opencode-web-child|com[.]dallen[.]opencode-web|opencode[[:space:]_-]+web'

disable_file() {
  local file="$1"
  local disabled_dir="$2"
  local service_name="${3:-}"
  local base
  base="$(basename "$file")"
  mkdir -p "$disabled_dir"
  mv -f "$file" "$disabled_dir/${base}.disabled"
  if [[ -n "$service_name" ]]; then
    echo "Disabled opencode web autostart: ${service_name}"
  else
    echo "Disabled opencode web autostart: ${base}"
  fi
}

disable_macos_launchd() {
  [[ "$(uname -s)" == "Darwin" ]] || return 0
  local launch_dir="$HOME/Library/LaunchAgents"
  [[ -d "$launch_dir" ]] || return 0
  local disabled_dir="$HOME/Library/LaunchAgents.disabled"
  local plist label
  for plist in "$launch_dir"/*.plist; do
    [[ -e "$plist" ]] || continue
    if [[ "$(basename "$plist")" != *opencode*web*.plist ]] && ! grep -Eiq "$PATTERN" "$plist"; then
      continue
    fi
    label="$(/usr/libexec/PlistBuddy -c 'Print :Label' "$plist" 2>/dev/null || true)"
    launchctl bootout "gui/$(id -u)" "$plist" >/dev/null 2>&1 || true
    if [[ -n "$label" ]]; then
      launchctl remove "$label" >/dev/null 2>&1 || true
    fi
    disable_file "$plist" "$disabled_dir" "${label:-$(basename "$plist")}"
  done
}

disable_systemd_user() {
  local service_dir="$HOME/.config/systemd/user"
  [[ -d "$service_dir" ]] || return 0
  local disabled_dir="$HOME/.config/systemd/user.disabled"
  local service unit
  for service in "$service_dir"/*.service; do
    [[ -e "$service" ]] || continue
    if [[ "$(basename "$service")" != *opencode*web*.service ]] && ! grep -Eiq "$PATTERN" "$service"; then
      continue
    fi
    unit="$(basename "$service")"
    systemctl --user disable --now "$unit" >/dev/null 2>&1 || true
    disable_file "$service" "$disabled_dir" "$unit"
  done
  systemctl --user daemon-reload >/dev/null 2>&1 || true
}

disable_xdg_autostart() {
  local autostart_dir="$HOME/.config/autostart"
  [[ -d "$autostart_dir" ]] || return 0
  local disabled_dir="$HOME/.config/autostart.disabled"
  local desktop
  for desktop in "$autostart_dir"/*.desktop; do
    [[ -e "$desktop" ]] || continue
    if [[ "$(basename "$desktop")" != *opencode*web*.desktop ]] && ! grep -Eiq "$PATTERN" "$desktop"; then
      continue
    fi
    disable_file "$desktop" "$disabled_dir" "$(basename "$desktop")"
  done
}

stop_running_opencode_web() {
  command -v pgrep >/dev/null 2>&1 || return 0
  local line pid
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    pid="${line%% *}"
    [[ "$pid" =~ ^[0-9]+$ ]] || continue
    [[ "$pid" != "$$" ]] || continue
    kill "$pid" >/dev/null 2>&1 || true
  done < <(pgrep -af '(^|/)opencode-web($|[[:space:]-])|opencode-web-child' 2>/dev/null || true)
}

disable_macos_launchd
disable_systemd_user
disable_xdg_autostart
stop_running_opencode_web
