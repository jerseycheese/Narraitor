#!/bin/bash

# Helper script to fetch GitHub issues without prompting for permission
# Usage: ./fetch-github-issue.sh [issue-number]

if [ -z "$1" ]; then
  echo "Error: Issue number is required"
  echo "Usage: ./fetch-github-issue.sh [issue-number]"
  exit 1
fi

issue_number=$1
echo "Fetching GitHub issue #$issue_number details without prompting for permission..."
curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number"
