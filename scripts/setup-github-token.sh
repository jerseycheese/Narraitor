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
    # Extract token, removing any leading or trailing whitespace and quotes
    export GITHUB_TOKEN=$(grep "GITHUB_TOKEN" "$ENV_LOCAL" | sed 's/^GITHUB_TOKEN=//' | sed 's/^[ \t]*//;s/[ \t]*$//' | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
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
  RESPONSE_FILE=$(mktemp)
  HTTP_STATUS=$(curl -s -o "$RESPONSE_FILE" -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
  
  if [[ "$HTTP_STATUS" -eq 200 ]]; then
    echo "✅ GitHub token is valid"
    USERNAME=$(grep -o '"login"[^,]*' "$RESPONSE_FILE" | cut -d'"' -f4)
    echo "✅ Authenticated as GitHub user: $USERNAME"
    rm "$RESPONSE_FILE"
    return 0
  else
    echo "❌ GitHub token is invalid or expired (HTTP status: $HTTP_STATUS)"
    ERROR_MSG=$(grep -o '"message"[^,]*' "$RESPONSE_FILE" | cut -d'"' -f4)
    if [[ -n "$ERROR_MSG" ]]; then
      echo "   Error details: $ERROR_MSG"
    fi
    rm "$RESPONSE_FILE"
    
    # Show token format hint if it looks malformed
    if [[ ! "$GITHUB_TOKEN" =~ ^gh[ps]_[A-Za-z0-9]{36,}$ ]]; then
      echo "⚠️ Token format appears incorrect. GitHub tokens should start with 'ghp_' or 'ghs_'"
      echo "   and be followed by at least 36 characters."
    fi
    return 1
  fi
}

# Get token from user if needed
prompt_for_token() {
  echo ""
  echo "🔐 You need to create a GitHub Personal Access Token (PAT)"
  echo "════════════════════════════════════════════════════════"
  echo "1. Go to: https://github.com/settings/tokens/new"
  echo "2. Note: 'Narraitor Claude Code Access'"
  echo "3. Expiration: Select an appropriate expiration (90 days recommended)"
  echo "4. Select scopes: [✓] repo (Full control of private repositories)"
  echo "5. Click 'Generate token'"
  echo "6. Copy the generated token and paste it below"
  echo "════════════════════════════════════════════════════════"
  echo ""
  echo "Please enter your GitHub Personal Access Token:"
  read -s GITHUB_TOKEN
  echo ""
  
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

# Main script execution
main() {
  # First try to use existing token
  if check_existing_token && validate_token; then
    echo "🎉 GitHub token is already configured and valid"
    save_token  # Ensure token is saved in all locations
  else
    echo "⚠️ Need to set up a new GitHub token"
    
    # Try three times to get a valid token
    MAX_ATTEMPTS=3
    for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
      echo "Attempt $attempt of $MAX_ATTEMPTS"
      
      if prompt_for_token; then
        if validate_token; then
          save_token
          echo "🎉 GitHub token has been successfully configured"
          break
        else
          echo "⚠️ Token validation failed. Please try again with a valid token."
          if [[ $attempt -eq $MAX_ATTEMPTS ]]; then
            echo "❌ Maximum attempts reached. Failed to configure GitHub token."
            echo "Please try again later or contact your administrator for help."
            exit 1
          fi
        fi
      else
        echo "❌ No token provided. Exiting."
        exit 1
      fi
    done
  fi
  
  echo ""
  echo "🔑 GitHub Token Configuration Summary:"
  echo "✅ Token is valid and accessible to scripts"
  echo "✅ Token is saved in .env.local for Claude Code"
  echo "✅ Token is saved in $GITHUB_TOKEN_FILE as backup"
  echo ""
  echo "You can now use GitHub features in Claude Code commands:"
  echo "  ./scripts/claude-github.sh issue 123       # Get issue details"
  echo "  ./scripts/claude-github.sh close-issue 123 # Close an issue"
  echo "  ./scripts/claude-pr.sh 123 branch-name     # Create a PR for issue"
  echo ""
  echo "To use this token in the current shell session, run:"
  echo "  export GITHUB_TOKEN=\"$(cat $GITHUB_TOKEN_FILE)\""
}

main "$@"