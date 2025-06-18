#!/bin/bash

# Helper script to generate descriptive branch names from GitHub issues
# Usage: ./scripts/get-issue-branch-name.sh [issue-number]
# Output: feature/issue-NUMBER-description

if [ -z "$1" ]; then
  echo "Error: Issue number is required"
  echo "Usage: ./scripts/get-issue-branch-name.sh [issue-number]"
  exit 1
fi

issue_number=$1

# Fetch issue details using gh CLI
issue_title=$(gh issue view "$issue_number" --repo jerseycheese/narraitor --json title -q .title 2>/dev/null)

if [ -z "$issue_title" ]; then
  echo "Error: Could not fetch issue #$issue_number"
  echo "feature/issue-$issue_number"
  exit 1
fi

# Generate concise branch description from issue title
# Remove common prefixes
clean_title=$(echo "$issue_title" | sed -E 's/^As a [^,]+, I want //i' | sed -E 's/ so that.*$//i')

# Take first few words and clean them
branch_desc=$(echo "$clean_title" | \
  tr '[:upper:]' '[:lower:]' | \
  sed -E 's/[^a-z0-9 -]//g' | \
  tr ' ' '-' | \
  sed -E 's/-+/-/g' | \
  sed -E 's/^-|-$//g' | \
  cut -d'-' -f1-5)  # Limit to 5 words

# Ensure description isn't too long
if [ ${#branch_desc} -gt 40 ]; then
  branch_desc=$(echo "$branch_desc" | cut -c1-40 | sed 's/-$//')
fi

# Output the full branch name
echo "feature/issue-${issue_number}-${branch_desc}"
