---
title: Claude App Prompt Templates (Updated)
aliases: [App Prompts, Claude Prompt Library, Updated Prompt Templates]
tags: [development, workflow, claude, prompt, templates]
created: 2025-04-28
updated: 2025-05-14
---

# Claude App Prompt Templates (Updated)

> [!note]
> Optimized prompt templates for using Claude through the app interface with MCP tools, designed to strictly control scope. These templates are designed for easy single-click copying from Obsidian.

## Table of Contents
- [How to Use These Templates](#how-to-use-these-templates)
- [Analysis & Planning Phase](#analysis--planning-phase)
- [Define Tests Phase](#define-tests-phase)
- [Implementation Phase](#implementation-phase)
- [Build Phase](#build-phase)
- [Test Fixes Phase](#test-fixes-phase)
- [Manual Testing](#manual-testing)
- [Cleanup & Documentation Phase](#cleanup--documentation-phase)
- [Component Refactoring](#component-refactoring)
- [Bug Fix Request](#bug-fix-request)
- [Feature-Specific Implementation](#feature-specific-implementation)
- [IDE-Based Build & Test Request](#ide-based-build--test-request-clineroo)
- [Storybook Integration](#storybook-integration)
- [GitHub Issue Management](#github-issue-management)
- [Related Documents](#related-documents)

## How to Use These Templates

Each template is contained in a single code block that you can copy with a single click in Obsidian. Simply:
1. Click anywhere inside the code block
2. Use the copy button that appears in the top right corner
3. Paste directly into Claude.ai or your IDE's Cline/Roo extension

## Analysis & Planning Phase

```
# Project Analysis Request

## Context
I'm working on the Narraitor project, a Next.js/React application for a narrative-driven RPG framework using AI.

## Request
Help me select and analyze the next task to implement, following KISS principles.

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Use @modelcontextprotocol/server-github and 
	1. review the Github project at https://github.com/users/jerseycheese/projects/3
	2. review open issues at https://github.com/jerseycheese/narraitor/issues
2. Review the roadmap at `/Users/jackhaas/Projects/narraitor/docs/development-roadmap.md`
3. Check project documentation in `/Users/jackhaas/Projects/narraitor/docs`
4. Check project structure at `/Users/jackhaas/Projects/narraitor/src`
5. Review existing utilities and helpers in `/Users/jackhaas/Projects/narraitor/src/lib`
6. Review our Storybook workflow for component development at `/Users/jackhaas/Projects/narraitor/docs/development/workflows/storybook-workflow.md`

## Scope Constraints
- Focus only on the current issue without adding enhancements
- Do not propose architectural changes unless explicitly requested
- Maintain existing patterns and approaches
- Don't suggest additional libraries or dependencies
- Follow KISS principles (max 300 lines per file, single responsibility, etc.)

## Analysis Goals
Based on this information, please:
1. Identify the highest priority tasks
	1. Don't limit yourself to looking at the first page of open issues in my issue queue.
	2. Review the Github project's Backlog and any epic issues in progress
2. Assess implementation complexity and dependencies
3. Evaluate value to effort ratios
4. Check alignment with roadmap goals
5. Create a technical specification for implementation
6. Provide a clear, step-by-step plan following TDD principles
7. Identify existing utilities/helpers that can be leveraged
8. Plan the Three-Stage Component Testing approach (Storybook → Test Harness → Integration)

## Output Format
Please present your analysis as a markdown artifact with this structure:

TASK ANALYSIS
GitHub Issue: #[number] [title]
Labels: [labels]
Description: [1-2 sentences]
Priority: [High/Medium/Low] ([reasoning])
Current State: [1-2 sentences]

TECHNICAL DESIGN
Data Flow:
- [flow point 1]
- [flow point 2]

Core Changes:
1. [Change Area 1]
   - Location: [file]
   - Details: [specifics]
   
2. [Change Area 2]
   - Location: [file]
   - Details: [specifics]

INTERFACES
[Interface definitions]

IMPLEMENTATION STEPS
1. [ ] Define test cases (TDD approach)
2. [ ] Create Storybook stories (following our workflow guide)
3. [ ] Implement minimum code to pass tests
4. [ ] Create test harness pages (/dev/[component-name])
5. [ ] Integration testing
6. [ ] [Additional steps]

Existing Utilities to Leverage:
- [utility/helper path]: [purpose and usage]

Files to Modify:
- [path]: [changes]
Files to Create:
- [path]: [purpose]

TEST PLAN
1. Unit Tests:
   - [test scenario]
2. Storybook Stories:
   - [story variants]
3. Test Harness:
   - [interactive testing scenarios]
4. Integration Tests:
   - [test scenario]

SUCCESS CRITERIA
- [ ] [criterion]
- [ ] [criterion]
- [ ] Stories follow 'Narraitor/[Category]/[Component]' naming

TECHNICAL NOTES
- [technical detail]
- [technical detail]

OUT OF SCOPE
- [feature/enhancement to exclude]
- [pattern/approach to avoid]

FUTURE TASKS
- [ ] [future task]
- [ ] [future task]
```

## Define Tests Phase

```
# Test Definition Request

## Context
I'm implementing this technical spec:

[PASTE SPEC ARTIFACT HERE]

## Request
Help me define the MVP tests for this feature before implementation, following strict TDD principles and the Three-Stage Component Testing approach.

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Review existing test patterns at `/Users/jackhaas/Projects/narraitor/tests`
2. Check component test examples at `/Users/jackhaas/Projects/narraitor/docs/technical-guides/component-testing.md`
3. Review existing utilities and helpers in `/Users/jackhaas/Projects/narraitor/src/lib` and test utilities
4. Follow the Storybook workflow at `/Users/jackhaas/Projects/narraitor/docs/development/workflows/storybook-workflow.md`

## Test Requirements
1. Write tests before implementation (TDD approach)
2. Only test what's in scope (as defined in the spec)
3. Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`
4. Use data-testid attributes for element selection
5. Keep tests focused and minimal (KISS approach)
6. Plan for Three-Stage Component Testing:
   - Stage 1: Storybook isolation
   - Stage 2: Test harness integration
   - Stage 3: System integration

## Output Format
Please provide:
1. A test specification artifact with:
   - Test file structure
   - Test cases covering functionality
   - Clear data-testid names following our convention
   - Storybook story definitions (following 'Narraitor/[Category]/[Component]' naming)
   - Test harness plan (/dev/[component-name])
2. An explanation of your testing approach
3. A verification list of what is covered and what is not

Please only test what's explicitly in the spec - don't test edge cases or features outside the defined scope.

Use write_file to create the tests before you're done.
```

## Implementation Phase

```
# Implementation Request

## Context
I'm implementing this technical specification:

[PASTE SPEC ARTIFACT HERE]

And I've defined these tests:

[PASTE TEST ARTIFACT HERE]

## Request
Help me implement this MVP specification to make the tests pass, following KISS principles and leveraging existing utilities.

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Review related files at [specific paths]
2. Check our existing patterns for similar components
3. Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`
4. Review and leverage existing utilities and helpers in `/Users/jackhaas/Projects/narraitor/src/lib`
5. Follow the Storybook workflow at `/Users/jackhaas/Projects/narraitor/docs/development/workflows/storybook-workflow.md`

## Scope Constraints
- Implement ONLY what's specified in the technical spec
- Do not add extra features, optimizations, or "nice-to-haves"
- Follow existing patterns exactly, even if you see potential improvements
- Use only the libraries and dependencies already in use
- Do not introduce additional state management approaches
- Keep files under 300 lines (KISS principle)
- Use single responsibility for functions and components

## Implementation Approach
1. Test-driven development (make the defined tests pass)
2. Incremental implementation
3. Clean code principles
4. Error handling for specified cases only
5. Stay within the defined scope boundaries
6. For UI components:
   - Implement alongside Storybook stories
   - Follow the Three-Stage Component Testing approach
   - Create test harness pages (/dev/[component-name])
7. Leverage existing utilities rather than creating new ones
8. Maintain simple, readable code over clever optimizations

## Output Format
Please provide implementation in this format:

IMPLEMENTATION PROGRESS
Component: [name]
Current Step: [step number/name]

CURRENT IMPLEMENTATION
File: [current file]
Status: [In Progress/Complete]

Used Utilities/Helpers:
- [path to utility/helper]: [how it was used]

CODE CHANGES
[Actual code changes]

STORYBOOK STORIES (for UI components)
[Storybook story code following 'Narraitor/[Category]/[Component]' naming]

TEST HARNESS PLAN
Path: /dev/[component-name]
Interactive features:
- [feature 1]
- [feature 2]
```

## Manual Testing

```
# Manual Testing Request

## Context
I've implemented this feature and all automated tests are now passing:

[PASTE COMPONENT SUMMARY]

## Request
Help me plan manual testing steps to verify this implementation works as expected in real usage, given the current state of the codebase.

## Scope Boundaries
- Only test functionality within the defined scope
- Focus on user experience and edge cases automated tests might miss
- Do not suggest testing features outside the implemented scope

## Three-Stage Manual Testing
1. **Storybook Testing**:
   - Review all story variants
   - Test interactive controls
   - Verify visual appearance

2. **Test Harness Testing** (/dev/[component-name]):
   - Test with more realistic data
   - Verify state transitions
   - Check edge cases interactively

3. **System Integration Testing**:
   - Test within the full application
   - Verify with real data
   - Check parent component interactions

## Output Format
Please provide a testing plan including:
1. Storybook scenarios to verify
2. Test harness interactions to check
3. Integration points to validate
4. User scenarios to test
5. Edge cases to verify
6. Visual/UX aspects to check
7. Potential issues to watch for

These steps will help ensure the implementation works correctly in the real application environment.
```

## Cleanup & Documentation Phase

```
# Cleanup & Documentation Request

## Context
I've implemented this feature:

[PASTE IMPLEMENTATION SUMMARY]

## Request
Help me review, clean up, and document this implementation.

[PASTE LIST OF CHANGED FILES]

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Scope Boundaries
- Focus only on the implemented code
- Do not suggest refactoring or restructuring
- Do not propose new features or enhancements
- Keep documentation aligned with actual implementation
- Do not modify existing documentation patterns

## Information Access
Please use MCP to:
1. Review the implemented files and any related Github issue(s)
2. Check for cleanup opportunities
3. Check for overly large files (>400 lines) that should be refactored into smaller files
4. Review existing documentation structure in `/Users/jackhaas/Projects/narraitor/docs`
5. Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`
6. Verify adherence to Storybook workflow guide
7. Check test harness implementation if applicable

## Output Format
Please provide a response with these sections:

CLEANUP & DOCS
GitHub Issue: #[number] [title]

COMPLETENESS
- [ ] Github issue Acceptance Criteria is all complete and verified
- [ ] Three-Stage Component Testing completed (Storybook → Test Harness → Integration)

CODE REVIEW
Quality:
- [ ] Code standards & style
- [ ] Error handling
- [ ] Performance considerations
- [ ] Security concerns
- [ ] Debug cleanup (logs, test outputs, flags)

Documentation:
- [ ] Code comments
- [ ] README updates
- [ ] API documentation
- [ ] Architecture changes
- [ ] System documentation
- [ ] Storybook stories documented

TEST COVERAGE
- Unit Tests: [coverage]
- Storybook Stories: [coverage]
- Test Harness: [status]
- Integration Tests: [coverage]
- Edge Cases: [list]
- Missing Coverage: [areas]

GITHUB UPDATES https://github.com/jerseycheese/Narraitor
Issues to Close:
- [ ] #[number]: [completion notes]

Issues to Create:
- [ ] Title: [new issue title]
  Labels: [labels]
  Description: [details]

Commit Message:

[type](scope): Brief description

- Change detail 1
- Change detail 2

Issue: #[number]
```

## Component Refactoring

```
# Component Refactoring Request

## Context
I need to refactor this component:

[PASTE COMPONENT CODE OR PATH]

## Target File
Path: [file path]
Target Size: < 300 lines

## Scope Boundaries
- Maintain exact functionality
- Do not add features or enhancements
- Keep the same state management approach
- Do not introduce new patterns
- Focus only on reorganizing code, not improving it

## Size Reduction Strategy
Priority approaches:
1. [ ] Extract standalone components
2. [ ] Split by feature/responsibility
3. [ ] Move types to separate files
4. [ ] Relocate utility functions

## Refactoring Goals
Priority order:
1. [ ] Component extraction
2. [ ] Type safety maintenance
3. [ ] File organization
4. [ ] Test coverage preservation
5. [ ] Storybook stories maintenance

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP to:
1. Analyze the current component
2. Review our coding standards
3. Check similar components for patterns
4. Use existing utils and helpers in `/Users/jackhaas/Projects/narraitor/tests` or `/Users/jackhaas/Projects/narraitor/src/utils`
5. Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`
6. Maintain Storybook structure per our workflow guide

## Requirements
### Must Have
- No behavioral changes
- Maintain existing functionality
- Each new file under 300 lines
- Clear component boundaries
- Type safety
- Existing test coverage
- Storybook stories continue working

## Risk Assessment
### Safe to Split Out
- Standalone UI components
- Type definitions
- Utility functions
- Constants and configs
- Test files

### Handle with Care
- Shared state logic
- Event handler chains
- Complex data transformations
- API integration points

## Output Format
Please provide:
1. Analysis of current issues
2. Refactored component as an artifact
3. Any necessary test updates
4. Updated Storybook stories if needed
5. Before/after comparison highlighting organization improvements
```

## Bug Fix Request

```
# Bug Fix Request

## Context
I'm experiencing this bug:

[DESCRIBE BUG WITH STEPS TO REPRODUCE]

## Request
Help me diagnose and fix this specific issue only.

## Scope Boundaries
- Fix only the described bug
- Do not add features or enhancements
- Do not refactor surrounding code
- Do not modify unrelated functionality
- Focus only on the minimum changes needed

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP to:
1. Examine related components at [paths]
2. Check test coverage
3. Review error handling
4. Check project documentation in `/Users/jackhaas/Projects/narraitor/docs`
5. Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`
6. Use existing utils and helpers in `/Users/jackhaas/Projects/narraitor/tests` or `/Users/jackhaas/Projects/narraitor/src/utils`
7. Check Storybook stories for the component

## Output Format
Please provide:
1. Root cause analysis
2. Minimal fix implementation as an artifact
3. Test updates to prevent regression
4. Storybook story updates if needed
5. Verification steps specific to this bug
```

## Feature-Specific Implementation

```
# Feature-Specific Implementation Request

## Context
I need to implement this specific feature:

[DESCRIBE FEATURE]

## Specific Requirements
1. [requirement 1]
2. [requirement 2]
3. [requirement 3]

## Technical Boundaries
- Files to modify: [specific files only]
- State management approach: [specific approach]
- UI patterns to follow: [specific patterns]
- Dependencies allowed: [specific dependencies]

## Explicitly Out of Scope
- [functionality to exclude]
- [enhancement to avoid]
- [pattern not to introduce]
- [optimization not to implement]

## Implementation Constraints
- Must match existing code style exactly
- Must use only specified dependencies
- Must only modify listed files
- Must implement exactly what's specified, no more
- Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`
- Follow the Three-Stage Component Testing approach for UI components

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP to:
1. Examine the files to be modified
2. Review similar implementations
3. Check existing patterns
4. Use existing utils and helpers in `/Users/jackhaas/Projects/narraitor/tests` or `/Users/jackhaas/Projects/narraitor/src/utils`
5. Follow Storybook workflow guide for UI components

## Output Format
Please provide:
1. Implementation code that strictly adheres to requirements
2. Test code for specified functionality only
3. Storybook stories for UI components
4. Test harness plan if applicable
5. Verification that implementation meets all constraints
```

## IDE-Based Build & Test Request (Cline/Roo)

```
# IDE-Based Build & Test Request

## Context
I'm implementing this feature via Cline/Roo in my IDE to conserve Claude.ai usage:

[PASTE IMPLEMENTATION SUMMARY]

## Request
Help me efficiently fix build issues and test failures via the IDE.

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Process
1. First fix any build errors until the code compiles
2. Then address test failures one by one
3. Loop through build and test phases until both are successful
4. Verify Storybook stories compile and display correctly

## Scope Boundaries
- Fix only issues that prevent building or passing tests
- Do not add features or enhancements
- Do not refactor unrelated code
- Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`

## IDE Efficiency Tips
- I'll use the auto-approve option to speed up iteration
- Focus on one issue at a time
- Provide clear, concise explanations for changes
- Let me know when we should switch from build fixes to test fixes

## Output Format
Please start with:
1. A quick analysis of the implementation
2. A plan to address build issues first
3. Specific changes to fix each issue
4. A clear indication when we're transitioning to test fixes
5. Verification steps for Storybook stories
```

## Storybook Integration

```
# Storybook Integration Request

## Context
I've implemented this UI component:

[PASTE COMPONENT CODE]

## Request
Help me create comprehensive Storybook stories for this component following our component-driven development approach and Three-Stage Component Testing.

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Review existing Storybook stories at `/Users/jackhaas/Projects/narraitor/src/stories`
2. Check our Storybook workflow documentation at `/Users/jackhaas/Projects/narraitor/docs/development/workflows/storybook-workflow.md`
3. Follow our naming conventions in `/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md`

## Storybook Requirements
1. Create stories for all component variants and states
2. Include documentation on component props
3. Demonstrate all interactive behaviors
4. Show loading, error, and empty states
5. Follow KISS principles in story implementation
6. Use ArgTypes for interactive controls
7. Organize within the correct category using 'Narraitor/[Category]/[Component]' naming
8. Plan for Three-Stage Component Testing implementation

## Test Harness Planning
After Storybook stories, plan a test harness at /dev/[component-name] for Stage 2 testing

## Output Format
Please provide:

STORYBOOK STORIES
File: [component].stories.tsx
Category: Narraitor/[Category]/[Component]
[Complete Storybook stories code]

DOCUMENTATION
[JSDoc or prop table code]

TEST HARNESS PLAN
Path: /dev/[component-name]
Features to test:
- [Interactive feature 1]
- [State transition 1]
- [Edge case 1]

COMPONENT VARIANTS COVERED
- [ ] Default state
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Interactive states
- [ ] Additional variants: [list]

TESTING INTEGRATION NOTES
[Notes on how these stories relate to component tests and the Three-Stage approach]
```

## GitHub Issue Management

```
# GitHub Issue Wrapup Request

## Context
I've completed this feature:

[PASTE IMPLEMENTATION SUMMARY]

## Request
Help me prepare GitHub issue/epic updates/creation/closures using your Github MCP tools.
* Use strikeouts when updating/editing existing text
* Check checkboxes that should be checked now (eg. Acceptance Criteria)
* All other commentary should be in issue comments
* Search for whether an issue already exists before creating a new one; combine new issues into existing, related tickets if it makes sense to
* Use the templates in /Users/jackhaas/Projects/narraitor/.github/ISSUE_TEMPLATE

## Scope Focus
- Focus only on what was actually implemented
- Do not suggest enhancements outside the original scope
- Keep issue comments focused on completed work
- Mention completion of Three-Stage Component Testing if applicable

## Preferred MCP Tools

When using these prompt templates, the AI is encouraged to leverage the following MCP tools:

- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP to:
1. Review the original issue at [issue URL]
2. Check related issues
3. Review project conventions for commits

## Output Format
Please provide:

GITHUB ISSUE UPDATE
Issue #[number]
Status Update:

Feature completed with the following changes:
- [change 1]
- [change 2]
- [change 3]

Three-Stage Component Testing completed:
- [ ] Storybook stories created
- [ ] Test harness implemented
- [ ] Integration tested

All tests are passing and the feature has been manually verified.

ISSUES HANDLED
1. Title: [issue title]
   Description: [brief description]
   Labels: [labels]
   
2. Title: [issue title]
   Description: [brief description]
   Labels: [labels]
```

## Related Documents
- [[claude-app-workflow|Claude App Workflow]]
- [[claude-app-workflow-handoffs|Claude App Workflow Handoffs]]
- [[claude-app-mcp-optimization|Claude App MCP Tool Optimization]]
- [[claude-dev-workflow|Claude Dev Terminal Workflow]]
- [[tdd-workflow|Test-Driven Development Workflow]]
- [[storybook-workflow|Storybook Workflow & Component-Driven Development]]