#!/bin/bash

# Script to clean up duplicate command files after update
# Usage: ./scripts/cleanup-claude-commands.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NARRAITOR_MAIN="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_COMMANDS_DIR="$NARRAITOR_MAIN/.claude/commands"

echo "Removing duplicate command files..."

# Remove the duplicate command files
rm -f "$CLAUDE_COMMANDS_DIR/do-issue-batched-commits.md"
rm -f "$CLAUDE_COMMANDS_DIR/do-issue-auto-batched.md"

# Check if files were removed successfully
if [ ! -f "$CLAUDE_COMMANDS_DIR/do-issue-batched-commits.md" ] && \
   [ ! -f "$CLAUDE_COMMANDS_DIR/do-issue-auto-batched.md" ]; then
   echo "Cleanup completed successfully."
   echo "The following command files now use batched commits by default:"
   echo "  - $CLAUDE_COMMANDS_DIR/do-issue.md"
   echo "  - $CLAUDE_COMMANDS_DIR/do-issue-auto.md"
else
   echo "Some files could not be removed. Please check permissions."
fi
