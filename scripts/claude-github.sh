#!/bin/bash

# Claude GitHub Helper - A wrapper for GitHub API calls in Claude Code
# This script allows Claude Code to make GitHub API calls without prompting for permission
# Usage: ./claude-github.sh [command] [arguments...]

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
  curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number"
}

# Command: repo - Fetch repository details
# Usage: ./claude-github.sh repo
repo() {
  echo "Fetching repository details..."
  curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor"
}

# Command: prs - Fetch open pull requests
# Usage: ./claude-github.sh prs
prs() {
  echo "Fetching open pull requests..."
  curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/pulls"
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
  curl -s -X POST -H "Accept: application/vnd.github+json" \
    -d "{\"title\":\"$title\",\"body\":\"$body\",\"head\":\"$head\",\"base\":\"$base\"}" \
    "https://api.github.com/repos/jerseycheese/narraitor/pulls"
}

# Main function to route commands
main() {
  if [ -z "$1" ]; then
    echo "Error: Command is required"
    echo "Available commands: issue, repo, prs, create-pr"
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
    *)
      echo "Error: Unknown command '$command'"
      echo "Available commands: issue, repo, prs, create-pr"
      exit 1
      ;;
  esac
}

# Execute main function with all arguments
main "$@"
