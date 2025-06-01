# Claude Code Integration Guide

## Overview
This guide explains how to use Claude Code with the Narraitor project, following Anthropic's best practices. Claude Code is an agentic command-line tool that helps with development tasks by providing AI-powered coding assistance.

## Setup

1. Install Claude Code following Anthropic's instructions (https://docs.anthropic.com/en/docs/claude-code/overview)

2. Run the setup script to configure Claude Code for the project:
   ```bash
   ./scripts/setup-claude-code.sh
   ```

3. For GitHub integration, ensure the MCP GitHub tool is available:
   ```bash
   ./scripts/setup-mcp-github.sh
   ```

## Claude Code Memory

Claude Code uses memory files to retain context between sessions:

1. **Project Memory**: `CLAUDE.md` at the project root contains project-specific information
   
2. **User Memory**: `~/.claude/CLAUDE.md` for your global personal preferences

3. **Custom Commands**: Custom workflow commands in `.claude/commands/` directory

## Custom Commands

We've created several custom slash commands to streamline common workflows:

| Command | Purpose |
|---------|---------|
| `/project:do-issue [issue-number]` | Implement GitHub issue with mandatory verification |
| `/project:do-issue-auto [issue-number]` | Auto-implement GitHub issue with minimal prompts |
| `/project:analyze-issue [issue-number]` | Analyze GitHub issue and create technical spec |
| `/project:tdd-implement [feature-name]` | Implement a feature using TDD |
| `/project:create-docs [component/feature]` | Create comprehensive documentation |
| `/project:create-pr [feature-description]` | Create a pull request |
| `/project:transition [context]` | Transition between Claude App and Claude Code |

## MCP GitHub Tool Integration

### Overview
The Narraitor project uses the MCP GitHub tool for all GitHub operations instead of the `gh` CLI commands. This approach eliminates permission prompts and provides better error handling.

### Basic Operations

```javascript
// Example MCP GitHub tool operations:

// Fetch an issue
const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123
});

// List issues
const issues = await mcp__modelcontextprotocol_server_github__server_github.listIssues({
  owner: "jerseycheese",
  repo: "narraitor",
  state: "open"
});

// Create a PR
const pr = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
  owner: "jerseycheese",
  repo: "narraitor",
  title: "Fix #123: Implement feature",
  body: "PR description...",
  head: "feature-branch",
  base: "develop"
});

// Close an issue
await mcp__modelcontextprotocol_server_github__server_github.updateIssue({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123,
  state: "closed"
});

// Add a comment
await mcp__modelcontextprotocol_server_github__server_github.addIssueComment({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123,
  body: "Implementation completed!"
});
```

### Helper Scripts

For cases where MCP GitHub tools aren't available, use our helper scripts:

```bash
# Fetch issue details
./scripts/fetch-github-issue.sh 123

# Use flexible GitHub operations
./scripts/claude-github.sh issue 123
./scripts/claude-github.sh repo
./scripts/claude-github.sh prs
```

## Workflow Automation Scripts

The following scripts help automate workflows between Claude App and Claude Code:

| Script | Purpose |
|--------|---------|
| `./scripts/setup-claude-workflow.sh` | Set up Claude workflow scripts |
| `./scripts/test-claude-workflow.sh` | Test Claude workflow installation |
| `./scripts/claude-workflow.sh` | Main workflow automation script |
| `./scripts/claude-handoff.sh` | Script for handoff between Claude App sessions |
| `./scripts/claude-transition.sh` | Script for transitions between App and Code |
| `./scripts/claude-github.sh` | Helper script for GitHub operations |
| `./scripts/claude-branch.sh` | Helper script for branch management |
| `./scripts/claude-edit.sh` | Helper script for file editing |
| `./scripts/claude-pr.sh` | Helper script for PR creation |

## Recommended Workflows

### 1. GitHub Issue Implementation

```
claude
> /project:do-issue [issue-number]
```

This workflow:
1. Fetches the GitHub issue using MCP GitHub tools
2. Creates a feature branch with proper naming
3. Analyzes the issue requirements
4. Follows our TDD approach to implementation
5. Includes mandatory verification steps
6. Creates a PR using MCP GitHub tools when complete

For a more automated version with fewer prompts:
```
claude
> /project:do-issue-auto [issue-number]
```

This still includes the mandatory verification step but proceeds automatically through other phases.

### 2. Test-Driven Development (TDD)

```
claude
> /project:tdd-implement [feature-name]
```

This follows our project's TDD approach:
1. Write tests first
2. Verify tests fail
3. Implement minimum code to pass
4. Refactor while maintaining passing tests

### 3. Documentation Creation

```
claude
> /project:create-docs [component/feature]
```

This creates comprehensive documentation following our project standards.

### 4. PR Creation

```
claude
> /project:create-pr [feature-description]
```

This helps create pull requests with proper formatting and linking to issues.

## Three-Stage Manual Verification

A critical part of our workflow is the Three-Stage Manual Verification process, which includes:

### 1. Storybook Testing
- Review all story variants
- Test interactive controls
- Verify visual appearance
- Check responsive behavior
- Verify accessibility features

### 2. Test Harness Verification
- Test with realistic data in `/dev/[component-name]` routes
- Verify state transitions
- Test error handling and edge cases
- Check integration with parent components

### 3. System Integration Verification
- Test within the full application
- Verify with real data
- Check interactions with other components
- Confirm all acceptance criteria are met

## Best Practices

1. **Use MCP GitHub tools**: Always use MCP GitHub tools instead of `gh` CLI for GitHub operations.

2. **Include verification points**: Always include the Three-Stage Verification process in implementation workflows.

3. **Use CLAUDE.md effectively**: Add project-specific information to help Claude understand the codebase.

4. **Leverage custom commands**: Use the slash commands to streamline repeated workflows.

5. **Maintain context**: Use the transition command when switching between Claude App and Claude Code.

6. **Be specific**: Give Claude clear instructions about what you want to accomplish.

7. **Iterate and refine**: Claude works better with iteration - don't expect perfect results on the first try.

8. **Stay within file size limits**: Remember our 300-line limit for components and files.

9. **Follow domain boundaries**: Respect the domain boundaries in our architecture.

10. **Write tests first**: Always follow our TDD approach.

## Troubleshooting

1. If Claude loses context, use `/memory` to view memory files.

2. If permissions are repeatedly requested, update `.claude/settings.json`.

3. If MCP GitHub tools aren't working:
   - Check that the MCP GitHub integration is installed
   - Fall back to the helper scripts (`scripts/claude-github.sh`, etc.)
   - Verify GitHub access tokens are properly configured

4. If automation workflows aren't proceeding correctly:
   - Check that the required verification steps have been completed
   - Ensure branch naming follows our conventions
   - Verify commit messages follow our format

## Resources

- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Claude Code Memory](https://docs.anthropic.com/en/docs/claude-code/memory)
- [MCP GitHub Tools Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp-github)
