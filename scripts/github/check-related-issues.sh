#!/bin/bash

# Script to check related issues for a specific issue number
# Usage: ./scripts/check-related-issues.sh <issue-number> [github-token]

# Check if issue number is provided
if [ -z "$1" ]; then
  echo "Error: Issue number is required."
  echo "Usage: ./scripts/check-related-issues.sh <issue-number> [github-token]"
  exit 1
fi

ISSUE_NUMBER=$1
GITHUB_TOKEN=$2

# Constants
OWNER="jerseycheese"
REPO="narraitor"

# If GitHub token is provided, use authenticated requests
if [ -n "$GITHUB_TOKEN" ]; then
  AUTH_HEADER="Authorization: token $GITHUB_TOKEN"
  echo "Using authenticated GitHub API requests..."
else
  AUTH_HEADER=""
  echo "Warning: Using unauthenticated GitHub API requests. Rate limits may apply."
fi

# Function to make a GitHub API request
function github_api_request() {
  local endpoint=$1
  local url="https://api.github.com/$endpoint"
  
  if [ -n "$AUTH_HEADER" ]; then
    curl -s -H "$AUTH_HEADER" -H "Accept: application/vnd.github.v3+json" "$url"
  else
    curl -s -H "Accept: application/vnd.github.v3+json" "$url"
  fi
}

# Function to fetch issue details
function get_issue() {
  local issue_number=$1
  github_api_request "repos/$OWNER/$REPO/issues/$issue_number"
}

# Function to search for issues that reference another issue
function find_related_issues() {
  local issue_number=$1
  local query="repo:$OWNER/$REPO is:issue is:open #$issue_number in:body OR in:comments -number:$issue_number"
  local encoded_query=$(echo "$query" | sed 's/ /%20/g' | sed 's/#/%23/g')
  github_api_request "search/issues?q=$encoded_query&per_page=100"
}

# Main execution
echo "Checking issue #$ISSUE_NUMBER and related issues..."

# Get the issue details
ISSUE_RESPONSE=$(get_issue "$ISSUE_NUMBER")
ISSUE_TITLE=$(echo "$ISSUE_RESPONSE" | grep -o '"title":"[^"]*' | cut -d'"' -f4)
ISSUE_STATUS=$(echo "$ISSUE_RESPONSE" | grep -o '"state":"[^"]*' | cut -d'"' -f4)

if [ -z "$ISSUE_TITLE" ]; then
  echo "Error: Issue #$ISSUE_NUMBER not found or API rate limit exceeded."
  exit 1
fi

echo ""
echo "Issue #$ISSUE_NUMBER: $ISSUE_TITLE"
echo "Status: $ISSUE_STATUS"
echo ""

# Find issues that reference this issue
echo "Searching for issues that reference #$ISSUE_NUMBER..."
RELATED_RESPONSE=$(find_related_issues "$ISSUE_NUMBER")
RELATED_COUNT=$(echo "$RELATED_RESPONSE" | grep -o '"total_count":[0-9]*' | cut -d':' -f2)

if [ "$RELATED_COUNT" -eq 0 ]; then
  echo "No related issues found."
else
  echo "Found $RELATED_COUNT related issues:"
  echo ""
  
  # Extract issue numbers, titles, and status
  RELATED_ISSUES=$(echo "$RELATED_RESPONSE" | grep -o '"number":[0-9]*,"title":"[^"]*","user"' | sed 's/"number":\([0-9]*\),"title":"\([^"]*\)","user"/\1|\2/')
  
  # Print in a table format
  echo "| Issue # | Title | Status |"
  echo "|---------|-------|--------|"
  
  echo "$RELATED_ISSUES" | while IFS='|' read -r number title; do
    # Get status for each issue
    ISSUE_DETAILS=$(get_issue "$number")
    ISSUE_STATE=$(echo "$ISSUE_DETAILS" | grep -o '"state":"[^"]*' | cut -d'"' -f4)
    
    echo "| #$number | $title | $ISSUE_STATE |"
    
    # Sleep briefly to avoid hitting rate limits
    sleep 0.5
  done
fi

echo ""
echo "Analysis complete."