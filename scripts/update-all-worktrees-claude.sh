#!/bin/bash
# Update all existing worktrees with Claude configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NARRAITOR_MAIN="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREE_DIR="${NARRAITOR_MAIN}-worktrees"

echo "🔄 Updating Claude configuration for all existing worktrees..."

# Find all directories that start with "issue-"
for worktree in "$WORKTREE_DIR"/issue-*/; do
    if [ -d "$worktree" ]; then
        echo ""
        echo "📁 Updating: $(basename "$worktree")"
        "$SCRIPT_DIR/setup-claude-worktree.sh" "$worktree"
    fi
done

echo ""
echo "✅ All worktrees updated with Claude configuration!"
echo "🎯 Commands from main project are now accessible in all worktrees"
