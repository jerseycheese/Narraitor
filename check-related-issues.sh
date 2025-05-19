#!/bin/bash

# Check status of all related issues to #106
RELATED_ISSUES=(202 203 108 213 212 141 224 223 220)

echo "Checking status of issues related to #106..."
echo ""

for issue_num in "${RELATED_ISSUES[@]}"; do
  echo "Checking issue #$issue_num..."
  
  # Fetch issue details
  issue_data=$(curl -s -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_num")
  
  state=$(echo "$issue_data" | jq -r '.state')
  title=$(echo "$issue_data" | jq -r '.title')
  
  if [ "$state" = "open" ]; then
    echo "  ✅ OPEN: #$issue_num - $title"
    echo "  -> This issue needs to be notified about #106 completion"
  else
    echo "  ❌ CLOSED: #$issue_num - $title"
  fi
  echo ""
done