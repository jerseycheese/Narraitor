#!/usr/bin/env bash
# Wrapper to launch Chrome DevTools MCP
# Replaces the Playwright MCP setup

set -euo pipefail

echo "[mcp-chrome] Launching Chrome DevTools MCP server..."

# Launch the Chrome DevTools MCP server via npx
exec npx -y chrome-devtools-mcp --isolated
