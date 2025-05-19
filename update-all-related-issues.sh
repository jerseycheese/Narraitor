#!/bin/bash

# Update all open related issues to #106
RELATED_ISSUES=(202 203 108 213 212 141 224 223 220)

# Comment template
create_comment() {
  cat << EOF
## Progress Update

Issue #106 (Implement severity logging for developer tools and debugging) has been completed.

A standardized debug logging utility is now available at \`/src/lib/utils/logger.ts\` with:
- Multiple severity levels (debug, info, warn, error)
- Environment-based toggling
- Automatic production suppression
- Timestamp formatting and context tracking

This logging utility can be used to support the debugging features required by this issue.
EOF
}

echo "Updating all related issues to #106..."
echo ""

for issue_num in "${RELATED_ISSUES[@]}"; do
  echo "Updating issue #$issue_num..."
  
  # Create the comment
  COMMENT_BODY=$(create_comment)
  ESCAPED_BODY=$(echo "$COMMENT_BODY" | jq -Rs .)
  JSON_PAYLOAD="{\"body\": $ESCAPED_BODY}"
  
  # Add comment
  response=$(curl -s -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -d "$JSON_PAYLOAD" \
    "https://api.github.com/repos/jerseycheese/Narraitor/issues/$issue_num/comments")
  
  comment_url=$(echo "$response" | jq -r '.html_url')
  
  if [ "$comment_url" != "null" ]; then
    echo "  ✅ Added comment: $comment_url"
  else
    echo "  ❌ Failed to add comment"
    echo "  Response: $response"
  fi
  echo ""
done

echo "All related issues have been updated!"