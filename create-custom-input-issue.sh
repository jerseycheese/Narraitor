#!/bin/bash

# Ensure GitHub token is configured
if [ -z "$GITHUB_TOKEN" ]; then
  # Check if token exists in .env.local
  if [ -f ".env.local" ]; then
    export GITHUB_TOKEN=$(grep "GITHUB_TOKEN" .env.local | sed 's/^GITHUB_TOKEN=//' | sed 's/^[ \t]*//;s/[ \t]*$//' | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
  fi
  
  # Check in Claude's directory
  if [ -z "$GITHUB_TOKEN" ] && [ -f "$HOME/.claude/.github_token" ]; then
    export GITHUB_TOKEN=$(cat "$HOME/.claude/.github_token")
  fi
  
  # Try gh cli
  if [ -z "$GITHUB_TOKEN" ]; then
    if command -v gh &> /dev/null; then
      export GITHUB_TOKEN=$(gh auth token)
    fi
  fi
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GitHub token not found. Please run ./scripts/setup-github-token.sh first."
  exit 1
fi

# Read the file content and escape properly for JSON
BODY_CONTENT=$(cat /Users/jackhaas/Projects/narraitor/custom-player-input-enhancement.md | 
  grep -v '\-\-\-' | 
  grep -v 'name:' | 
  grep -v 'about:' | 
  grep -v 'title:' | 
  grep -v 'labels:' | 
  grep -v 'assignees:' | 
  sed 's/\\/\\\\/g' | 
  sed 's/"/\\"/g' | 
  awk '{printf "%s\\n", $0}')

# Create the issue using the GitHub API
echo "Creating GitHub issue..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"title\":\"Add custom player input option to choice system\", \"body\":\"$BODY_CONTENT\", \"labels\":[\"enhancement\", \"epic:narrative-engine\"]}" \
  https://api.github.com/repos/jerseycheese/Narraitor/issues

echo "Issue creation request sent. Check GitHub to confirm creation."