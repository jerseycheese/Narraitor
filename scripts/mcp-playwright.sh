#!/usr/bin/env bash
# Wrapper to launch Playwright MCP with a clean, ephemeral browser session
# Prevents the long-standing "blank tabs" issue from stale persistent profiles

set -euo pipefail

echo "[mcp-playwright] Preparing clean session..."

# Kill any lingering MCP Chrome processes from previous runs (best-effort)
if command -v pkill >/dev/null 2>&1; then
  pkill -f "mcp-chrome-" 2>/dev/null || true
fi

# Clean any stale user-data dirs that Playwright MCP tends to reuse
CACHE_ROOT="$HOME/Library/Caches/ms-playwright"
if [ -d "$CACHE_ROOT" ]; then
  find "$CACHE_ROOT" -maxdepth 1 -type d -name 'mcp-chrome-*' -print0 2>/dev/null | xargs -0 rm -rf 2>/dev/null || true
fi

# Create a unique, ephemeral user-data-dir for this session to avoid reuse
SESSION_DIR="$(pwd)/.playwright-mcp/tmp/session-$(date +%s)-$RANDOM"
mkdir -p "$SESSION_DIR"

# Harden Chrome launch args to avoid session-restore bubbles and blank tabs
export PLAYWRIGHT_CHROMIUM_ARGS="${PLAYWRIGHT_CHROMIUM_ARGS:-} --no-first-run --no-default-browser-check --restore-last-session=false --hide-crash-restore-bubble --disable-features=AutofillServerCommunication --disable-session-crashed-bubble"

# Prefer Chromium bundled with Playwright; do not download new browsers here
export PLAYWRIGHT_BROWSERS_PATH=0
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

echo "[mcp-playwright] Launching server with fresh profile: $SESSION_DIR"

# Launch the official Playwright MCP server via npx. We do not assume any flags
# support from the package; the cleanup + ephemeral profile above addresses the root issue.
exec npx -y @modelcontextprotocol/server-playwright

