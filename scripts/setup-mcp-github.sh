#!/bin/bash
# setup-mcp-github.sh - Set up MCP GitHub tool for Claude Code

# Configuration
PROJECT_ROOT="/Users/jackhaas/Projects/narraitor"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

# Create .claude directory if it doesn't exist
mkdir -p "$CLAUDE_DIR"

echo "Setting up MCP GitHub tool for Claude Code..."

# Create MCP config
cat > "$MCP_CONFIG" << EOL
{
  "servers": {
    "github": {
      "name": "github",
      "type": "github",
      "url": "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
      "version": "latest"
    }
  }
}
EOL

echo "MCP GitHub tool configuration created at $MCP_CONFIG"

# Create settings.json with allowed tools
cat > "$SETTINGS_FILE" << EOL
{
  "allowedTools": {
    "Edit": true,
    "Bash": ["npm", "node", "ls", "cat", "git*", "find", "grep", "cd", "mkdir", "touch", "rm", "cp", "mv", "echo", "pwd", "test", "head", "tail", "less", "more", "nano", "wc", "sort", "uniq", "cut", "sed", "awk", "curl", "wget", "diff", "patch", "tar", "zip", "unzip", "jq", "npm run*"],
    "Fetch": true,
    "mcp__modelcontextprotocol-server-github__server-github": true
  },
  "defaultShell": "bash",
  "memory": {
    "format": "markdown",
    "enabled": true
  }
}
EOL

echo "Claude Code settings updated at $SETTINGS_FILE"

echo "MCP GitHub tool setup complete!"
echo ""
echo "To test the MCP GitHub tool, start Claude Code and run:"
echo "claude"
echo ""
echo "Then type:"
echo "/project:do-issue 292"
echo ""
echo "This will run the complete workflow from analysis to PR creation."
