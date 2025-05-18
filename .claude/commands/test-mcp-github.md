I'll test the MCP GitHub tool integration by accessing GitHub issue #$ARGUMENTS and showing its details.

This demonstrates how to use the MCP GitHub tool instead of curl commands or the gh CLI.

## Test MCP GitHub Tool

First, I'll test if the MCP GitHub tool is available and properly configured:

```javascript
// Test accessing the MCP GitHub tool
try {
  // Get issue details for issue #$ARGUMENTS
  const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
    owner: "jerseycheese",
    repo: "narraitor",
    issueNumber: parseInt($ARGUMENTS)
  });
  
  console.log(`Successfully fetched issue #${issue.number}: ${issue.title}`);
  console.log(`Issue status: ${issue.state}`);
  console.log(`Created by: ${issue.user.login}`);
  console.log(`Created at: ${issue.created_at}`);
  console.log(`Updated at: ${issue.updated_at}`);
  
  // Show labels if any
  if (issue.labels && issue.labels.length > 0) {
    console.log(`Labels: ${issue.labels.map(label => label.name).join(', ')}`);
  }
  
  console.log(`\nIssue body:`);
  console.log(issue.body);
  
  // Test creating a PR (without actually creating one)
  console.log(`\nCould create a PR with:`);
  console.log(`createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: "Fix #${issue.number}: ${issue.title}",
    body: "## Summary\nImplements issue #${issue.number}",
    head: "feature/issue-${issue.number}",
    base: "develop"
  });`);
  
} catch (error) {
  console.error("Error accessing MCP GitHub tool:", error);
  
  // Fall back to fetch-github-issue.sh script
  console.log("\nFalling back to helper script:");
  console.log("./scripts/fetch-github-issue.sh $ARGUMENTS");
}
```

## Available MCP GitHub Methods

The most commonly used methods in the MCP GitHub tool include:

1. `getIssue` - Fetch a specific issue
2. `listIssues` - List repository issues
3. `createPullRequest` - Create a new pull request
4. `listPullRequests` - List repository pull requests
5. `getRepository` - Get repository information
6. `createComment` - Create a comment on an issue or PR

For more details, refer to the documentation in `/docs/mcp-github-usage.md`.
