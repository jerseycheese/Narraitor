#!/bin/bash

# Script to clean up duplicate command files after update
# Usage: ./scripts/cleanup-claude-commands.sh

echo "Removing duplicate command files..."

# Remove the duplicate command files
rm -f /Users/jackhaas/Projects/narraitor/.claude/commands/do-issue-batched-commits.md
rm -f /Users/jackhaas/Projects/narraitor/.claude/commands/do-issue-auto-batched.md

# Check if files were removed successfully
if [ ! -f "/Users/jackhaas/Projects/narraitor/.claude/commands/do-issue-batched-commits.md" ] && \
   [ ! -f "/Users/jackhaas/Projects/narraitor/.claude/commands/do-issue-auto-batched.md" ]; then
   echo "Cleanup completed successfully."
   echo "The following command files now use batched commits by default:"
   echo "  - /Users/jackhaas/Projects/narraitor/.claude/commands/do-issue.md"
   echo "  - /Users/jackhaas/Projects/narraitor/.claude/commands/do-issue-auto.md"
else
   echo "Some files could not be removed. Please check permissions."
fi
