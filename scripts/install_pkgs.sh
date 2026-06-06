#!/bin/bash
# Installs dependencies in Claude Code cloud (web) sessions only. No-op locally.
# Wired up via the SessionStart hook in .claude/settings.json.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
[ -d node_modules ] && exit 0   # cached snapshot / resume: deps already present
npm ci
exit 0
