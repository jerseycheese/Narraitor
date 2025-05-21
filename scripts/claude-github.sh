#!/bin/bash

# Claude GitHub Helper - A wrapper for GitHub API calls in Claude Code
# This script allows Claude Code to make GitHub API calls without prompting for permission
# Usage: ./claude-github.sh [command] [arguments...]

# Get project root directory
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
GITHUB_TOKEN_FILE="$CLAUDE_DIR/.github_token"

# Load GitHub token from various sources
load_github_token() {
  # Check environment variable
  if [[ -n "$GITHUB_TOKEN" ]]; then
    return 0
  fi
  
  # Check .env.local file
  if [[ -f "$ENV_LOCAL" ]] && grep -q "GITHUB_TOKEN" "$ENV_LOCAL"; then
    # Extract token, removing any leading or trailing whitespace and quotes
    export GITHUB_TOKEN=$(grep "GITHUB_TOKEN" "$ENV_LOCAL" | sed 's/^GITHUB_TOKEN=//' | sed 's/^[ \t]*//;s/[ \t]*$//' | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
    return 0
  fi
  
  # Check token file
  if [[ -f "$GITHUB_TOKEN_FILE" ]]; then
    export GITHUB_TOKEN=$(cat "$GITHUB_TOKEN_FILE")
    return 0
  fi
  
  # Check gh CLI
  if command -v gh &>/dev/null && gh auth status &>/dev/null; then
    export GITHUB_TOKEN=$(gh auth token)
    return 0
  fi
  
  return 1
}

# Validate the GitHub token
validate_github_token() {
  if [ -z "$GITHUB_TOKEN" ]; then
    return 1
  fi
  
  # Make a simple API call to validate token
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
  
  if [[ "$HTTP_STATUS" -eq 200 ]]; then
    return 0
  else
    return 1
  fi
}

# Load the token
load_github_token

# Verify token is available and valid
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️ Warning: No GitHub token found. API requests will be rate-limited and may fail."
  echo "Run ./scripts/setup-github-token.sh to configure your token."
elif ! validate_github_token; then
  echo "⚠️ Warning: GitHub token is invalid or expired."
  echo "Run ./scripts/setup-github-token.sh to configure a new token."
fi

# Command: issue - Fetch a GitHub issue
# Usage: ./claude-github.sh issue [issue-number]
issue() {
  if [ -z "$1" ]; then
    echo "Error: Issue number is required"
    echo "Usage: ./claude-github.sh issue [issue-number]"
    exit 1
  fi
  
  issue_number=$1
  echo "Fetching GitHub issue #$issue_number details..."
  if [ -n "$GITHUB_TOKEN" ]; then
    curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number"
  else
    curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number"
  fi
}

# Command: repo - Fetch repository details
# Usage: ./claude-github.sh repo
repo() {
  echo "Fetching repository details..."
  if [ -n "$GITHUB_TOKEN" ]; then
    curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor"
  else
    curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor"
  fi
}

# Command: close-issue - Close a GitHub issue
# Usage: ./claude-github.sh close-issue [issue-number] [comment-text]
close_issue() {
  if [ -z "$1" ]; then
    echo "Error: Issue number is required"
    echo "Usage: ./claude-github.sh close-issue [issue-number] [optional-comment]"
    exit 1
  fi
  
  issue_number=$1
  comment_text=$2
  
  if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token is required to close issues"
    echo "Run ./scripts/setup-github-token.sh to configure your token"
    exit 1
  fi
  
  echo "Closing GitHub issue #$issue_number..."
  
  # Add a comment if provided
  if [ -n "$comment_text" ]; then
    echo "Adding comment to issue #$issue_number..."
    curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
      -H "Content-Type: application/json" \
      -d "{\"body\":\"$comment_text\"}" \
      "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number/comments"
  fi
  
  # Close the issue
  curl -s -X PATCH -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d '{"state":"closed","state_reason":"completed"}' \
    "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number"
    
  echo "Issue #$issue_number has been closed"
}

# Command: prs - Fetch open pull requests
# Usage: ./claude-github.sh prs
prs() {
  echo "Fetching open pull requests..."
  if [ -n "$GITHUB_TOKEN" ]; then
    curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/pulls"
  else
    curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/pulls"
  fi
}

# Command: create-pr - Create a pull request
# Usage: ./claude-github.sh create-pr [title] [body] [head] [base]
create_pr() {
  if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
    echo "Error: Missing required arguments"
    echo "Usage: ./claude-github.sh create-pr [title] [body] [head] [base]"
    exit 1
  fi
  
  title="$1"
  body="$2"
  head="$3"
  base="$4"
  
  echo "Creating pull request: $title"
  
  if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token is required to create pull requests"
    echo "Run ./scripts/setup-github-token.sh to configure your token"
    exit 1
  fi
  
  curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$title\",\"body\":\"$body\",\"head\":\"$head\",\"base\":\"$base\"}" \
    "https://api.github.com/repos/jerseycheese/narraitor/pulls"
}

# Main function to route commands
main() {
  if [ -z "$1" ]; then
    echo "Error: Command is required"
    echo "Available commands: issue, repo, prs, create-pr, close-issue"
    exit 1
  fi
  
  command="$1"
  shift
  
  case "$command" in
    issue)
      issue "$@"
      ;;
    repo)
      repo "$@"
      ;;
    prs)
      prs "$@"
      ;;
    create-pr)
      create_pr "$@"
      ;;
    close-issue)
      close_issue "$@"
      ;;
    *)
      echo "Error: Unknown command '$command'"
      echo "Available commands: issue, repo, prs, create-pr, close-issue"
      exit 1
      ;;
  esac
}

# Execute main function with all arguments
main "$@"
