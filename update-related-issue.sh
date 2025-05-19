#!/bin/bash

# Add comment to issue #106 about completion of #363
COMMENT_BODY=$(cat << 'EOF'
## Progress Update

Issue #363 (Implement standardized debug logging utility for the application) has been completed.

This provides the debug logging utility with severity levels that was requested in this issue. The implementation includes:
- Multiple severity levels (debug, info, warn, error)
- Environment-based toggling via NEXT_PUBLIC_DEBUG_LOGGING
- Automatic suppression in production builds
- Timestamp formatting and context tracking
- Color-coded console output for better readability

The logger is now available at `/src/lib/utils/logger.ts` and has been integrated into GameSession and SessionStore components.
EOF
)

# Escape the comment body for JSON
ESCAPED_BODY=$(echo "$COMMENT_BODY" | jq -Rs .)

# Create the JSON payload
JSON_PAYLOAD="{\"body\": $ESCAPED_BODY}"

# Add comment using GitHub API
curl -s -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d "$JSON_PAYLOAD" \
  "https://api.github.com/repos/jerseycheese/Narraitor/issues/106/comments"

echo "Comment added to issue #106"