#!/bin/bash

# This script enables auto-accept for common operations in Claude Code
# Usage: ./scripts/enable-auto-accept.sh

# Create directory if it doesn't exist
mkdir -p .claude

# Create settings file with permissions
cat > .claude/settings.local.json << EOL
{
  "allowedTools": [
    "Bash(npm run build)",
    "Bash(npm run test*)",
    "Bash(git*)",
    "Edit(*)",
    "Write(*)",
    "WebFetch(*)",
    "Grep(*)",
    "LS(*)",
    "Read(*)"
  ]
}
EOL

echo "✅ Auto-accept enabled for common operations"
echo "Settings saved to .claude/settings.local.json"
echo ""
echo "The following permissions are now auto-accepted:"
echo "- Executing npm build and test commands"
echo "- Running git commands"
echo "- Reading and listing files"
echo "- Editing and creating files"
echo "- Searching file contents"
echo "- Fetching web content"
echo ""
echo "To disable, delete .claude/settings.local.json or edit it to remove specific permissions."