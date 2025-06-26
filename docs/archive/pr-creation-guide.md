# PR Creation Guide for Claude Code

This guide provides instructions for creating properly formatted pull requests in the Narraitor project using Claude Code.

## Key Requirements

1. **Always merge into `develop` branch**
   - All PRs should target the `develop` branch as the base, not `main`
   - This is critical for our development workflow

2. **Use the PR template**
   - PRs must use the template from `.github/PULL_REQUEST_TEMPLATE.md`
   - This ensures consistency and proper documentation

## Using the claude-pr.sh Script

We've created a helper script to properly format PRs with our template:

```bash
./scripts/claude-pr.sh [issue-number] [branch-name] [brief-description]
```

Example:
```bash
./scripts/claude-pr.sh 123 feature/issue-123 "Implement character card component"
```

The script will:
1. Read the PR template from `.github/PULL_REQUEST_TEMPLATE.md`
2. Replace placeholders (like issue numbers)
3. Format the PR title and body properly
4. Set the base branch to `develop`
5. Provide MCP GitHub tool code for creating the PR

## Manual PR Creation with MCP GitHub Tool

If you need to manually create a PR, always follow this pattern:

```javascript
// First, read the PR template
const fs = require('fs');
const prTemplatePath = '.github/PULL_REQUEST_TEMPLATE.md';
let prBody = '';

try {
  // Read the PR template
  prBody = fs.readFileSync(prTemplatePath, 'utf8');
  
  // Replace placeholders (like issue numbers)
  prBody = prBody.replace('Closes #', 'Closes #123'); // Replace 123 with actual issue number
  
  // Create the PR
  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: "Fix #123: Brief description",
    body: prBody,
    head: "feature/issue-123",
    base: "develop" // IMPORTANT: Always use develop
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR:", error);
}
```

## PR Title Naming Convention

PR titles should follow this format:
```
Fix #[issue-number]: [Brief description]
```

For example:
```
Fix #123: Implement character card component
```

## Common Issues and Solutions

### Template Not Found
If the PR template can't be found, check:
- The path: `.github/PULL_REQUEST_TEMPLATE.md`
- File permissions

### Wrong Base Branch
If the PR is targeting the wrong branch:
- Always explicitly set `base: "develop"` in the createPullRequest call
- Verify the base branch with `console.log` before creating the PR

### PR Creation Failure
If PR creation fails, provide a manual URL:
```
https://github.com/jerseycheese/narraitor/compare/develop...feature/issue-[issue-number]
```

## Checklist Before Creating PR

- [x] Base branch set to `develop`
- [x] Using PR template from `.github/PULL_REQUEST_TEMPLATE.md`
- [x] PR title follows convention: `Fix #[issue-number]: [Brief description]`
- [x] Branch name follows convention: `feature/issue-[issue-number]`
- [x] All implementation verification steps completed
