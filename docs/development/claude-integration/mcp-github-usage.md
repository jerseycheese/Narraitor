# MCP GitHub Tools Usage Guide

## Overview

This guide explains how to use the MCP GitHub tools in the Narraitor project. The MCP GitHub tools provide a way to interact with GitHub directly through Model Context Protocol functions without using the `gh` CLI, eliminating permission prompts and providing better error handling.

## Why Use MCP GitHub Tools Instead of `gh` CLI

1. **No Permission Prompts**: MCP GitHub tools don't require interactive permission approval for each operation
2. **Better Error Handling**: More consistent error messages and fallback mechanisms
3. **Direct API Integration**: More efficient without command-line wrapper overhead
4. **Seamless Integration**: Works smoothly with Claude Code's execution flow

## MCP GitHub Tool Functions

### Basic Issue Operations

#### Fetch an Issue

```javascript
const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
  owner: "jerseycheese",
  repo: "Narraitor",
  issueNumber: 123
});

console.log(`Successfully fetched issue #${issue.number}: ${issue.title}`);
```

#### List Issues

```javascript
const issues = await mcp__modelcontextprotocol_server_github__server_github.listIssues({
  owner: "jerseycheese",
  repo: "Narraitor",
  state: "open"
});

console.log(`Found ${issues.length} open issues`);
```

#### Update an Issue

```javascript
await mcp__modelcontextprotocol_server_github__server_github.updateIssue({
  owner: "jerseycheese",
  repo: "Narraitor",
  issueNumber: 123,
  state: "closed"
});

console.log("Issue closed successfully");
```

#### Add a Comment to an Issue

```javascript
await mcp__modelcontextprotocol_server_github__server_github.addIssueComment({
  owner: "jerseycheese",
  repo: "Narraitor",
  issueNumber: 123,
  body: "Implementation completed and verified!"
});

console.log("Comment added successfully");
```

### Pull Request Operations

#### Create a Pull Request with PR Template

```javascript
// First, read the PR template
const fs = require('fs');

try {
  // Read the PR template
  const prTemplatePath = '.github/PULL_REQUEST_TEMPLATE.md';
  let prBody = fs.readFileSync(prTemplatePath, 'utf8');
  
  // Update template with issue number
  prBody = prBody.replace('Closes #', 'Closes #123'); // Replace 123 with actual issue
  
  // Create PR with the template as body
  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "Narraitor",
    title: "Fix #123: Implement feature X",
    body: prBody,
    head: "feature/issue-123",
    base: "develop"  // ALWAYS use develop as the base branch
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR with template:", error);
}
```

#### Using claude-pr.sh Helper Script

If you're having issues reading the template directly, use our helper script:

```bash
# Run the helper script to get PR creation code with proper template
./scripts/claude-pr.sh 123 feature/issue-123 "Implement character card component"
```

This script will output JavaScript code you can use with the MCP GitHub tool that properly uses the PR template.

#### List Pull Requests

```javascript
const prs = await mcp__modelcontextprotocol_server_github__server_github.listPullRequests({
  owner: "jerseycheese",
  repo: "Narraitor",
  state: "open"
});

console.log(`Found ${prs.length} open pull requests`);
```

#### Get Pull Request Details

```javascript
const pr = await mcp__modelcontextprotocol_server_github__server_github.getPullRequest({
  owner: "jerseycheese",
  repo: "Narraitor",
  pullNumber: 45
});

console.log(`PR #${pr.number} is ${pr.state}`);
```

### Repository Operations

#### Get Repository Information

```javascript
const repo = await mcp__modelcontextprotocol_server_github__server_github.getRepository({
  owner: "jerseycheese",
  repo: "Narraitor"
});

console.log(`Repository ${repo.full_name} has ${repo.stargazers_count} stars`);
```

#### Create a Branch

```javascript
await mcp__modelcontextprotocol_server_github__server_github.createBranch({
  owner: "jerseycheese",
  repo: "Narraitor",
  branch: "feature/new-feature",
  from_branch: "develop"
});

console.log("Branch created successfully");
```

## Error Handling with MCP GitHub Tools

Always implement proper error handling when using MCP GitHub tools:

```javascript
try {
  const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
    owner: "jerseycheese",
    repo: "Narraitor",
    issueNumber: 123
  });
  
  console.log(`Successfully fetched issue #${issue.number}: ${issue.title}`);
  
  // Continue with issue processing
} catch (error) {
  console.error("Error fetching issue with MCP GitHub tool:", error);
  
  // Fall back to helper script if MCP tool fails
  console.log("Falling back to helper script:");
  console.log("./scripts/fetch-github-issue.sh 123");
}
```

## Helper Scripts (Fallbacks)

If MCP GitHub tools aren't available, use our helper scripts:

### Fetch an Issue

```bash
./scripts/fetch-github-issue.sh 123
```

### Multiple GitHub Operations

```bash
# Fetch issue details
./scripts/claude-github.sh issue 123

# Get repository info
./scripts/claude-github.sh repo

# List pull requests
./scripts/claude-github.sh prs

# Create a pull request with proper template
./scripts/claude-pr.sh 123 feature/issue-123 "Brief description"
```

## Critical Requirements for PRs

When creating PRs in Narraitor, always:

1. **Use the PR Template**: Read it from `.github/PULL_REQUEST_TEMPLATE.md`
2. **Target the `develop` Branch**: Always set `base: "develop"` - NEVER use `main`
3. **Follow Naming Conventions**: 
   - PR Title: `Fix #[issue-number]: [Brief description]` 
   - Branch: `feature/issue-[issue-number]`

These are non-negotiable requirements for our workflow.

## Integration with Custom Commands

Our custom commands (like `/project:do-issue`) use MCP GitHub tools internally for seamless GitHub integration.

Example code that SHOULD be used in do-issue.md and do-issue-auto.md:

```javascript
// First, read the PR template
const fs = require('fs');
let prBody = '';

try {
  // Read the PR template and fill in issue number
  const prTemplatePath = '.github/PULL_REQUEST_TEMPLATE.md';
  prBody = fs.readFileSync(prTemplatePath, 'utf8');
  prBody = prBody.replace('Closes #', `Closes #${$ARGUMENTS}`);
  
  // Create PR with proper template and targeting develop branch
  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "Narraitor",
    title: `Fix #${$ARGUMENTS}: [Brief summary of changes]`,
    body: prBody,
    head: `feature/issue-${$ARGUMENTS}`,
    base: "develop"  // ALWAYS use develop
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  console.log("Using claude-pr.sh helper script:");
  console.log(`./scripts/claude-pr.sh ${$ARGUMENTS} feature/issue-${$ARGUMENTS} "[Brief summary of changes]"`);
}
```

## Best Practices for MCP GitHub Tools

1. **Always Include Error Handling**: Provide fallback mechanisms when MCP tools fail
2. **Always Use PR Template**: Read it from `.github/PULL_REQUEST_TEMPLATE.md`
3. **Always Target `develop` Branch**: Never create PRs targeting `main`
4. **Check Issue/PR Existence First**: Verify resources exist before trying to update them
5. **Use Consistent Naming**: Follow project conventions for branch names and PR titles
6. **Include Issue References**: Always include issue numbers in PR titles and descriptions
7. **Verify Critical Operations**: Double-check before closing issues or merging PRs
8. **Use Helper Scripts as Fallbacks**: Have backup methods for when MCP tools aren't available

## Common Workflow Examples

### Complete Issue Implementation Workflow

```javascript
try {
  // 1. Fetch the issue
  const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
    owner: "jerseycheese",
    repo: "Narraitor", 
    issueNumber: issueNumber
  });
  
  // 2. Implementation work happens here...
  
  // 3. Update the issue (add labels, etc.)
  await mcp__modelcontextprotocol_server_github__server_github.updateIssue({
    owner: "jerseycheese",
    repo: "Narraitor",
    issueNumber: issueNumber,
    labels: [...issue.labels.map(l => l.name), "status:completed"]
  });
  
  // 4. Read PR template and create PR
  const fs = require('fs');
  const prTemplatePath = '.github/PULL_REQUEST_TEMPLATE.md';
  let prBody = fs.readFileSync(prTemplatePath, 'utf8');
  prBody = prBody.replace('Closes #', `Closes #${issueNumber}`);
  
  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "Narraitor",
    title: `Fix #${issueNumber}: ${issue.title}`,
    body: prBody,
    head: `feature/issue-${issueNumber}`,
    base: "develop"  // ALWAYS use develop
  });
  
  // 5. Add a comment to the issue
  await mcp__modelcontextprotocol_server_github__server_github.addIssueComment({
    owner: "jerseycheese",
    repo: "Narraitor",
    issueNumber: issueNumber,
    body: `Implementation completed! Pull request: ${pullRequest.html_url}`
  });
} catch (error) {
  console.error("Error with GitHub operations:", error);
  // Fallback handling...
}
```

## Troubleshooting

### PR Created Without Template

If a PR is created without using the PR template:
1. Delete the PR
2. Use the `claude-pr.sh` script to properly create it:
   ```bash
   ./scripts/claude-pr.sh 123 feature/issue-123 "Brief description"
   ```
3. Copy the JavaScript code output and use it in Claude Code

### PR Targeting Wrong Branch

If a PR is targeting `main` instead of `develop`:
1. Delete the PR 
2. Recreate it with `base: "develop"` explicitly set:
   ```javascript
   // ALWAYS set base to develop
   base: "develop"
   ```

### MCP GitHub Tool Not Available

If the MCP GitHub tool isn't available, you might see errors like:

```
ReferenceError: mcp__modelcontextprotocol_server_github__server_github is not defined
```

In this case:
1. Fall back to the helper scripts
2. Check if the MCP GitHub integration is installed
3. Verify your Claude Code installation is up-to-date

## Documentation and References

For more detailed information, see:
- [PR Creation Guide](../workflows/pr-creation-guide.md) - Comprehensive guide for creating PRs
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [GitHub API Documentation](https://docs.github.com/en/rest)
