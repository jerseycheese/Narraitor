#!/bin/bash
# Test script for update-user-stories.js

# Set environment variables
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable not set."
  echo "Please set it first: export GITHUB_TOKEN=your_token"
  exit 1
fi

echo "==============================================="
echo "Testing update-user-stories.js functionality"
echo "==============================================="

# Update paths to account for new directory structure
SCRIPTS_DIR=$(dirname $0)/..

# 1. Test validation mode on a single issue
echo -e "\nTest 1: Validating a single issue (#217)"
node $SCRIPTS_DIR/user-stories/update-user-stories.js --validate --issue 217

# 2. Test validation mode with limiting
echo -e "\nTest 2: Validating with limit"
node $SCRIPTS_DIR/user-stories/update-user-stories.js --validate --limit 3

# 3. Test dry run on a single issue
echo -e "\nTest 3: Dry run on a single issue (#217)"
node $SCRIPTS_DIR/user-stories/update-user-stories.js --dry-run --issue 217

# 4. Test standalone validation script
echo -e "\nTest 4: Standalone validation script on a single issue"
node $SCRIPTS_DIR/user-stories/validate-user-stories.js --issue 217

echo -e "\nAll tests completed!"
echo "To apply changes to a single issue:"
echo "  node $SCRIPTS_DIR/user-stories/update-user-stories.js --issue 217"
echo "To apply changes to all issues:"
echo "  node $SCRIPTS_DIR/user-stories/update-user-stories.js"