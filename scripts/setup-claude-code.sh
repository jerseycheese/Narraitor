#!/bin/bash
# setup-claude-code.sh - Set up Claude Code allowed tools and settings

# Configuration
PROJECT_ROOT="/Users/jackhaas/Projects/narraitor"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

# Create .claude directory if it doesn't exist
mkdir -p "$CLAUDE_DIR"
mkdir -p "$CLAUDE_DIR/commands"

echo "Setting up Claude Code configuration..."

# Create settings.json with allowed tools
cat > "$SETTINGS_FILE" << EOL
{
  "allowedTools": {
    "Edit": true,
    "Bash": ["npm", "node", "ls", "cat", "git*", "find", "grep", "cd", "mkdir", "touch", "rm", "cp", "mv", "echo", "pwd", "test", "head", "tail", "less", "more", "nano", "wc", "sort", "uniq", "cut", "sed", "awk", "curl", "wget", "diff", "patch", "tar", "zip", "unzip", "jq", "npm run*"],
    "Fetch": true,
    "mcp__anthropics-code__mermaid_exec": true,
    "mcp__anthropics-code__browser_navigate": true,
    "mcp__antropics-code__repl": true,
    "mcp__modelcontextprotocol-server-github__server-github": true
  },
  "defaultShell": "bash"
}
EOL

echo "Claude Code settings created at $SETTINGS_FILE"

# Create .gitignore to exclude .claude/claude.json (session state)
if ! grep -q ".claude/claude.json" "$PROJECT_ROOT/.gitignore"; then
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# Claude Code session state" >> "$PROJECT_ROOT/.gitignore"
    echo ".claude/claude.json" >> "$PROJECT_ROOT/.gitignore"
    echo "Added .claude/claude.json to .gitignore"
fi

echo "Claude Code setup complete!"
echo ""
echo "Custom commands available:"
echo "- /project:analyze-issue [issue-number]"
echo "- /project:tdd-implement [feature-name]"
echo "- /project:create-docs [component/feature]" 
echo "- /project:create-pr [feature-description]"
echo "- /project:transition [context]"
echo ""
echo "To start using Claude Code, run:"
echo "claude"
echo ""
echo "To learn more about Claude Code best practices, visit:"
echo "https://www.anthropic.com/engineering/claude-code-best-practices"
