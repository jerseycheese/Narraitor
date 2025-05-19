#!/bin/bash

# Check if any related issues can be closed now that logging is implemented
RELATED_ISSUES=(202 203 108 213 212 141 224 223 220)

echo "Analyzing which issues might be closable now that logging is implemented..."
echo ""

for issue_num in "${RELATED_ISSUES[@]}"; do
  echo "=== Issue #$issue_num ==="
  
  # Fetch issue details
  issue_data=$(curl -s -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_num")
  
  title=$(echo "$issue_data" | jq -r '.title')
  body=$(echo "$issue_data" | jq -r '.body')
  
  echo "Title: $title"
  echo ""
  
  # Extract acceptance criteria
  echo "Acceptance Criteria:"
  echo "$body" | sed -n '/## Acceptance Criteria/,/##/p' | grep -E "^- \[[x ]\]" | head -10
  echo ""
  
  # Check if it's primarily about logging
  if echo "$body" | grep -qi "logging\|log\|console"; then
    echo "⚠️  This issue mentions logging functionality"
  fi
  
  echo "----------------------------------------"
  echo ""
done