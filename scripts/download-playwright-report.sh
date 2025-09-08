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

# Get the failed Visual Regression Tests run ID
RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup | jq -r '.statusCheckRollup[] | select(.name == "Visual Regression Tests" and .conclusion == "FAILURE") | .detailsUrl' | head -1 | sed 's|.*/runs/||' | sed 's|/job/.*||')

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
    echo "❌ No failed Visual Regression Tests found for PR #$PR_NUMBER"
    echo "   Either tests passed or haven't run yet."
    exit 1
fi

echo "📥 Downloading artifacts from run $RUN_ID..."

# Clean up any existing artifacts to avoid conflicts
if [ -d "playwright-html-report" ]; then
    echo "🧹 Cleaning up existing report files..."
    rm -rf playwright-html-report
fi

if [ -d "playwright-test-results" ]; then
    echo "🧹 Cleaning up existing test results..."
    rm -rf playwright-test-results
fi

if [ -d "data" ]; then
    echo "🧹 Cleaning up existing data directory..."
    rm -rf data
fi

if [ -d "trace" ]; then
    echo "🧹 Cleaning up existing trace directory..."
    rm -rf trace
fi

if [ -f "index.html" ]; then
    echo "🧹 Cleaning up existing index.html..."
    rm -f index.html
fi

# Download the artifacts
echo "📦 Downloading HTML report..."
gh run download $RUN_ID --name playwright-html-report

# Also download test results if available (contains actual vs expected images)
echo "📦 Downloading test results (images and diffs)..."
gh run download $RUN_ID --name playwright-test-results 2>/dev/null || echo "ℹ️  Test results artifact not available"

# Check what was downloaded and organize it
if [ -f "index.html" ] && [ -d "data" ]; then
    # Create organized directory structure
    mkdir -p playwright-html-report
    mv index.html data trace playwright-html-report/ 2>/dev/null || true
    
    # Move test result directories if they exist
    for dir in basic-*; do
        if [ -d "$dir" ]; then
            mkdir -p playwright-test-results
            mv "$dir" playwright-test-results/ 2>/dev/null || true
        fi
    done
    
    echo "✅ Downloaded and organized artifacts successfully!"
    echo "📊 HTML Report: playwright-html-report/"
    if [ -d "playwright-test-results" ]; then
        echo "🖼️  Test Images: playwright-test-results/ (actual, expected, diffs)"
    fi
    
    echo "🌐 Opening HTML report..."
    
    # Open the report in default browser
    if command -v open >/dev/null 2>&1; then
        open playwright-html-report/index.html
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open playwright-html-report/index.html
    else
        echo "📂 Manual: Open playwright-html-report/index.html in your browser"
    fi
    
    echo ""
    echo "🎯 Files downloaded:"
    echo "   📊 Interactive Report: $(pwd)/playwright-html-report/index.html"
    if [ -d "playwright-test-results" ]; then
        echo "   🖼️  Visual Diffs: $(pwd)/playwright-test-results/"
    fi
else
    echo "❌ Failed to download HTML report. Check if artifacts are available."
fi