#!/bin/bash

# Script to set up private documentation repository
# This moves personal workflow docs to a separate private repo

PRIVATE_DOCS_DIR="/Users/jackhaas/Projects/Docs"
NARRAITOR_DOCS="$PRIVATE_DOCS_DIR/narraitor"

echo "Setting up private documentation repository..."

# Initialize git repo if not already initialized
if [ ! -d "$PRIVATE_DOCS_DIR/.git" ]; then
    cd "$PRIVATE_DOCS_DIR"
    git init
    echo "Initialized git repository in $PRIVATE_DOCS_DIR"
fi

# Create README for the private docs repo
cat > "$PRIVATE_DOCS_DIR/README.md" << 'EOF'
# Personal Documentation

This repository contains personal workflow documentation and development notes that are specific to the maintainer's development environment.

## Structure

- `narraitor/` - Personal documentation for the Narraitor project
  - `docs/development/claude-integration/` - Claude AI integration workflows
  - `docs/development/workflows/` - Personal development workflows
  - `docs/pr-notes/` - Personal implementation notes

## Purpose

These documents contain:
- Personal workflow automation scripts
- Development environment specific configurations
- Claude AI usage patterns and limits
- Personal development methodologies

These are separated from the main project to keep the public repository focused on project-specific documentation while maintaining version control for personal workflow documentation.
EOF

# Create .gitignore
cat > "$PRIVATE_DOCS_DIR/.gitignore" << 'EOF'
.DS_Store
*.swp
*.swo
*~
.idea/
.vscode/
EOF

# Add all files to git
cd "$PRIVATE_DOCS_DIR"
git add .
git commit -m "Initial commit: Personal documentation for Narraitor project"

echo "Private documentation repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a private repository on GitHub called 'personal-docs' or similar"
echo "2. Add it as a remote:"
echo "   cd $PRIVATE_DOCS_DIR"
echo "   git remote add origin git@github.com:yourusername/personal-docs.git"
echo "3. Push the initial commit:"
echo "   git push -u origin main"
echo ""
echo "Files and directories that will be removed from the Narraitor repo:"
cat << 'EOF'
docs/development/claude-integration/ (entire directory)
docs/pr-notes/ (entire directory)
docs/claude-edit-usage.md
docs/development/workflows/claude-app-workflow-handoffs.md
docs/development/workflows/claude-app-workflow.md
docs/development/workflows/claude-app-prompt-templates.md
docs/development/pr-template-fixes.md
EOF