# PR Template and Branch Targeting Fixes

## Overview of Changes

I've implemented several changes to ensure pull requests are properly created with the PR template and always target the `develop` branch:

### 1. Helper Script for PR Creation

Created a new script at `/scripts/claude-pr.sh` that:
- Reads the PR template from `.github/PULL_REQUEST_TEMPLATE.md`
- Replaces placeholders with actual issue information
- Explicitly sets the base branch to `develop`
- Generates the proper MCP GitHub tool code for PR creation

### 2. MCP GitHub Usage Documentation

Updated `/docs/development/claude-integration/mcp-github-usage.md` to:
- Add explicit instructions for reading the PR template
- Emphasize ALWAYS targeting the `develop` branch
- Provide proper code examples for PR creation
- Include troubleshooting for common PR issues

### 3. New PR Creation Guide

Created `/docs/development/workflows/pr-creation-guide.md` that:
- Provides detailed instructions for PR creation
- Emphasizes the required template and target branch
- Offers solutions for common problems
- Includes a checklist for PR creation

## Key Requirements Emphasized

All documentation now clearly emphasizes these critical requirements:

1. **Always use the PR template** from `.github/PULL_REQUEST_TEMPLATE.md`
2. **Always target the `develop` branch**, never `main`
3. **Follow naming conventions** for PRs and branches

## Usage

When creating PRs, either:

1. Use the helper script:
   ```bash
   ./scripts/claude-pr.sh [issue-number] [branch-name] [brief-description]
   ```

2. Or manually read the template in your code:
   ```javascript
   const fs = require('fs');
   const prTemplatePath = '.github/PULL_REQUEST_TEMPLATE.md';
   let prBody = fs.readFileSync(prTemplatePath, 'utf8');
   
   // Create PR with template and targeting develop
   const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
     title: "Fix #123: Brief description",
     body: prBody,
     head: "feature/issue-123",
     base: "develop"  // ALWAYS develop
   });
   ```

## Next Steps

The `do-issue.md` and `do-issue-auto.md` files should be updated to incorporate these changes. When these files are modified, they should use the approach shown in the documentation or call the helper script.
