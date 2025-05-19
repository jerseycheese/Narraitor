#!/bin/bash

# Close issue #106 with completion message
CLOSE_COMMENT=$(cat << 'EOF'
## Issue Completed ✅

All acceptance criteria have been met through the implementation in #363:

- ✅ Logging utilities support multiple severity levels (debug, info, warn, error)
- ✅ Logs can be filtered by severity level (via environment variable)
- ✅ Development-only logs are automatically disabled in production
- ✅ Logs include timestamp and context information
- ✅ Log formatting is consistent and readable (color-coded output)

The logger has been implemented at `/src/lib/utils/logger.ts` and is now being used in the codebase.

Closing this issue as completed.
EOF
)

# Add the closing comment
echo "Adding closing comment to issue #106..."
ESCAPED_COMMENT=$(echo "$CLOSE_COMMENT" | jq -Rs .)
JSON_PAYLOAD="{\"body\": $ESCAPED_COMMENT}"

curl -s -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d "$JSON_PAYLOAD" \
  "https://api.github.com/repos/jerseycheese/Narraitor/issues/106/comments"

echo "Closing issue #106..."

# Update the issue body to check all acceptance criteria
ISSUE_BODY=$(curl -s -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/jerseycheese/Narraitor/issues/106" | jq -r '.body')

# Check all the checkboxes
UPDATED_BODY=$(echo "$ISSUE_BODY" | sed 's/- \[ \]/- [x]/g')

# Close the issue with updated checkboxes
ESCAPED_BODY=$(echo "$UPDATED_BODY" | jq -Rs .)
UPDATE_PAYLOAD="{\"body\": $ESCAPED_BODY, \"state\": \"closed\"}"

curl -s -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d "$UPDATE_PAYLOAD" \
  "https://api.github.com/repos/jerseycheese/Narraitor/issues/106"

echo "Issue #106 has been closed"