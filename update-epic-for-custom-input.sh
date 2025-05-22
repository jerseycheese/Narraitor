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

# Update the epic with information about the newly implemented feature and new enhancement
COMMENT_CONTENT="## Epic Update: Narrative Engine Enhancements

### ✅ Completed
- **Issue #304**: Generated meaningful player choices based on narrative context
  - Implemented ChoiceGenerator to create contextually relevant options
  - Added PlayerChoiceSelector component for UI representation
  - Enhanced narrativeStore with decision management
  - Integrated with existing narrative generation system

### 📋 New Related Issues
- **Issue #389**: Custom player input enhancement
  - Will build on the foundation established in #304
  - Adds ability for players to type custom responses
  - Increases player agency and creative expression
  - Will be a valuable enhancement to the choice system

### 🔄 Progress Update
The narrative engine now has foundational player choice capabilities, with AI-generated contextual options. The next step with issue #389 will be to enhance this system with free-text player input capabilities, allowing for a more flexible narrative experience."

# Create a comment on the epic issue using the GitHub API
echo "Updating epic issue #379..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"body\":\"$COMMENT_CONTENT\"}" \
  https://api.github.com/repos/jerseycheese/Narraitor/issues/379/comments

echo "Epic update comment sent. Check GitHub to confirm."