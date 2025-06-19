#!/bin/bash
# setup-claude-workflow.sh - Setup and refresh Claude workflow scripts

# Configuration
PROJECT_ROOT="/Users/jackhaas/Projects/narraitor"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Ensure scripts directory exists
mkdir -p "$SCRIPTS_DIR"

# Create required data directories
mkdir -p "$PROJECT_ROOT/.claude-workflow"
mkdir -p "$PROJECT_ROOT/.claude-handoffs"
mkdir -p "$PROJECT_ROOT/.claude-transition"

# Make scripts executable
chmod +x "$SCRIPTS_DIR/claude-workflow.sh"
chmod +x "$SCRIPTS_DIR/claude-handoff.sh"
chmod +x "$SCRIPTS_DIR/claude-transition.sh"

# Create symlinks in PATH for easy access (optional)
if [ ! -d "$HOME/bin" ]; then
    mkdir -p "$HOME/bin"
    echo "Created $HOME/bin directory. You may need to add it to your PATH."
fi

# Check if HOME/bin is in PATH
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo "WARNING: $HOME/bin is not in your PATH. You may want to add it."
    echo "Add this to your ~/.bashrc or ~/.zshrc:"
    echo "export PATH=\"\$HOME/bin:\$PATH\""
fi

# Create symlinks
ln -sf "$SCRIPTS_DIR/claude-workflow.sh" "$HOME/bin/claude-workflow"
ln -sf "$SCRIPTS_DIR/claude-handoff.sh" "$HOME/bin/claude-handoff"
ln -sf "$SCRIPTS_DIR/claude-transition.sh" "$HOME/bin/claude-transition"

echo "Claude workflow scripts setup completed."
echo "Scripts are available in $SCRIPTS_DIR"
echo "Symlinks created in $HOME/bin"

# Information on usage
cat << EOF

Claude Workflow Scripts Usage:

1. Workflow Automation:
   claude-workflow analyze [issue]       # Start with analyzing an issue
   claude-workflow define-tests          # Define tests based on spec
   claude-workflow implement             # Begin implementation in Claude Code
   claude-workflow manual-test           # Create manual testing plan
   claude-workflow finalize              # Clean up and create PR

2. Session Handoffs:
   claude-handoff request [template]     # Create handoff request for current chat
   claude-handoff start [file]           # Start new chat with handoff context
   claude-handoff templates              # List available handoff templates

3. App-Code Transitions:
   claude-transition setup-task ID DESC  # Set up a new task
   claude-transition to-code ID FILE     # Transition from App to Code
   claude-transition to-app ID FILE      # Transition from Code to App
   claude-transition gates ID            # Show gates for a task

Documentation is available in the private workflow documentation repository.
EOF

# Done!
echo "Setup complete. Happy coding with Claude!"
