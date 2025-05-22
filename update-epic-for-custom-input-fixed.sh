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

# Create a properly formatted JSON file for the comment content
cat > comment.json << 'EOL'
{
  "body": "## Epic Update: Narrative Engine Enhancements\n\n### ✅ Completed\n- **Issue #304**: Generated meaningful player choices based on narrative context\n  - Implemented ChoiceGenerator to create contextually relevant options\n  - Added PlayerChoiceSelector component for UI representation\n  - Enhanced narrativeStore with decision management\n  - Integrated with existing narrative generation system\n\n### 📋 New Related Issues\n- **Issue #389**: Custom player input enhancement\n  - Will build on the foundation established in #304\n  - Adds ability for players to type custom responses\n  - Increases player agency and creative expression\n  - Will be a valuable enhancement to the choice system\n\n### 🔄 Progress Update\nThe narrative engine now has foundational player choice capabilities, with AI-generated contextual options. The next step with issue #389 will be to enhance this system with free-text player input capabilities, allowing for a more flexible narrative experience."
}
EOL

# Create a comment on the epic issue using the GitHub API
echo "Updating epic issue #379..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d @comment.json \
  https://api.github.com/repos/jerseycheese/Narraitor/issues/379/comments

# Clean up
rm comment.json

echo "Epic update comment sent. Check GitHub to confirm."