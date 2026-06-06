#!/bin/bash
# Installs dependencies in Claude Code cloud (web) sessions only. No-op locally.
# Wired up via the SessionStart hook in .claude/settings.json, which runs AFTER
# the repo is cloned. Do NOT run npm ci from the environment setup script — that
# runs outside the repo dir, so npm can't find package-lock.json.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0   # be cwd-proof; lockfile lives at repo root
# Skip only if a prior install COMPLETED — npm writes node_modules/.package-lock.json
# on success, so a partial/failed install isn't mistaken for a good one on resume.
[ -f node_modules/.package-lock.json ] && exit 0
npm ci   # final command: its exit status becomes the hook's, so failures surface
