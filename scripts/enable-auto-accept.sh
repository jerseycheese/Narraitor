#!/bin/bash

# Helper script to enable session-level auto-accept in Claude Code
# This simulates the "Yes, and don't ask again this session" option

echo "Enabling session-level auto-accept for Claude Code..."

# Create or update the .clauderc file with auto-accept settings
cat > .clauderc << EOF
{
  "session": {
    "autoAcceptEdits": true,
    "autoApproveCommands": true,
    "autoCreateFiles": true
  }
}
EOF

echo "Session-level auto-accept enabled. The .clauderc file has been created/updated."
echo "This setting should apply to all operations in the current Claude Code session."
