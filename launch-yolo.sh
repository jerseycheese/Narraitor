#!/bin/bash
# Launch Claude Code in background for issue 547

cd /Users/jackhaas/Projects/narraitor-worktrees/issue-547-skill-check-evaluator

echo "🚀 Launching Claude Code for issue #547 in background..."
echo "Monitor with: tail -f claude-yolo-547.log"

# Run Claude Code with the no-verify command
echo "/project:do-issue-auto-noverify 547" | claude > claude-yolo-547.log 2>&1 &

echo "✅ Claude Code started with PID: $!"
echo "📜 View logs: tail -f claude-yolo-547.log"
