# Example: Complete Workflow Execution for Issue #591

This document demonstrates how to use the subagent delegation system with TodoWrite tracking for a complete do-issue-auto workflow.

## Step 1: Initialize Workflow and Create Todos

```bash
# Start the enhanced workflow system
./scripts/do-issue-auto-with-agents.sh 591
```

This creates the initial workflow structure and generates the issue analysis task.

## Step 2: Execute in Claude Code

Run Claude Code and use these commands in sequence:

### 2.1 Create Master Todo Structure

```
Please use the TodoWrite tool to create the master workflow todos for issue #591:

[
  {"id": "branch-creation-analysis-591", "content": "Branch Creation & Issue Analysis", "status": "pending", "priority": "high"},
  {"id": "define-tests-591", "content": "Define Tests Phase", "status": "pending", "priority": "high"},
  {"id": "implementation-591", "content": "Implementation Phase", "status": "pending", "priority": "high"},
  {"id": "build-591", "content": "Build Phase", "status": "pending", "priority": "high"},
  {"id": "test-fixes-591", "content": "Test Fixes Phase", "status": "pending", "priority": "high"},
  {"id": "automated-verification-591", "content": "Automated Verification Phase", "status": "pending", "priority": "high"},
  {"id": "code-review-reusability-591", "content": "Code Review & Reusability Analysis", "status": "pending", "priority": "medium"},
  {"id": "cleanup-documentation-591", "content": "Cleanup & Documentation Phase", "status": "pending", "priority": "medium"},
  {"id": "github-issue-management-591", "content": "GitHub Issue Management", "status": "pending", "priority": "medium"}
]
```

### 2.2 Mark First Phase as In Progress and Delegate Issue Analysis

```
Please update the todo for "Branch Creation & Issue Analysis" to in_progress status, then use the Task tool to delegate to the Issue Analysis Specialist:

Description: Analyze GitHub issue and create technical specification
Prompt: You are an Issue Analysis Specialist subagent. Your task is to:

1. Fetch GitHub issue #591 from jerseycheese/narraitor repository using available GitHub tools
2. Analyze the issue description, comments, and acceptance criteria 
3. Create a comprehensive technical specification with:
   - Clear scope boundaries (what's included/excluded)
   - Technical approach and implementation plan
   - Identification of existing utilities to leverage
   - Test strategy focused on acceptance criteria
   - Success criteria checklist
4. Identify which domain this issue belongs to (World, Character, Inventory, Narrative, Journal)
5. Return the analysis in structured markdown format

IMPORTANT: Focus only on what's explicitly requested in the issue. Do not suggest additional features or enhancements outside the defined scope. Follow KISS principles and maintain existing patterns.

Please analyze issue #591 and return a complete technical specification.
```

### 2.3 After Issue Analysis Completes

Once the subagent returns with the technical specification:

```
Please mark the "Branch Creation & Issue Analysis" todo as completed and update "Define Tests Phase" to in_progress.

Then use the Task tool to delegate to the Test Writing Specialist:

Description: Create focused TDD tests for implementation
Prompt: You are a Test Writing Specialist subagent following strict TDD principles. Your task is to:

1. Based on the technical specification below, write focused tests that verify core functionality
2. Follow these guidelines:
   - Test WHAT not HOW (behavior over implementation)
   - Focus on acceptance criteria from the spec
   - Avoid testing style classes or implementation details
   - Create minimal test files targeting key functionality
   - Ensure tests are MVP-level and align with issue acceptance criteria
   - Skip trivial tests that don't add value to core functionality
3. Create test files that will fail initially (red phase of TDD)
4. Include Storybook story specifications following 'Narraitor/[Category]/[Component]' naming
5. Plan test harness scenarios for /dev/[component-name] testing

Technical Specification:
[Include the specification returned by the Issue Analysis subagent]

Please create focused test files and specifications that directly verify the acceptance criteria without testing implementation details.
```

### 2.4 Implementation Phase (Parallel Execution)

After test writing completes:

```
Please mark "Define Tests Phase" as completed and "Implementation Phase" as in_progress.

Now delegate to three parallel implementation specialists using the Task tool:

**UI Component Specialist:**
Description: Implement React components following project patterns
Prompt: You are a UI Component Implementation Specialist subagent. Your task is to:

1. Create React components following project patterns from the specification
2. Use existing shadcn/ui components where possible  
3. Maintain <300 lines per component following single responsibility principle
4. Follow established TypeScript patterns and domain boundaries
5. Create Storybook stories for all component variants and states
6. Ensure accessibility is built-in, not added later

[Include technical specification and test requirements]

**Business Logic Specialist:**
Description: Implement core functionality and state management
Prompt: You are a Business Logic Implementation Specialist subagent. Your task is to:

1. Implement core functionality to pass tests using existing patterns
2. Use existing utilities from the codebase where possible
3. Follow established Zustand store patterns for state management
4. Ensure proper error handling with recovery mechanisms
5. Maintain atomic and predictable state updates
6. Integrate with existing domain stores appropriately

[Include technical specification and test requirements]

**Integration Specialist:**
Description: Connect components with stores and services
Prompt: You are an Integration Specialist subagent. Your task is to:

1. Connect components with stores/services following project patterns
2. Ensure proper data flow between components and state management
3. Handle edge cases within the defined scope
4. Create test harness pages at /dev/[component-name] for interactive testing
5. Ensure integration with existing systems follows domain boundaries

[Include technical specification and test requirements]
```

### 2.5 Build and Test Fixes Phase

After implementation completes:

```
Please mark "Implementation Phase" as completed and "Build Phase" as in_progress.

Run the build command:
npm run build

If successful, mark "Build Phase" as completed and "Test Fixes Phase" as in_progress.

Run the tests:
npm test

Fix any test failures and mark "Test Fixes Phase" as completed when all tests pass.
```

### 2.6 Automated Verification Phase

```
Please mark "Automated Verification Phase" as in_progress and use the Task tool to delegate to the Verification Coordinator:

Description: Coordinate comprehensive automated testing
Prompt: You are a Verification Coordinator subagent responsible for comprehensive testing. Your task is to:

1. Coordinate BrowserMCP automated testing suite for issue #591
2. Run Three-Stage Verification process:
   - Stage 1: Storybook Testing (component isolation, visual verification, interactions)
   - Stage 2: Test Harness Verification (integration testing, realistic data, edge cases)  
   - Stage 3: System Integration (full application context, real data, cross-component interactions)
3. Use the existing ./scripts/browsermcp-verify.sh script with appropriate parameters
4. Analyze verification reports for critical issues requiring immediate attention
5. Generate comprehensive findings report with specific recommendations
6. Return verification status and prioritized list of any fixes needed

Run: ./scripts/browsermcp-verify.sh 591 full

Focus on identifying blocking issues that prevent the feature from meeting acceptance criteria.
```

### 2.7 Parallel Code Review and Documentation

After verification passes:

```
Please mark "Automated Verification Phase" as completed and start both "Code Review & Reusability Analysis" and "Cleanup & Documentation Phase" as in_progress.

Use the Task tool to delegate to both specialists in parallel:

**Code Review Specialist:**
Description: Analyze code for pattern compliance and optimization
Prompt: You are a Code Review Specialist subagent focused on pattern analysis and optimization. Your task is to:

1. Analyze implemented code for opportunities to use existing components/utilities
2. Check for type safety improvements and interface reuse opportunities
3. Identify performance optimization opportunities without over-engineering
4. Look for code patterns that could be extracted for reusability
5. Ensure adherence to project patterns and domain boundaries
6. Check file size compliance (<300 lines per component)
7. Verify error handling follows project standards

Return a prioritized list of improvements that enhance code quality while maintaining the existing scope.

**Documentation Specialist:**
Description: Create comprehensive technical documentation
Prompt: You are a Documentation Specialist subagent focused on comprehensive technical documentation. Your task is to:

1. Create API/Props/Parameters documentation for all new components
2. Write usage examples demonstrating key functionality from the implementation
3. Document integration points with existing systems
4. Cover error handling scenarios and edge cases
5. Follow project documentation standards from CLAUDE.md
6. Ensure documentation is concise and AI-readable (150 lines max per doc)

Return documentation files ready for commit that provide comprehensive guidance for using the implemented features.
```

### 2.8 Final GitHub Management

After both parallel phases complete:

```
Please mark both "Code Review & Reusability Analysis" and "Cleanup & Documentation Phase" as completed, then mark "GitHub Issue Management" as in_progress.

Create the feature branch, commit all changes, and create a PR:

1. Create branch: feature/issue-591-[brief-description]
2. Commit all changes with semantic commit messages
3. Create PR targeting develop branch with "Closes #591"
4. Include comprehensive verification report in PR description

Use existing helper scripts:
./scripts/claude-branch.sh
./scripts/claude-pr.sh 591

Mark "GitHub Issue Management" as completed when PR is created.
```

## Benefits Demonstrated

### Structured Progress Tracking
- Clear visibility into each workflow phase
- Granular todo tracking prevents missed steps
- Easy identification of current status and blockers

### Specialized Expertise
- Each subagent focuses on their area of expertise
- Consistent quality through specialized knowledge
- Faster execution through domain focus

### Parallel Execution
- Implementation specialists work concurrently
- Code review and documentation run in parallel
- Reduced total workflow time

### Quality Assurance
- Built-in verification at each phase
- Systematic approach prevents shortcuts
- Comprehensive testing before completion

### Scope Control
- Explicit scope boundaries prevent feature creep
- Focus on acceptance criteria only
- Adherence to KISS principles

This example shows how the subagent delegation system provides structure, quality, and efficiency while maintaining the high standards established in your do-issue-auto workflow.