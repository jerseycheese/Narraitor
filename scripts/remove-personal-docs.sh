#!/bin/bash

# Script to remove personal documentation from Narraitor repo
# Run this AFTER confirming the private docs repo is set up and pushed

echo "This script will remove personal documentation files from the Narraitor repository."
echo "Make sure you have:"
echo "1. Run ./scripts/setup-private-docs-repo.sh"
echo "2. Created and pushed to your private docs repository"
echo ""
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Entire directories to remove
DIRECTORIES_TO_REMOVE=(
    "docs/development/claude-integration"
    "docs/pr-notes"
)

# Individual files to remove
FILES_TO_REMOVE=(
    "docs/claude-edit-usage.md"
    "docs/development/workflows/claude-app-workflow-handoffs.md"
    "docs/development/workflows/claude-app-workflow.md"
    "docs/development/workflows/claude-app-prompt-templates.md"
    "docs/development/pr-template-fixes.md"
)

echo "Removing personal documentation files and directories..."

# Remove entire directories
for dir in "${DIRECTORIES_TO_REMOVE[@]}"; do
    if [ -d "$dir" ]; then
        git rm -r "$dir"
        echo "Removed directory: $dir"
    else
        echo "Directory not found: $dir"
    fi
done

# Remove individual files
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        git rm "$file"
        echo "Removed: $file"
    else
        echo "Already removed or not found: $file"
    fi
done

# Check if workflows directory is empty and remove it
if [ -d "docs/development/workflows" ] && [ -z "$(ls -A docs/development/workflows 2>/dev/null)" ]; then
    rmdir docs/development/workflows
    echo "Removed empty directory: docs/development/workflows"
fi

echo ""
echo "Personal documentation files have been staged for removal."
echo ""
echo "To complete the removal:"
echo "1. Review the changes: git status"
echo "2. Commit: git commit -m 'chore: Move personal documentation to private repo'"
echo "3. Push to your branch"
echo ""
echo "Consider adding a note to the remaining Claude integration docs explaining"
echo "that personal workflow documentation has been moved to a private repository."