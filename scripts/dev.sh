#!/usr/bin/env bash
#
# Start the Next.js dev server on this checkout's own port.
#
# The main checkout uses 3000; each git worktree gets its own stable port
# (see scripts/worktree-port.js), so multiple worktrees can run dev servers
# at once without fighting over 3000. We only free the port we're about to
# use, never a hard-coded 3000 that might belong to another worktree.
#
# Override with PORT=xxxx npm run dev.
set -euo pipefail

cd "$(dirname "$0")/.."

"scripts/sync-local-env.sh"

port="$(node scripts/worktree-port.js)"

bash scripts/kill-port.sh "$port"

echo ""
echo "Narraitor dev server -> http://localhost:$port"
echo ""

exec next dev -p "$port" "$@"
