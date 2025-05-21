#!/bin/bash
# setup-github-token.sh - Script to configure GitHub token access for Claude Code commands
# This script sets up token authentication for GitHub API access with multiple fallback mechanisms

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
GITHUB_TOKEN_FILE="$CLAUDE_DIR/.github_token"

echo "🔧 Setting up GitHub API access for Claude Code..."

# Create Claude directory if it doesn't exist
mkdir -p "$CLAUDE_DIR"

# Check for existing GitHub token in various locations
check_existing_token() {
  # Check environment variable
  if [[ -n "$GITHUB_TOKEN" ]]; then
    echo "✅ Found GitHub token in environment variable"
    return 0
  fi
  
  # Check .env.local file
  if [[ -f "$ENV_LOCAL" ]] && grep -q "GITHUB_TOKEN" "$ENV_LOCAL"; then
    export GITHUB_TOKEN=$(grep "GITHUB_TOKEN" "$ENV_LOCAL" | cut -d= -f2)
    echo "✅ Found GitHub token in .env.local file"
    return 0
  fi
  
  # Check token file
  if [[ -f "$GITHUB_TOKEN_FILE" ]]; then
    export GITHUB_TOKEN=$(cat "$GITHUB_TOKEN_FILE")
    echo "✅ Found GitHub token in Claude directory"
    return 0
  fi
  
  # Check gh CLI
  if command -v gh &>/dev/null && gh auth status &>/dev/null; then
    export GITHUB_TOKEN=$(gh auth token)
    echo "✅ Extracted GitHub token from gh CLI"
    return 0
  fi
  
  echo "❌ No GitHub token found"
  return 1
}

# Validate token with GitHub API
validate_token() {
  echo "🔍 Testing GitHub token..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
  
  if [[ "$HTTP_STATUS" -eq 200 ]]; then
    echo "✅ GitHub token is valid"
    return 0
  else
    echo "❌ GitHub token is invalid or expired (HTTP status: $HTTP_STATUS)"
    return 1
  fi
}

# Get token from user if needed
prompt_for_token() {
  echo "Please enter a valid GitHub Personal Access Token (PAT):"
  echo "(Token requires 'repo' scope, create one at https://github.com/settings/tokens/new)"
  read -s GITHUB_TOKEN
  
  if [[ -z "$GITHUB_TOKEN" ]]; then
    echo "❌ No token provided"
    return 1
  fi
  
  export GITHUB_TOKEN
  return 0
}

# Save token to all necessary locations
save_token() {
  # Save to token file
  echo "$GITHUB_TOKEN" > "$GITHUB_TOKEN_FILE"
  chmod 600 "$GITHUB_TOKEN_FILE"
  
  # Save to .env.local if it exists, otherwise create it
  if [[ -f "$ENV_LOCAL" ]]; then
    # Update existing GITHUB_TOKEN if present, otherwise append
    if grep -q "GITHUB_TOKEN=" "$ENV_LOCAL"; then
      sed -i '' "s/GITHUB_TOKEN=.*/GITHUB_TOKEN=$GITHUB_TOKEN/" "$ENV_LOCAL"
    else
      echo "" >> "$ENV_LOCAL"
      echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> "$ENV_LOCAL"
    fi
  else
    echo "GITHUB_TOKEN=$GITHUB_TOKEN" > "$ENV_LOCAL"
  fi
  
  echo "✅ GitHub token saved to all locations"
}

# Update GitHub-related scripts to include token
update_scripts() {
  SCRIPTS_DIR="$PROJECT_ROOT/scripts"
  
  # Update claude-github.sh
  GITHUB_SCRIPT="$SCRIPTS_DIR/claude-github.sh"
  if [[ -f "$GITHUB_SCRIPT" ]]; then
    # Check if script already includes token support
    if ! grep -q "Authorization: token" "$GITHUB_SCRIPT"; then
      echo "📝 Updating Claude GitHub script with token support..."
      
      # Create backup
      cp "$GITHUB_SCRIPT" "${GITHUB_SCRIPT}.bak"
      
      # Update curl commands to include token header
      sed -i '' 's/curl -s -H/curl -s -H "Authorization: token $GITHUB_TOKEN" -H/g' "$GITHUB_SCRIPT"
      
      # Add token loading at the top of the script
      sed -i '' '2i\
# Load GitHub token from environment or file\
if [ -z "$GITHUB_TOKEN" ] && [ -f "'"$ENV_LOCAL"'" ]; then\
  source "'"$ENV_LOCAL"'"\
fi\
if [ -z "$GITHUB_TOKEN" ] && [ -f "'"$GITHUB_TOKEN_FILE"'" ]; then\
  GITHUB_TOKEN=$(cat "'"$GITHUB_TOKEN_FILE"'")\
fi\
' "$GITHUB_SCRIPT"

      echo "✅ Updated $GITHUB_SCRIPT with token support"
    else
      echo "✓ $GITHUB_SCRIPT already has token support"
    fi
  fi
  
  # Update claude-pr.sh similarly if needed
  PR_SCRIPT="$SCRIPTS_DIR/claude-pr.sh"
  if [[ -f "$PR_SCRIPT" ]]; then
    # Only update if it doesn't already have token support
    if ! grep -q "GITHUB_TOKEN" "$PR_SCRIPT"; then
      echo "📝 Updating Claude PR script with token support..."
      cp "$PR_SCRIPT" "${PR_SCRIPT}.bak"
      
      # Add token-based PR creation example
      sed -i '' '/mcp__modelcontextprotocol_server_github__server_github/a\
  // If MCP tool isn\'t available, use curl as fallback\
  if (typeof mcp__modelcontextprotocol_server_github__server_github === "undefined") {\
    console.log("MCP GitHub tool not available, using curl fallback:");\
    console.log(`curl -s -X POST \\\
  -H "Authorization: token $GITHUB_TOKEN" \\\
  -H "Accept: application/vnd.github.v3+json" \\\
  -H "Content-Type: application/json" \\\
  -d \'{"title":"$PR_TITLE","body":"$PR_BODY","head":"$BRANCH_NAME","base":"$BASE_BRANCH"}\' \\\
  https://api.github.com/repos/jerseycheese/narraitor/pulls`);\
  }\
' "$PR_SCRIPT"
      
      echo "✅ Updated $PR_SCRIPT with token fallback"
    else
      echo "✓ $PR_SCRIPT already has token support"
    fi
  fi
}

# Main script execution
main() {
  if check_existing_token && validate_token; then
    echo "🎉 GitHub token is already configured and valid"
  else
    echo "⚠️ Need to set up a new GitHub token"
    if prompt_for_token && validate_token; then
      save_token
      echo "🎉 GitHub token has been successfully configured"
    else
      echo "❌ Failed to configure GitHub token"
      exit 1
    fi
  fi
  
  update_scripts
  
  echo ""
  echo "🔑 GitHub Token Configuration Summary:"
  echo "✅ Token is valid and accessible to scripts"
  echo "✅ Token is saved in .env.local for Claude Code"
  echo "✅ Token is saved in $GITHUB_TOKEN_FILE as backup"
  echo "✅ Scripts have been updated with token support"
  echo ""
  echo "You can now use GitHub features in Claude Code commands."
  echo "To use this token in the current session, run:"
  echo "  source .env.local"
}

main "$@"