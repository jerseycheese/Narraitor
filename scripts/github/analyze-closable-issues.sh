#!/bin/bash

# Script to analyze which issues can be closed due to completed PRs
# Usage: ./scripts/analyze-closable-issues.sh [github-token]

# Check if a GitHub token was provided
if [ -z "$1" ]; then
  echo "Warning: No GitHub token provided. Using unauthenticated requests (rate limits may apply)."
  AUTH_HEADER=""
else
  AUTH_HEADER="Authorization: token $1"
  echo "Using authenticated GitHub API requests."
fi

# Constants
OWNER="jerseycheese"
REPO="narraitor"

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

# Get merged PRs that close issues
echo "Fetching recently merged PRs..."
MERGED_PRS=$(github_api_request "repos/$OWNER/$REPO/pulls?state=closed&sort=updated&direction=desc&per_page=30")

# Create a temporary file for the results
RESULTS_FILE="$(mktemp)"

# Add header to results file
echo "# Closable Issues Analysis" > "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "Analysis date: $(date)" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "## Issues that can be closed" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "| Issue # | Title | PR # | PR Title | PR Merge Date |" >> "$RESULTS_FILE"
echo "|---------|-------|------|----------|---------------|" >> "$RESULTS_FILE"

# Extract merged PRs that reference issues with "closes", "fixes", etc.
CLOSABLE_ISSUES=0

echo "$MERGED_PRS" | grep -o '"number":[0-9]*' | cut -d':' -f2 | while read -r pr_number; do
  # Get PR details
  PR=$(github_api_request "repos/$OWNER/$REPO/pulls/$pr_number")
  PR_TITLE=$(echo "$PR" | grep -o '"title":"[^"]*' | cut -d'"' -f4)
  PR_MERGED_AT=$(echo "$PR" | grep -o '"merged_at":"[^"]*' | cut -d'"' -f4)
  PR_BODY=$(echo "$PR" | grep -o '"body":"[^"]*' | cut -d'"' -f4 | sed 's/\\r\\n/ /g' | sed 's/\\n/ /g')
  
  # Only process merged PRs
  if [ -z "$PR_MERGED_AT" ]; then
    continue
  fi
  
  # Format merge date
  PR_MERGE_DATE=$(echo "$PR_MERGED_AT" | cut -d'T' -f1)
  
  # Extract issue numbers from PR body using various close keywords
  ISSUE_REFS=$(echo "$PR_BODY" | grep -o -E "(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved) #[0-9]+" | grep -o -E "#[0-9]+" | cut -c 2-)
  
  # For each referenced issue, check if it's still open
  for issue_number in $ISSUE_REFS; do
    # Get issue details
    ISSUE=$(github_api_request "repos/$OWNER/$REPO/issues/$issue_number")
    ISSUE_STATE=$(echo "$ISSUE" | grep -o '"state":"[^"]*' | cut -d'"' -f4)
    ISSUE_TITLE=$(echo "$ISSUE" | grep -o '"title":"[^"]*' | cut -d'"' -f4)
    
    # If the issue is still open, add it to the closable issues list
    if [ "$ISSUE_STATE" = "open" ]; then
      echo "| #$issue_number | $ISSUE_TITLE | #$pr_number | $PR_TITLE | $PR_MERGE_DATE |" >> "$RESULTS_FILE"
      
      CLOSABLE_ISSUES=$((CLOSABLE_ISSUES + 1))
      
      # Sleep briefly to avoid rate limits
      sleep 0.5
    fi
  done
done

# Add a note if no closable issues were found
if [ "$CLOSABLE_ISSUES" -eq 0 ]; then
  echo "No closable issues found. All referenced issues are already closed." >> "$RESULTS_FILE"
fi

# Add instructions for closing issues
echo "" >> "$RESULTS_FILE"
echo "## How to close these issues" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "To close an issue using the simple-close-issue.js script:" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "```bash" >> "$RESULTS_FILE"
echo "node ./scripts/simple-close-issue.js <issue-number> <github-token> \"Implementation completed in PR #<pr-number>\"" >> "$RESULTS_FILE"
echo "```" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "Or use the provided helper script:" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "```bash" >> "$RESULTS_FILE"
echo "./scripts/close-issue.sh <issue-number> <github-token>" >> "$RESULTS_FILE"
echo "```" >> "$RESULTS_FILE"

# Display the results
echo ""
echo "Analysis complete. Found $CLOSABLE_ISSUES issues that can be closed."
echo "Results saved to: $RESULTS_FILE"
cat "$RESULTS_FILE"
echo ""
echo "To show this report again, run: cat $RESULTS_FILE"