#!/bin/bash
# Installs dependencies in Claude Code cloud (web) sessions only. No-op locally.
# Wired up via the SessionStart hook in .claude/settings.json, which runs AFTER
# the repo is cloned. Do NOT run npm ci from the environment setup script — that
# runs outside the repo dir, so npm can't find package-lock.json.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0   # be cwd-proof; lockfile lives at repo root
[ -d node_modules ] && exit 0             # cached snapshot / resume: deps present
npm ci
exit 0
