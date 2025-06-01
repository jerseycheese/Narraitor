#!/bin/bash

# Script to create a pull request using the repository's PR template
# Always merges into the 'develop' branch
# Usage: ./scripts/claude-pr.sh [issue-number] [branch-name] [brief-description]

set -e

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 [issue-number] [branch-name] [brief-description]"
  echo "Example: $0 123 feature/issue-123 'Implement character card component'"
  exit 1
fi

ISSUE_NUMBER=$1
BRANCH_NAME=$2
BRIEF_DESCRIPTION=$3
REPO_PATH=$(git rev-parse --show-toplevel)
PR_TEMPLATE_PATH="$REPO_PATH/.github/PULL_REQUEST_TEMPLATE.md"
PR_TITLE="Fix #$ISSUE_NUMBER: $BRIEF_DESCRIPTION"
BASE_BRANCH="develop"  # Always merge into develop

# Verify PR template exists
if [ ! -f "$PR_TEMPLATE_PATH" ]; then
  echo "Error: PR template not found at $PR_TEMPLATE_PATH"
  exit 1
fi

# Read the PR template
PR_TEMPLATE=$(cat "$PR_TEMPLATE_PATH")

# Replace placeholders in the template
PR_BODY=$(echo "$PR_TEMPLATE" | 
  # Replace "Closes #" with the actual issue number
  sed "s/Closes #/Closes #$ISSUE_NUMBER/")

# Output files for debugging if needed
echo "$PR_TITLE" > /tmp/pr_title.txt
echo "$PR_BODY" > /tmp/pr_body.txt

echo "Creating pull request:"
echo "Title: $PR_TITLE"
echo "Branch: $BRANCH_NAME -> $BASE_BRANCH"
echo "Template: Using template from $PR_TEMPLATE_PATH"

# Example MCP GitHub tool usage for Claude Code
echo "PR creation prepared. To create the PR from Claude Code, use:"
echo "

// Read PR template and create properly formatted PR
try {
  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: \"jerseycheese\",
    repo: \"narraitor\",
    title: \"$PR_TITLE\",
    body: \`$PR_BODY\`,
    head: \"$BRANCH_NAME\",
    base: \"$BASE_BRANCH\"  // Always using develop branch
  });
  
  console.log(\`Successfully created PR: \${pullRequest.html_url}\`);
} catch (error) {
  console.error(\"Error creating PR with MCP GitHub tool:\", error);
  
  // Fallback: Provide URL for manual PR creation
  console.log(\"Please create the PR manually using this URL:\");
  console.log(\`https://github.com/jerseycheese/narraitor/compare/$BASE_BRANCH...$BRANCH_NAME\`);
}
"

exit 0
