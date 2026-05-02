#!/usr/bin/env bash
# Parallel capture runner for the cross-theme audit (#1129).
#
# Spawns playwright-crawl.ts workers (one per state) against a single dev
# server, then waits for all to finish. Cross-state workers share the server's
# warm route cache, so the total wall time is ~1/N of a serial pass.
#
# Default state set: empty + seeded. `mid-session` was dropped from the default
# pipeline as visually redundant with `seeded`; re-enable it here if needed.
#
# Usage:
#   bash scripts/audit/run-parallel.sh \
#     --branch integration-ds3-light \
#     --viewport desktop \
#     --theme ds3 \
#     --mode light
#
#   # develop branch (uses worktree on port 3001):
#   bash scripts/audit/run-parallel.sh \
#     --branch develop-default \
#     --viewport desktop \
#     --theme default \
#     --mode light \
#     --worktree /tmp/narraitor-develop-1129
#
# Parallelism notes:
#   - Each worker writes to captures/comp-<branch>/<viewport>/<state>/ so
#     there are no file-level write conflicts between workers.
#   - Seeds (seeds/<state>.json) are regenerated ONCE before workers start and
#     are read-only during the crawl. Never regenerate inside a worker.
#   - Cross-branch parallelism (4 servers) isn't done here because dev-server
#     cold-compile cost dominates. Run this script once per branch instead.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

branch=""
viewport="desktop"
theme="default"
mode="light"
worktree=""
base_url=""
skip_server=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)   branch="$2";   shift 2 ;;
    --viewport) viewport="$2"; shift 2 ;;
    --theme)    theme="$2";    shift 2 ;;
    --mode)     mode="$2";     shift 2 ;;
    --worktree) worktree="$2"; shift 2 ;;
    --base-url) base_url="$2"; shift 2 ;;
    --skip-server) skip_server=1; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$branch" ]]; then
  echo "Required: --branch <label>"
  echo "Example:  --branch integration-ds3-light --theme ds3 --mode light"
  exit 1
fi

# ---- Determine port ----
# Convention: develop runs in a worktree on :3001; integration branches
# share the main repo's dev server on :3000 (themes are localStorage-driven,
# so all integration branches use the same server). Override with --base-url.
if [[ "$theme" == "default" ]]; then
  port=3001
else
  port=3000
fi

if [[ -n "$base_url" ]]; then
  server_url="$base_url"
else
  server_url="http://localhost:$port"
fi

echo "=== Parallel crawl: branch=$branch viewport=$viewport theme=$theme/$mode ==="
echo "    Server: $server_url"

# Default states. mid-session is intentionally omitted; add it here for a
# one-off re-enable.
STATES_TO_RUN=(empty seeded)

# ---- Regenerate seeds (read-only during workers) ----
echo "--- Regenerating seeds ---"
mkdir -p "$SCRIPT_DIR/seeds"
for state in "${STATES_TO_RUN[@]}"; do
  npx tsx "$SCRIPT_DIR/build-seed.ts" --state "$state" > "$SCRIPT_DIR/seeds/$state.json"
  echo "  seeds/$state.json written"
done

# ---- Start dev server if needed ----
server_pid=""
server_started=0

if [[ "$skip_server" -eq 0 ]]; then
  if curl -sf "$server_url" > /dev/null 2>&1; then
    echo "--- Dev server already running at $server_url (reusing) ---"
  else
    echo "--- Starting dev server on port $port ---"
    if [[ -n "$worktree" ]]; then
      (cd "$worktree" && npx next dev -p "$port" &> /tmp/audit-next-$port.log &)
    else
      (cd "$REPO_ROOT" && npx next dev -p "$port" &> /tmp/audit-next-$port.log &)
    fi
    server_pid=$!
    server_started=1

    echo "    Waiting for server to respond..."
    for i in $(seq 1 60); do
      if curl -sf "$server_url" > /dev/null 2>&1; then
        echo "    Ready after ${i}s"
        break
      fi
      sleep 1
      if [[ $i -eq 60 ]]; then
        echo "ERROR: Server did not start within 60s. Log: /tmp/audit-next-$port.log"
        exit 1
      fi
    done
  fi
fi

# ---- Spawn workers (one per state) ----
echo "--- Spawning workers (states: ${STATES_TO_RUN[*]}) ---"
pids=()

for state in "${STATES_TO_RUN[@]}"; do
  npx tsx "$SCRIPT_DIR/playwright-crawl.ts" \
    --branch "$branch" \
    --viewport "$viewport" \
    --theme "$theme" \
    --mode "$mode" \
    --state "$state" \
    --base-url "$server_url" \
    &> "/tmp/audit-crawl-$branch-$viewport-$state.log" &
  pid=$!
  pids+=("$pid")
  echo "  Worker $pid: $state"
done

# ---- Wait for all workers ----
echo "--- Waiting for workers to finish ---"
failed=0
for i in "${!pids[@]}"; do
  pid="${pids[$i]}"
  state="${STATES_TO_RUN[$i]}"
  if wait "$pid"; then
    echo "  OK: $state (pid $pid)"
  else
    echo "  FAILED: $state (pid $pid) -- see /tmp/audit-crawl-$branch-$viewport-$state.log"
    failed=1
  fi
done

# ---- Teardown ----
if [[ "$server_started" -eq 1 && -n "$server_pid" ]]; then
  echo "--- Stopping dev server (pid $server_pid) ---"
  kill "$server_pid" 2>/dev/null || true
fi

if [[ "$failed" -eq 1 ]]; then
  echo "One or more workers failed. Check logs in /tmp/audit-crawl-*.log"
  exit 1
fi

echo "=== Done. Captures: scripts/audit/captures/comp-$branch/$viewport/ ==="
echo "    Regenerate review:  python3 scripts/audit/build-review-html.py"
