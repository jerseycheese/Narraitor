# TEST-MCP-PR

I'll test the MCP GitHub tool for creating pull requests.

This command will demonstrate how to use the MCP GitHub PR creation API, but will NOT actually create a PR (it will just show the code).

## Step 1: Set up test variables

```javascript
// Test values - these would normally come from your workflow
const owner = "jerseycheese";
const repo = "narraitor";
const issueNumber = $ARGUMENTS || 123; // Use passed argument or default to 123
const branchName = `feature/issue-${issueNumber}`;
const baseBranch = "develop";
const title = `Fix #${issueNumber}: Test PR creation with MCP GitHub tool`;
const body = `# PR: Fix for Issue #${issueNumber}

## Summary
This is a test PR to demonstrate MCP GitHub tool integration.

## Implemented Features
- Feature 1: MCP GitHub PR creation
- Feature 2: Error handling
- Feature 3: Manual fallback

## Testing Done
- Unit tests
- Integration tests

## Scope Boundaries
This PR implements ONLY the functionality defined in the issue.

Closes #${issueNumber}`;
```

## Step 2: Show how to create a PR using the MCP GitHub tool

```javascript
// Demonstration code for PR creation (not actually executing)
console.log("Here's how to create a PR using the MCP GitHub tool:");
console.log(`
// Create PR using MCP GitHub tool
try {
  // Get the PR template content from the repository
  const templateContent = /* PR Template from .github/PULL_REQUEST_TEMPLATE.md */\`# Pull Request Template

## Description
Implementation of the features required for issue #${issueNumber}. 

## Related Issue
Closes #${issueNumber}

## Type of Change
- [x] New feature (non-breaking change which adds functionality)

## TDD Compliance
- [x] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

## User Stories Addressed
- Implemented features based on issue #${issueNumber}

## Implementation Notes
- Feature implemented following project patterns
- Maintained backward compatibility
- Followed single responsibility principle

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed\`;

  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "${owner}",
    repo: "${repo}",
    title: "${title}",
    body: templateContent,
    head: "${branchName}",
    base: "${baseBranch}"
  });
  
  console.log(\`Successfully created PR: \${pullRequest.html_url}\`);
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  
  // Provide URL for manual PR creation
  console.log("Please create the PR manually using this URL:");
  console.log(\`https://github.com/${owner}/${repo}/compare/${baseBranch}...${branchName}\`);
}
`);
```

## Step 3: Manual fallback for PR creation

If the MCP GitHub tool is not available or fails, you can create a PR manually using this URL:

```
https://github.com/jerseycheese/narraitor/compare/develop...feature/issue-$ARGUMENTS
```

Important notes:
1. Always use the MCP GitHub tool instead of the `gh` CLI command
2. Always provide a fallback URL for manual PR creation in case the MCP tool fails
3. Use the correct base branch (develop in this case, not main)
4. Include semantic commit messages and issue references
