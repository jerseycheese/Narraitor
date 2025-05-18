# Claude Integration Documentation

This directory contains comprehensive documentation for integrating Claude App and Claude Code into the Narraitor development workflow.

## Overview

The Narraitor project leverages Claude App and Claude Code to accelerate development while maintaining high quality standards. This documentation provides guidelines, best practices, and workflow automation strategies to effectively use these tools in your development process.

## Key Guides

### Getting Started
- [Integration Guide](./integration-guide.md) - Complete guide to integrating Claude App and Claude Code
- [Simple Workflow Guide](./simple-workflow-guide.md) - Straightforward process from planning to implementation

### Core Workflows
- [Complete Development Flowchart](./complete-development-flowchart.md) - Visual guide to the development process
- [Concrete Development Example](./concrete-development-example.md) - Step-by-step example of a feature implementation
- [Workflow Completion](./workflow-completion.md) - Guidelines for completing and transitioning between tasks

### Technical Guides
- [Claude Code Guide](./claude-code-guide.md) - Comprehensive guide to using Claude Code
- [Claude Code Best Practices](./claude-code-best-practices.md) - Best practices for Claude Code
- [Claude Code Permissions](./claude-code-permissions.md) - Security settings for Claude Code
- [Claude Max Usage Guide](./claude-max-usage-guide.md) - Optimizing token usage

### Key Tools and Frameworks
- [MCP GitHub Usage Guide](./mcp-github-usage.md) - Using MCP GitHub tools instead of gh CLI
- [Three-Stage Verification Framework](./three-stage-verification.md) - Comprehensive verification process
- [Workflow Scripts](./workflow-scripts.md) - Details on automation scripts

## Important Updates

### PR Template and Branch Targeting (May 2025)

We've implemented fixes to ensure PRs always use the correct template and target the develop branch:

- New helper script `/scripts/claude-pr.sh` creates PRs with proper templating
- PRs must always target `develop` branch, never `main`
- Documentation updated in [MCP GitHub Usage Guide](./mcp-github-usage.md)
- For detailed info, see [PR Creation Guide](/Users/jackhaas/Projects/narraitor/docs/development/workflows/pr-creation-guide.md)

### MCP GitHub Tools (May 2025)

We've updated our workflows to use MCP GitHub tools instead of the `gh` CLI, providing these benefits:
- No permission prompts that interrupt the workflow
- Better error handling with clear fallback mechanisms
- More consistent behavior across different environments
- Seamless integration with Claude Code

See the [MCP GitHub Usage Guide](./mcp-github-usage.md) for detailed information.

### Three-Stage Verification Framework (May 2025)

We've implemented a comprehensive Three-Stage Verification Framework:
- Mandatory verification points in all workflows
- Issue-specific verification checklists
- Structured approach from component isolation to system integration
- Clear guidelines for what to verify at each stage

See the [Three-Stage Verification Framework](./three-stage-verification.md) for detailed information.

## Using These Documents

This documentation is designed to be:

1. **Progressive** - Start with the high-level Integration Guide, then explore specific topics
2. **Referenced** - Directly linked from CLAUDE.md for context in Claude Code sessions
3. **Maintained** - Updated regularly as workflows and tools evolve
4. **Practical** - Includes concrete examples and ready-to-use scripts

## Helper Scripts

The following helper scripts are available to facilitate Claude Code workflows:

- `./scripts/claude-branch.sh`: Manages git branches without permission prompts
- `./scripts/claude-github.sh`: GitHub API operations without permission prompts
- `./scripts/claude-pr.sh`: Creates PRs with proper template and targeting develop
- `./scripts/fetch-github-issue.sh`: Fetches GitHub issues without prompts
- `./scripts/claude-edit.sh`: Edits files without permission prompts
- `./scripts/enable-auto-accept.sh`: Enables session-level auto-accept

These scripts are pre-approved in the Claude Code settings and help avoid permission prompts during automation.

## Additional Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Claude App Documentation](https://docs.anthropic.com/en/docs/claude/overview)
- [Model Context Protocol (MCP) Documentation](https://docs.anthropic.com/en/docs/claude/mcp)
