#!/bin/bash

# Script to update the Claude Code commands to use batched commits
# Usage: ./scripts/update-claude-commands.sh

# Use absolute paths
CLAUDE_COMMANDS_DIR="/Users/jackhaas/Projects/narraitor/.claude/commands"
BACKUP_DIR="/Users/jackhaas/Projects/narraitor/.claude/commands/backup-$(date +%Y%m%d-%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "Creating backups in $BACKUP_DIR"

# Backup existing commands
cp "$CLAUDE_COMMANDS_DIR/do-issue.md" "$BACKUP_DIR/do-issue.md"
cp "$CLAUDE_COMMANDS_DIR/do-issue-auto.md" "$BACKUP_DIR/do-issue-auto.md"
cp "$CLAUDE_COMMANDS_DIR/do-issue-auto-noverify.md" "$BACKUP_DIR/do-issue-auto-noverify.md"
cp "$CLAUDE_COMMANDS_DIR/do-continuous-issues.md" "$BACKUP_DIR/do-continuous-issues.md" 2>/dev/null || true

echo "Backups created. Now updating the command files..."

# Copy our new batched versions to the original file names
cp "$CLAUDE_COMMANDS_DIR/do-issue-batched-commits.md" "$CLAUDE_COMMANDS_DIR/do-issue.md"
cp "$CLAUDE_COMMANDS_DIR/do-issue-auto-batched.md" "$CLAUDE_COMMANDS_DIR/do-issue-auto.md"
cp "$CLAUDE_COMMANDS_DIR/do-issue-auto-noverify-batched.md" "$CLAUDE_COMMANDS_DIR/do-issue-auto-noverify.md"

# Update the do-continuous-issues.md file
sed -i '' 's/do-issue-auto-noverify-batched/do-issue-auto-noverify/g' "$CLAUDE_COMMANDS_DIR/do-continuous-issues.md"

echo "Updated all command files to use batched commits by default."
echo "Original files were backed up to $BACKUP_DIR"
echo ""
echo "To use the commands:"
echo "  /project:do-issue 123              # Interactive mode with manual review points"
echo "  /project:do-issue-auto 123         # Auto mode with verification"
echo "  /project:do-issue-auto-noverify 123 # Fully automated mode"
echo "  /project:do-continuous-issues 5    # Process multiple issues automatically"
