#!/bin/bash

# Helper script to fetch GitHub issues without prompting for permission
# Usage: ./fetch-github-issue.sh [issue-number]

if [ -z "$1" ]; then
  echo "Error: Issue number is required"
  echo "Usage: ./fetch-github-issue.sh [issue-number]"
  exit 1
fi

issue_number=$1
REPO_PATH=$(git rev-parse --show-toplevel)
MCP_CONFIG_FILE="$REPO_PATH/.mcp.json"

# Check if MCP is configured
if [ -f "$MCP_CONFIG_FILE" ] && [ -n "$(command -v node)" ]; then
  echo "Attempting to fetch GitHub issue #$issue_number using MCP GitHub..."
  
  # Create temporary Node.js script
  TMP_SCRIPT="$(mktemp)"
  cat > "$TMP_SCRIPT" << 'EOF'
(async () => {
  try {
    // First parameter is the issue number
    const issueNumber = process.argv[2];
    
    // Access the MCP GitHub module through the global object
    const issue = await global.mcp__modelcontextprotocol_server_github__server_github.getIssue({
      owner: "jerseycheese",
      repo: "narraitor",
      issueNumber: parseInt(issueNumber, 10)
    });
    
    // Output the issue as JSON
    console.log(JSON.stringify(issue, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error using MCP GitHub:", error.message);
    process.exit(1);
  }
})();
EOF

  # Try to execute with Node.js
  NODE_RESULT=1
  node "$TMP_SCRIPT" "$issue_number" 2>/dev/null || NODE_RESULT=$?
  rm "$TMP_SCRIPT"
  
  # If successful, exit
  if [ $NODE_RESULT -eq 0 ]; then
    exit 0
  fi
  
  echo "MCP GitHub attempt failed, falling back to direct API..."
fi

# Fallback to direct API call
echo "Fetching GitHub issue #$issue_number details via API..."
curl -s -H "Accept: application/vnd.github+json" "https://api.github.com/repos/jerseycheese/narraitor/issues/$issue_number"