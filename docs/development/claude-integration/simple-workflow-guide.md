---
title: "Simple Guide: From GitHub Issue to Implementation"
type: guide
category: claude-integration
tags: [github, workflow, claude-app, claude-code]
created: 2025-05-18
updated: 2025-06-08
---

# Simple Guide: From GitHub Issue to Implementation

This guide provides a straightforward workflow for implementing GitHub issues using Claude App for planning and Claude Code for implementation.

## Quick Reference

1. **Pick issue** from GitHub
2. **Plan in Claude App** to create technical spec
3. **Implement in Claude Code** using `/project:do-issue` command
4. **Verify and complete** following the guided process

## Step 1: Pick a GitHub Issue

1. Review open issues at: https://github.com/jerseycheese/narraitor/issues
2. Look for issues labeled with:
   - `priority:high`
   - `complexity:small` or `complexity:medium`
   - Appropriate domain tag (e.g., `domain:world-interface`)
3. Note the issue number (e.g., #292)

## Step 2: Plan in Claude App

1. **Open Claude App** (https://claude.ai)
2. **Use the planning template**:

```
# Project Analysis Request

## Context
I'm working on the Narraitor project, a Next.js/React application for a narrative-driven RPG framework using AI.

## Request
Help me analyze GitHub issue #[ISSUE-NUMBER] to create a technical specification.

## Information Access
Please use brave_web_search to understand the requirements and check GitHub for any additional context.

## Analysis Goals
Based on this information, please:
1. Create a technical specification for this issue
2. Provide a step-by-step implementation plan 
3. Identify existing utilities/helpers that can be leveraged
4. Plan appropriate testing approach

Feel free to ask me any questions if you need additional context.
```

3. **Review and refine** the technical specification Claude App provides
4. **Save the specification** as a reference (copy to a text file or keep the Claude App tab open)

## Step 3: Implement with Claude Code

1. **Open your terminal** and navigate to your project:
   ```bash
   cd /Users/jackhaas/Projects/narraitor
   ```

2. **Start Claude Code** with the issue number:
   ```bash
   claude
   ```

3. **Use the do-issue command** with your issue number:
   ```
   /project:do-issue [ISSUE-NUMBER]
   ```

4. **Follow the guided workflow**:
   - Claude Code will fetch the issue using MCP GitHub tools
   - It will create a feature branch
   - It will analyze the issue and create a plan
   - It will implement tests and code following TDD
   - It will create a test harness if needed

5. **At the verification checkpoint**:
   - Follow the verification instructions
   - Test in Storybook, test harness, and full application
   - Type "C" to continue when verification is complete

6. **Review the PR** that Claude Code creates and make any final adjustments

## Tips for Success

### Handling Complex Issues

If the issue is complex and you need more planning:
1. Spend more time in the Claude App planning phase
2. Add specific questions to understand complex parts
3. Break down the issue into smaller tasks

### Verification Reminder

Never skip verification. Always test:
1. In Storybook (component isolation)
2. In the test harness (controlled environment)
3. In the full application (system integration)

### Using Your Claude App Plan in Claude Code

If you want to use your Claude App plan directly:
1. At the issue analysis step in Claude Code, mention:
   ```
   I've already created a technical specification for this issue in Claude App. 
   Let me share the key points: [PASTE RELEVANT PARTS]
   ```

2. Claude Code will incorporate your plan into its approach

## Example Workflow

**Issue**: #292 "Show world details including name description genre and timestamps"

**Claude App Analysis**:
- Gather requirements from issue description
- Create technical specification for what to implement
- Plan out what components to modify
- Determine needed tests

**Claude Code Implementation**:
```
/project:do-issue 292
```
- Follow the guided workflow
- Perform verification when prompted
- Review and approve the PR

That's it! You've now taken an issue from planning to implementation using Claude App and Claude Code together.
