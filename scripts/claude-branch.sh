#!/bin/bash

# Helper script for branch management in Claude Code
# Usage: ./scripts/claude-branch.sh [issue-number] [auto-mode]

if [ -z "$1" ]; then
  echo "Error: Issue number is required"
  echo "Usage: ./scripts/claude-branch.sh [issue-number] [auto-mode]"
  exit 1
fi

issue_number=$1
auto_mode=$2
branch_name="feature/issue-$issue_number"

echo "Managing branch: $branch_name"

# Check if the branch already exists
if git show-ref --verify --quiet refs/heads/$branch_name; then
  echo "Branch $branch_name already exists."
  
  if [ "$auto_mode" = "auto" ]; then
    # Auto mode: Delete and recreate
    echo "Auto mode: Deleting and recreating the branch for a clean start..."
    git checkout develop 2>/dev/null || git checkout main # Try develop first, fall back to main
    git pull origin $(git rev-parse --abbrev-ref HEAD) # Pull latest changes from remote
    git branch -D $branch_name
    git checkout -b $branch_name
  else
    # Interactive mode
    echo "Options:"
    echo "1. Use the existing branch (continue previous work)"
    echo "2. Delete and recreate the branch (clean start)"
    echo "3. Create a new branch with timestamp (avoid conflicts)"
    
    read -p "Choose an option (1/2/3): " branch_option
    
    case $branch_option in
      1)
        echo "Using existing branch..."
        git checkout $branch_name
        ;;
      2)
        echo "Deleting and recreating the branch..."
        git checkout develop 2>/dev/null || git checkout main # Try develop first, fall back to main
        git pull origin $(git rev-parse --abbrev-ref HEAD) # Pull latest changes from remote
        git branch -D $branch_name
        git checkout -b $branch_name
        ;;
      3)
        echo "Creating new branch with timestamp..."
        timestamp=$(date +%Y%m%d%H%M%S)
        new_branch_name="${branch_name}-${timestamp}"
        git checkout develop 2>/dev/null || git checkout main # Try develop first, fall back to main
        git pull
        git checkout -b $new_branch_name
        echo "Created branch: $new_branch_name"
        ;;
      *)
        echo "Invalid option. Using existing branch..."
        git checkout $branch_name
        ;;
    esac
  fi
else
  # Branch doesn't exist, create it normally
  # Try to use develop branch, but fall back to main if develop doesn't exist
  git checkout develop 2>/dev/null || git checkout main
  git pull
  git checkout -b $branch_name
  echo "Created new branch: $branch_name"
fi
