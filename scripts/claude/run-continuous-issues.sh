#!/bin/bash

# Script to prepare and run the continuous issues process
# Usage: ./scripts/run-continuous-issues.sh [number_of_issues] [github_token]

# Default values
NUM_ISSUES=${1:-3}
GITHUB_TOKEN=$2

# Create and prepare the queue
echo "Preparing issue queue with up to $NUM_ISSUES issues..."
if [ -n "$GITHUB_TOKEN" ]; then
  node ./scripts/process-issues.js $NUM_ISSUES $GITHUB_TOKEN
else
  node ./scripts/process-issues.js $NUM_ISSUES
fi

if [ $? -ne 0 ]; then
  echo "Failed to prepare issue queue. Exiting."
  exit 1
fi

echo ""
echo "Queue preparation complete."
echo ""

echo "Run the following command in Claude Code to process the issues:"
echo "/project:do-continuous-issues" ${1:-""} ${2:-""}
echo ""
echo "Or run:"
echo "/project:do-continuous-issues $NUM_ISSUES" ${2:-""}