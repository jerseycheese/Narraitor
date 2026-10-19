#!/usr/bin/env bash
# Makes sure this checkout has node_modules. Runs from the SessionStart hook in
# .claude/settings.json (after the repo is cloned) and from scripts/dev.sh.
#
# - Already installed: no-op.
# - Linked git worktree: symlink the main checkout's node_modules, as long as the
#   lockfiles match. A branch with different deps gets its own npm ci instead.
# - Cloud session or no node_modules at all: npm ci.
#
# Do NOT run npm ci from the cloud environment setup script — that runs outside
# the repo dir, so npm can't find package-lock.json.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"   # be cwd-proof; lockfile lives at repo root
current_root="$(pwd -P)"

# A broken symlink (main checkout's node_modules was deleted) is dropped and redone.
[ -L node_modules ] && [ ! -e node_modules ] && rm node_modules
[ -L node_modules ] && exit 0
# Skip only if a prior install COMPLETED — npm writes node_modules/.package-lock.json
# on success, so a partial/failed install isn't mistaken for a good one on resume.
[ -f node_modules/.package-lock.json ] && exit 0

# The first entry in `git worktree list` is always the main checkout.
primary_root="$(git worktree list --porcelain 2>/dev/null | awk '/^worktree / { print substr($0, 10); exit }')"
primary_root="$(cd "${primary_root:-.}" && pwd -P)"

if [ "$primary_root" != "$current_root" ] &&
  [ ! -e node_modules ] &&
  [ -f "$primary_root/node_modules/.package-lock.json" ] &&
  cmp -s package-lock.json "$primary_root/package-lock.json"; then
  ln -s "$primary_root/node_modules" node_modules
  echo "Linked node_modules from $primary_root"
  exit 0
fi

npm ci   # final command: its exit status becomes the hook's, so failures surface
