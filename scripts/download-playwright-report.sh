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

# Get the failed E2E Tests (which include visual regression tests) run ID
RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup | jq -r '.statusCheckRollup[] | select(.name == "E2E Tests" and .conclusion == "FAILURE") | .detailsUrl' | head -1 | sed 's|.*/runs/||' | sed 's|/job/.*||')

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
    echo "❌ No failed E2E Tests found for PR #$PR_NUMBER"
    echo "   Either tests passed or haven't run yet."
    exit 1
fi

echo "📥 Downloading artifacts from run $RUN_ID..."

# Clean up any existing artifacts to avoid conflicts
if [ -d "playwright-html-report" ]; then
    echo "🧹 Cleaning up existing HTML report..."
    rm -rf playwright-html-report
fi

if [ -d "playwright-test-results" ]; then
    echo "🧹 Cleaning up existing test results..."
    rm -rf playwright-test-results
fi

# Clean up any existing test result folders
if ls *-chromium* 1> /dev/null 2>&1; then
    echo "🧹 Cleaning up existing test result folders..."
    rm -rf *-chromium*
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
echo "📦 Downloading test results..."
gh run download $RUN_ID --name e2e-test-failures

echo "📦 Downloading HTML report..."
gh run download $RUN_ID --name playwright-html-report

# Note: e2e-test-failures contains all the test results, images and diffs
# playwright-html-report contains the interactive HTML report

# Check what was downloaded and organize it
# The artifacts are downloaded as individual folders in the current directory
TEST_FOLDERS=$(ls -d *-chromium* 2>/dev/null | wc -l | xargs)
if [ "$TEST_FOLDERS" -gt 0 ]; then
    # Create organized directory structure
    mkdir -p playwright-test-results
    mv *-chromium* playwright-test-results/ 2>/dev/null || true
    
    echo "✅ Downloaded test results successfully!"
    echo "🖼️  Test Results: playwright-test-results/ (contains actual, expected, diff images and videos)"
    echo ""
    echo "📁 Test result folders:"
    ls -1 playwright-test-results/ | head -10
    if [ $(ls -1 playwright-test-results/ | wc -l) -gt 10 ]; then
        echo "... and $(( $(ls -1 playwright-test-results/ | wc -l) - 10 )) more"
    fi
    
    echo ""
    echo "💡 To view individual test failures:"
    echo "   • Open any folder in playwright-test-results/"
    echo "   • View *-diff.png to see visual differences"
    echo "   • Compare *-actual.png vs *-expected.png"
    echo "   • Watch video.webm to see test execution"
    echo ""
    echo "🎯 Files downloaded:"
    echo "   📁 Test Results: $(pwd)/playwright-test-results/"
    if [ -d "playwright-test-results" ]; then
        echo "   🖼️  Visual Diffs: $(pwd)/playwright-test-results/"
    fi
    if [ -d "playwright-html-report" ]; then
        echo "   📊 HTML Report: $(pwd)/playwright-html-report/"
        echo ""
        echo "🌐 To view the interactive HTML report:"
        echo "   npx playwright show-report playwright-html-report"
        echo "   # Opens at http://localhost:9323"
    fi
else
    echo "❌ Failed to download test results. Check if artifacts are available."
fi