#!/bin/bash

# Download Playwright HTML report from a PR's failed visual regression tests
# Usage: ./scripts/download-playwright-report.sh [PR_NUMBER]
# If no PR number provided, uses current branch's PR

set -e

# Get PR number from argument or current branch
if [ $# -eq 0 ]; then
    echo "🔍 Finding PR for current branch..."
    PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")
    if [ -z "$PR_NUMBER" ]; then
        echo "❌ No PR found for current branch. Please specify PR number:"
        echo "   ./scripts/download-playwright-report.sh <PR_NUMBER>"
        exit 1
    fi
else
    PR_NUMBER=$1
fi

echo "📋 Checking PR #$PR_NUMBER for failed Playwright tests..."

# Get the failed E2E Tests (which include visual regression tests) run ID.
# The E2E job is sharded, so its checks are named "E2E Tests (1)" / "E2E Tests (2)";
# match any failed shard leg (all shards share one workflow run id).
RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup | jq -r '.statusCheckRollup[] | select((.name | startswith("E2E Tests")) and .conclusion == "FAILURE") | .detailsUrl' | head -1 | sed 's|.*/runs/||' | sed 's|/job/.*||')

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
    echo "❌ No failed E2E Tests found for PR #$PR_NUMBER"
    echo "   Either tests passed or haven't run yet."
    exit 1
fi

echo "📥 Downloading artifacts from run $RUN_ID..."

# Always download into an isolated directory to avoid collisions with repo files (e.g., data/)
ARTIFACTS_DIR=".ci-artifacts-$RUN_ID"
rm -rf "$ARTIFACTS_DIR"
mkdir -p "$ARTIFACTS_DIR"

# Clean up any existing artifacts to avoid conflicts
if [ -d "playwright-html-report" ]; then
    echo "🧹 Cleaning up existing HTML report..."
    rm -rf playwright-html-report
fi

# Keep the repo's own data/ directory; only clean report-specific dirs
if [ -d "playwright-report" ]; then
    echo "🧹 Cleaning up existing playwright-report directory..."
    rm -rf playwright-report
fi

if [ -d "playwright-test-results" ]; then
    echo "🧹 Cleaning up existing test results cache..."
    rm -rf playwright-test-results
fi

# Clean up any previously flattened test result folders (from prior downloads)
if ls *-chromium* 1> /dev/null 2>&1; then
    echo "🧹 Cleaning up stray test result folders at repo root..."
    rm -rf *-chromium*
fi

# Avoid deleting repo's app-level data/; the report will come with its own under playwright-report/
if [ -f "index.html" ]; then
    echo "🧹 Cleaning up stray index.html from prior report..."
    rm -f index.html
fi

# Download the artifacts. The E2E job is sharded and only failed shards upload,
# so artifacts are named e2e-test-failures-shard{1,2} / playwright-html-report-shard{1,2}.
# Pull every failed shard by pattern (|| true: a pattern may match nothing if only
# one shard failed or the report wasn't produced).
echo "📦 Downloading test results (failed shards)..."
gh run download "$RUN_ID" --pattern 'e2e-test-failures-shard*' --dir "$ARTIFACTS_DIR" || true

echo "📦 Downloading HTML report (failed shards)..."
gh run download "$RUN_ID" --pattern 'playwright-html-report-shard*' --dir "$ARTIFACTS_DIR" || true

# gh --pattern nests each artifact in its own subdir; flatten the shard subdirs
# (merging contents) into the layout the rest of this script expects.
shopt -s nullglob
for shard_dir in "$ARTIFACTS_DIR"/e2e-test-failures-shard* "$ARTIFACTS_DIR"/playwright-html-report-shard*; do
    [ -d "$shard_dir" ] || continue
    echo "📁 Flattening $(basename "$shard_dir")..."
    cp -R "$shard_dir"/. "$ARTIFACTS_DIR"/
    rm -rf "$shard_dir"
done
shopt -u nullglob

# Note: e2e-test-failures contains all the test results, images and diffs
# playwright-html-report contains the interactive HTML report

# Check what was downloaded and organize it
# The artifacts are downloaded as individual folders in the current directory

# Prefer the canonical Playwright report directory if it exists
if [ -d "$ARTIFACTS_DIR/playwright-report" ]; then
    echo "📊 Found playwright-report/ artifact. Organizing..."
    mv "$ARTIFACTS_DIR/playwright-report" playwright-html-report
else
    echo "ℹ️ No playwright-report/ directory found; using fallback organization."
    mkdir -p playwright-html-report
    # If a top-level data/ or trace/ came with the report, move them under the report directory
    if [ -d "$ARTIFACTS_DIR/data" ]; then
        echo "📁 Moving downloaded report data/ into playwright-html-report/"
        mv "$ARTIFACTS_DIR/data" playwright-html-report/data
    fi
    if [ -d "$ARTIFACTS_DIR/trace" ]; then
        echo "📁 Moving downloaded trace/ into playwright-html-report/"
        mv "$ARTIFACTS_DIR/trace" playwright-html-report/trace
    fi
    # Move index.html and any bundled assets into the report directory
    if [ -f "$ARTIFACTS_DIR/index.html" ]; then
        mv "$ARTIFACTS_DIR/index.html" playwright-html-report/
    fi
    for file in "$ARTIFACTS_DIR"/*.js "$ARTIFACTS_DIR"/*.css "$ARTIFACTS_DIR"/*.png "$ARTIFACTS_DIR"/*.svg; do
        if [ -f "$file" ]; then
            mv "$file" playwright-html-report/ 2>/dev/null || true
        fi
    done
fi

# Now place test results where the HTML expects them: under playwright-html-report/test-results
TEST_ROOT="playwright-html-report/test-results"
mkdir -p "$TEST_ROOT"

# Case A: Artifact provided a test-results/ directory
if [ -d "$ARTIFACTS_DIR/test-results" ]; then
    echo "📁 Copying test-results/ into report directory..."
    # Copy to preserve original in case user wants it at repo root
    cp -R "$ARTIFACTS_DIR/test-results"/* "$TEST_ROOT/" 2>/dev/null || true
fi

# Case B: Artifact flattened result folders (e.g., *-chromium) at repo root
FLAT_COUNT=$(ls -d "$ARTIFACTS_DIR"/*-chromium* 2>/dev/null | wc -l | xargs)
if [ "$FLAT_COUNT" -gt 0 ]; then
    echo "📁 Moving flattened *-chromium* folders into report's test-results/"
    mv "$ARTIFACTS_DIR"/*-chromium* "$TEST_ROOT/" 2>/dev/null || true
fi

if [ "$(ls -A $TEST_ROOT 2>/dev/null | wc -l | xargs)" = "0" ]; then
    echo "⚠️  No test result folders detected under $TEST_ROOT. The HTML may show missing images."
else
    echo "✅ Test results ready at $TEST_ROOT"
fi

# Final pointers
if [ -d "playwright-html-report" ]; then
    echo "📊 HTML Report prepared at: $(pwd)/playwright-html-report/"

    # Automatically serve the report locally (Option 1) and open browser
    SERVE_DIR="playwright-html-report"
    # Pick an available port (prefer 8080)
    CANDIDATE_PORTS="8080 8081 8082 8090 8091"
    PORT_CHOSEN=""
    for p in $CANDIDATE_PORTS; do
        if command -v lsof >/dev/null 2>&1; then
            lsof -i :"$p" >/dev/null 2>&1 || { PORT_CHOSEN="$p"; break; }
        else
            # If lsof is unavailable, try first candidate
            PORT_CHOSEN="$p"; break
        fi
    done
    PORT_CHOSEN=${PORT_CHOSEN:-8080}

    echo "🚀 Starting local server for report on http://localhost:$PORT_CHOSEN ..."
    ( 
      cd "$SERVE_DIR" || exit 0
      if command -v python3 >/dev/null 2>&1; then
        nohup python3 -m http.server "$PORT_CHOSEN" > .playwright-report-server.log 2>&1 & echo $! > .playwright-report-server.pid
      elif command -v python >/dev/null 2>&1; then
        nohup python -m SimpleHTTPServer "$PORT_CHOSEN" > .playwright-report-server.log 2>&1 & echo $! > .playwright-report-server.pid
      elif command -v ruby >/dev/null 2>&1; then
        nohup ruby -run -e httpd . -p "$PORT_CHOSEN" > .playwright-report-server.log 2>&1 & echo $! > .playwright-report-server.pid
      else
        echo "⚠️ No python3/python/ruby found to serve the report. Open index.html directly: $(pwd)/index.html"
        exit 0
      fi
    )
    SERVER_PID="$(cat "$SERVE_DIR/.playwright-report-server.pid" 2>/dev/null || echo "")"
    if [ -n "$SERVER_PID" ]; then
      echo "✅ Report server running (PID $SERVER_PID): http://localhost:$PORT_CHOSEN"
      # Best-effort open in default browser
      if command -v open >/dev/null 2>&1; then
        open "http://localhost:$PORT_CHOSEN" >/dev/null 2>&1 || true
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:$PORT_CHOSEN" >/dev/null 2>&1 || true
      fi
      echo "ℹ️  To stop the server: kill $SERVER_PID  # from repo root, or rm $SERVE_DIR/.playwright-report-server.pid"
      echo "📝 Logs: $SERVE_DIR/.playwright-report-server.log"
    else
      echo "⚠️ Failed to start report server. You can still open the report file: $SERVE_DIR/index.html"
    fi
fi
