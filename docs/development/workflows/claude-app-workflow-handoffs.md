---
title: Claude App Workflow Handoffs
aliases: [Chat Transition Templates, Handoff Templates]
tags: [development, workflow, claude, process, transitions, handoffs]
created: 2025-04-28
updated: 2025-04-29
---

# Claude App Workflow Handoffs

> [!note]
> Template messages for transitioning between chats when hitting Claude app length limits, with scope control mechanisms.

## Purpose
These templates help maintain continuity when you need to start a new chat due to reaching Claude's context limits. They ensure that critical information and scope boundaries are transferred efficiently between chats.

## When to Use Handoffs

- When you see the warning: "Long chats cause you to reach your usage limits faster"
- When you notice Claude's responses becoming shorter or less helpful
- Proactively before reaching limits if you're in the middle of a complex task
- When transitioning between major workflow phases

## 1. Analysis to Implementation Handoff

### Request in Current Chat
```
We're approaching the chat length limit. Could you create a summary artifact of our task analysis and technical spec that I can use to continue implementation in a fresh chat? Include explicit scope boundaries detailing what is and isn't included in this task.
```

### Expected Artifact Content
```markdown
# Task Analysis Summary

## Task Overview
[Brief description of task]
Issue: #[number] if applicable
Priority: [High/Medium/Low]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]

## KISS Principles Applied
- Components limited to max 300 lines
- Single responsibility per function/component
- Simple props and state management
- Follows established patterns

## Technical Specification
Key Components:
- [Component 1]: [Purpose]
- [Component 2]: [Purpose]

Files to Modify:
- [Path 1]: [Changes needed]
- [Path 2]: [Changes needed]

Utilities/Helpers to Leverage:
- [Path to utility]: [Purpose and usage]

Implementation Steps:
1. Define tests (TDD approach)
2. Create Storybook stories (for UI components)
3. Implement minimum code to pass tests
4. [Additional steps]

Data Flow:
[Brief description of data flow]

## Context Notes
- [Any special consideration 1]
- [Any special consideration 2]
```

### Starting the New Chat
```
I'm continuing work on a Narraitor task from a previous chat. Here's the technical specification we developed with explicit scope boundaries:

[Paste the summary artifact]

Let's proceed with implementation, following our TDD and KISS principles:
1. Write tests first
2. Create Storybook stories for UI components
3. Implement the minimum code needed to pass tests
4. Keep components under 300 lines
5. Use existing utilities/helpers from `/users/jackhaas/projects/narraitor/src/lib` where appropriate

Important: Focus ONLY on what's defined within the scope boundaries. Do NOT add features, optimizations, or enhancements outside the defined scope.
```

## 2. Implementation to Test Fixes Handoff

### Request in Current Chat
```
We're approaching the chat length limit. Could you create a summary artifact of our implementation progress and remaining test issues that I can use to continue in a fresh chat? Include specific scope boundaries to prevent feature creep.
```

### Expected Artifact Content
```markdown
# Implementation Summary

## Feature Overview
[Brief description of implemented feature]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]

## Components Implemented
- [Component 1]: [Status - Complete/Partial]
- [Component 2]: [Status - Complete/Partial]

## Current Test Status
Passing Tests:
- [Test 1]
- [Test 2]

Failing Tests:
- [Test 3]: [Issue description]
- [Test 4]: [Issue description]

## Storybook Status (for UI components)
- [Story 1]: [Status - Complete/Needs updates]
- [Story 2]: [Status - Complete/Needs updates]

## Next Steps
1. Fix test [Test 3] by addressing [specific issue]
2. Complete implementation of [remaining component]
3. Add test coverage for [edge case]

## Implementation Notes
- [Important note about implementation approach]
- [Any technical decisions made]
```

### Starting the New Chat
```
I'm continuing work on test fixes for a Narraitor feature from a previous chat. Here's our implementation summary with scope boundaries:

[Paste the summary artifact]

Let's focus on fixing the failing tests, starting with [specific test]. Remember to maintain our KISS principles and ensure we've got appropriate Storybook stories for UI components.

Important: Fix only the specified issues without adding functionality beyond the defined scope boundaries.
```

## 3. Test Fixes to Build Issues Handoff

### Request in Current Chat
```
We're approaching the chat length limit. Could you create a summary artifact of our test fixes and current build issues that I can use to continue in a fresh chat? Include the specific scope boundaries that we need to maintain.
```

### Expected Artifact Content
```markdown
# Test & Build Status Summary

## Feature Overview
[Brief description of implemented feature]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]

## Test Status
- All unit tests: [Passing/Some failing]
- Integration tests: [Passing/Some failing]
- Remaining test issues: [List any]

## Current Build Issues
Error 1:
```
[Error message]
```
Location: [File path]
Probable cause: [Brief analysis]

Error 2:
```
[Error message]
```
Location: [File path]
Probable cause: [Brief analysis]

## Component Status
- Component size: [Line count, under/over 300]
- Storybook status: [Complete/Incomplete]
- KISS adherence: [Notes on simplicity]

## Next Steps
1. Address build error in [specific file]
2. Fix remaining test issue with [specific test]
3. Verify build completes successfully
```

### Starting the New Chat
```
I'm continuing work on build issues for a Narraitor feature from a previous chat. Here's our current status with scope boundaries:

[Paste the summary artifact]

Let's focus on resolving these build errors, starting with the issue in [specific file]. Remember to maintain KISS principles (files under 300 lines, single responsibility) and ensure our test coverage remains intact.

Important: Fix only the specified build errors without modifying functionality or adding features beyond the defined scope.
```

## 4. Build Issues to Cleanup & Documentation Handoff

### Request in Current Chat
```
We're approaching the chat length limit. Could you create a summary artifact of our implementation and build fixes to use for cleanup and documentation in a fresh chat? Include the scope boundaries we need to maintain during cleanup.
```

### Expected Artifact Content
```markdown
# Implementation Complete Summary

## Feature Overview
[Brief description of implemented feature]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]

## Components Implemented
- [Component 1]: [Brief description]
- [Component 2]: [Brief description]

## Technical Approach
[Brief description of implementation approach]

## KISS & TDD Adherence
- Component sizes: [All under 300 lines?]
- Test-driven: [Were tests written first?]
- Storybook stories: [Created for UI components?]
- Utilities used: [List of utilities leveraged]

## Cleanup Needed
- Remove console.logs in [specific files]
- Fix TODOs in [specific files]
- Address commented code in [specific files]

## Documentation Needed
- Update [specific documentation file]
- Add JSDoc comments to [specific functions]
- Create usage examples for [specific component]

## GitHub Issue
Issue #[number]: [title]
Status: Ready to close after documentation
```

### Starting the New Chat
```
I've completed implementation of a Narraitor feature and now need to handle cleanup and documentation. Here's the implementation summary with scope boundaries:

[Paste the summary artifact]

Please help me with the cleanup and documentation tasks, starting with removing debug code and then updating the documentation.

Important: Keep documentation focused only on implemented functionality. Do not document potential enhancements or features outside the defined scope.
```

## 5. General Continuation Template

Use this template for any transition not covered above:

### Request in Current Chat
```
We're approaching the chat length limit. Could you create a summary artifact of our current progress and next steps that I can use to continue in a fresh chat? Include clear scope boundaries to prevent feature creep.
```

### Expected Artifact Content
```markdown
# Work Progress Summary

## Task Overview
[Brief description of overall task]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]

## Current Status
- [Major component 1]: [Status]
- [Major component 2]: [Status]

## Completed Steps
1. [Step 1]
2. [Step 2]

## Next Steps
1. [Next step 1]
2. [Next step 2]

## TDD & KISS Status
- Tests written first: [Yes/No/Partial]
- Component size compliance: [Under 300 lines?]
- Storybook stories status: [Complete/Incomplete]
- Utilities leveraged: [List utilities used]

## Technical Context
- [Important technical detail 1]
- [Important technical detail 2]

## Pending Decisions
- [Decision point 1]
- [Decision point 2]
```

### Starting the New Chat
```
I'm continuing work on a Narraitor task from a previous chat. Here's our current progress with scope boundaries:

[Paste the summary artifact]

Let's continue with [specific next step], following our TDD and KISS principles (tests first, keep it simple, components under 300 lines, use existing utilities).

Important: Focus only on the functionality defined in the scope boundaries. Do not add features or enhancements beyond what's specified.
```

## Best Practices for Effective Handoffs with Scope Control

1. **Always Include Scope Boundaries**: Every handoff should explicitly state what is and isn't in scope
2. **Be Specific About What NOT to Do**: List specific technical approaches or enhancements to avoid
3. **Reinforce Scope in Each New Chat**: Start each new chat with a reminder about scope limitations
4. **Reference Existing Patterns**: Point to specific files/patterns that should be followed
5. **Request Summaries Proactively**: Don't wait until you hit the limit
6. **Be Specific About Next Steps**: Include clear direction for the next chat
7. **Include Critical Context**: Technical decisions, approaches, and constraints
8. **Save Artifacts**: Copy summary artifacts to a local file for safekeeping
9. **Reference Related Files**: Include specific file paths in summaries
10. **Reinforce KISS & TDD Principles**: Always mention these in handoffs

## Responding to Scope Creep in New Chats

If a new chat begins implementing features outside the defined scope, respond with:

```
I notice you're adding [specific feature/enhancement] which is outside our defined scope boundaries. 
Please remove this addition and focus only on [specific in-scope task]. 
We specifically decided not to include [out-of-scope item] in this implementation.
```

## Related Documents
- [[claude-app-workflow|Claude App Workflow]]
- [[claude-app-prompt-templates|Prompt Templates]]
- [[claude-app-mcp-optimization|MCP Optimization Guide]]