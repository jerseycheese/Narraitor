---
title: "Claude App and Claude Code Integration Guide"
type: guide
category: claude-integration
tags: [claude-app, claude-code, integration, workflow]
created: 2025-05-18
updated: 2025-06-08
---

# Claude App and Claude Code Integration Guide

## Overview

This guide provides a comprehensive approach to integrating Claude App and Claude Code into your Narraitor development workflow. It introduces an automated workflow system that minimizes manual intervention while maintaining appropriate review gates at critical decision points.

## What We've Created

1. **Project Memory File (CLAUDE.md)**
   - Provides context about Narraitor for Claude Code
   - Documents coding standards, project structure, and workflow

2. **Complete Development Flowchart**
   - End-to-end workflow from planning to PR creation
   - Clear delineation of Claude App vs. Claude Code tasks
   - Manual review gates at critical decision points

3. **Automated Workflow Script**
   - Manages the entire development lifecycle
   - Handles transitions between Claude App and Claude Code
   - Automates context sharing between tools
   - Implements notification system for human attention points
   - Maintains state tracking throughout the process

4. **MCP GitHub Tools Integration**
   - Using MCP GitHub tools instead of gh CLI for all GitHub operations
   - Helper scripts for GitHub operations without permission prompts
   - Automatic issue management and PR creation
   - Detailed documentation in [MCP GitHub Usage Guide](./mcp-github-usage.md)

5. **Three-Stage Verification Framework**
   - Mandatory verification points in the workflow
   - Comprehensive testing approach from isolation to full integration
   - Issue-specific verification checklists
   - Detailed process in [Three-Stage Verification Guide](./three-stage-verification.md)

6. **Permission Setup Guide**
   - Secure configuration for Claude Code
   - Phase-specific permission profiles
   - Best practices for security

7. **Claude Code Best Practices**
   - When to use Claude Code vs. Claude App
   - Command reference and usage patterns
   - Workflow integration strategies

8. **Usage Tracking Guide**
   - Monitoring Claude Max subscription usage
   - Strategies for optimizing token usage
   - Task distribution guidelines

## Integration Plan

### Step 1: Set Up Project Memory

1. **Create CLAUDE.md in project root**
   ```bash
   # Copy the CLAUDE.md content to your project root
   cp claude-md-file.md /Users/jackhaas/Projects/narraitor/CLAUDE.md
   ```

2. **Initialize Claude Code with memory**
   ```bash
   # Run this in your project directory
   cd /Users/jackhaas/Projects/narraitor
   claude /init
   ```

### Step 2: Configure Security Permissions

1. **Create settings directory**
   ```bash
   mkdir -p /Users/jackhaas/Projects/narraitor/.claude
   ```

2. **Set up baseline permissions**
   - Copy the recommended permission settings to:
     - `.claude/settings.json` (project-wide)
     - `.claude/settings.local.json` (personal)

3. **Add to gitignore**
   ```bash
   echo ".claude/settings.local.json" >> .gitignore
   ```

### Step 3: Install Automation Scripts

1. **Install the main workflow script**
   ```bash
   cp claude-workflow.sh /Users/jackhaas/Projects/narraitor/claude-workflow.sh
   chmod +x /Users/jackhaas/Projects/narraitor/claude-workflow.sh
   ln -s /Users/jackhaas/Projects/narraitor/claude-workflow.sh /usr/local/bin/claude-workflow
   ```

2. **Install GitHub helper scripts**
   ```bash
   cp scripts/claude-github.sh /Users/jackhaas/Projects/narraitor/scripts/
   cp scripts/fetch-github-issue.sh /Users/jackhaas/Projects/narraitor/scripts/
   cp scripts/claude-branch.sh /Users/jackhaas/Projects/narraitor/scripts/
   chmod +x /Users/jackhaas/Projects/narraitor/scripts/*.sh
   ```

3. **Create workflow state directory**
   ```bash
   mkdir -p /Users/jackhaas/Projects/narraitor/.claude-workflow
   echo ".claude-workflow/" >> .gitignore
   ```

4. **Install sound notification support**
   ```bash
   # No additional installation needed for macOS
   # Test notification
   claude-workflow.sh test-notify
   ```

### Step 4: Update Documentation

1. **Add to development documentation**
   ```bash
   mkdir -p /Users/jackhaas/Projects/narraitor/docs/development/claude-integration
   cp improved-automation-example.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   cp claude-code-best-practices.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   cp claude-max-usage-guide.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   cp complete-development-flowchart.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   cp claude-code-permissions.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   cp mcp-github-usage.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   cp three-stage-verification.md /Users/jackhaas/Projects/narraitor/docs/development/claude-integration/
   ```

## Fully Automated Workflow

Here's how a typical development task flows using the new automated workflow:

### 1. Start Project Analysis

```bash
# Start analysis with a specific issue
claude-workflow.sh analyze 123

# Or let Claude find the best next task
claude-workflow.sh analyze
```

The script:
- Initializes Claude App with the appropriate template
- Fetches issue details using MCP GitHub tools or helper scripts
- Otherwise, has Claude recommend a priority task
- Notifies you with a sound when the analysis is complete

**MANUAL REVIEW GATE 1:**
- You review the technical specification
- Approve or request modifications
- Script records your approval

### 2. Define Tests

```bash
# After approving the spec
claude-workflow.sh define-tests
```

The script:
- Transitions to test definition phase in Claude App
- Passes the approved technical spec automatically
- Notifies you when test definitions are ready

**MANUAL REVIEW GATE 2:**
- You review the test specifications
- Approve or request modifications
- Script records your approval

### 3. Implementation in Claude Code

```bash
# After approving the tests
claude-workflow.sh implement
```

The script:
- Initializes Claude Code with the technical spec and test specifications
- Sets up appropriate permissions for implementation
- Notifies you when implementation is complete

**MANUAL REVIEW GATE 3:**
- You review the implementation
- Script provides options:
  - Approve implementation
  - Request specific fixes
  - Reject implementation

### 4. Three-Stage Verification

```bash
# After reviewing implementation
claude-workflow.sh verify
```

The script:
- Generates a Three-Stage Verification checklist specific to the issue
- Walks you through the verification process:
  1. Storybook verification
  2. Test harness verification
  3. System integration verification
- Records verification results for each stage

**Verification Process:**
- You perform the verification following the checklist
- Report pass/fail for each verification point
- Script records results and only proceeds when all verification is complete

### 5. Cleanup and PR Creation

```bash
# After verification passes
claude-workflow.sh finalize
```

The script:
- Initiates cleanup in Claude Code
- Creates a pull request using MCP GitHub tools
- Notifies you to review the PR

**MANUAL REVIEW GATE 4:**
- You review the PR in GitHub
- Merge or request changes
- Close the GitHub issue if satisfied

## Benefits of Automated Approach

1. **Minimal Manual Intervention**
   - Script handles all transitions between phases
   - Context is automatically passed between tools
   - All handoffs are managed by the automation
   - You only need to review at critical gates

2. **GitHub Issue Integration via MCP Tools**
   - MCP GitHub tools used for all GitHub operations
   - No permission prompts for GitHub operations
   - Better error handling with fallback mechanisms
   - PRs are created with appropriate links to issues
   - Detailed in the [MCP GitHub Usage Guide](./mcp-github-usage.md)

3. **Mandatory Three-Stage Verification**
   - Comprehensive verification process at all levels
   - Issue-specific verification checklists
   - Clear verification points tied to acceptance criteria
   - Full details in the [Three-Stage Verification Guide](./three-stage-verification.md)

4. **Preserved Manual Review Gates**
   - Technical specification review
   - Test specification review
   - Implementation review
   - Verification review
   - PR review

5. **Automated Notifications**
   - Sound alerts when human attention is needed
   - Clear indication of what needs review
   - Allows multitasking during implementation phases

6. **State Tracking**
   - Prevents out-of-order operations
   - Preserves context between sessions
   - Makes it easy to resume interrupted workflows

## Related Documentation

- [Claude Code Best Practices](./claude-code-best-practices.md) - Guidelines for using Claude Code effectively
- [Claude Code Guide](./claude-code-guide.md) - Comprehensive guide to Claude Code
- [Claude Code Permissions](./claude-code-permissions.md) - Security settings for Claude Code
- [MCP GitHub Usage Guide](./mcp-github-usage.md) - Using MCP GitHub tools instead of gh CLI
- [Three-Stage Verification Framework](./three-stage-verification.md) - Comprehensive verification process
- [Complete Development Flowchart](./complete-development-flowchart.md) - Visual guide to the workflow
- [Claude Max Usage Guide](./claude-max-usage-guide.md) - Optimizing token usage
- [Workflow Completion](./workflow-completion.md) - Finishing and transitioning between tasks
- [Workflow Scripts](./workflow-scripts.md) - Details on automation scripts

## Maintenance and Extensions

1. **Customizing the Workflow**
   - Edit templates in the script to match your preferences
   - Add additional gates for specific types of features
   - Customize notification sounds for different phases

2. **Extending the Script**
   - Add integration with other tools (Jira, Slack, etc.)
   - Create a simple web dashboard for workflow status
   - Add analytics for workflow optimization

3. **Usage Monitoring**
   - Track token usage between tools
   - Adjust task allocation based on efficiency
   - Consider workflow changes if hitting limits

## Conclusion

This automated integration approach addresses your specific pain points:

1. ✅ **Long Chat Handoffs**: Fully automated with zero manual copy/pasting
2. ✅ **Context Switching**: Eliminated with automatic context transfer
3. ✅ **Build/Test Iterations**: Streamlined with direct Claude Code execution
4. ✅ **Manual Review**: Maintained at appropriate gates only
5. ✅ **GitHub Integration**: MCP GitHub tools for seamless operations
6. ✅ **Verification Process**: Three-Stage Verification for quality assurance
7. ✅ **Multitasking Support**: Notifications when your attention is needed

The automation system combines the strengths of Claude App for planning and Claude Code for implementation while eliminating tedious manual steps, allowing you to focus on higher-value review and decision-making activities.
