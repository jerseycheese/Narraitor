#!/bin/bash
# Setup Claude configuration for worktrees to access main project commands

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NARRAITOR_MAIN="/Users/jackhaas/Projects/narraitor"

# Function to setup Claude configuration in a worktree
setup_claude_worktree() {
    local worktree_path="$1"
    
    if [ -z "$worktree_path" ]; then
        echo "Usage: setup_claude_worktree <worktree-path>"
        return 1
    fi
    
    echo "Setting up Claude configuration for worktree: $worktree_path"
    
    # Create .claude directory if it doesn't exist
    mkdir -p "$worktree_path/.claude"
    
    # Create a settings.json that includes the main project as additional working directory
    cat > "$worktree_path/.claude/settings.json" << EOF
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
  },
  "includeCoAuthoredBy": false,
  "additionalWorkingDirectories": [
    "$NARRAITOR_MAIN"
  ]
}
EOF
    
    # Also create a symlink to the commands directory
    if [ ! -L "$worktree_path/.claude/commands" ]; then
        ln -s "$NARRAITOR_MAIN/.claude/commands" "$worktree_path/.claude/commands"
        echo "✅ Created symlink to commands directory"
    fi
    
    # Create a .clauderc file for the worktree
    cat > "$worktree_path/.clauderc" << EOF
{
  "session": {
    "autoAcceptEdits": true,
    "autoApproveCommands": true,
    "autoCreateFiles": true
  },
  "extendedWorkspace": {
    "additionalPaths": [
      "$NARRAITOR_MAIN"
    ]
  }
}
EOF
    
    echo "✅ Claude configuration set up for worktree"
    echo "📁 Commands from main project are now accessible"
}

# If script is run directly, setup for the current directory
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    if [ -z "$1" ]; then
        # If no argument, use current directory
        setup_claude_worktree "$(pwd)"
    else
        setup_claude_worktree "$1"
    fi
fi
