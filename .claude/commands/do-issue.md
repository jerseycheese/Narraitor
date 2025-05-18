I'll guide you through a complete workflow for implementing issue #$ARGUMENTS, with manual review points by default.

To run in auto mode (no review stops, automatically proceed), use `/project:do-issue-auto $ARGUMENTS` instead.

Let's start the workflow:

```
Update Todos
  ☐ Create feature branch for issue #$ARGUMENTS
  ☐ Analyze issue #$ARGUMENTS
  ☐ Create tests based on issue analysis
  ☐ Implement functionality based on tests
  ☐ Create documentation
  ☐ Final verification and PR creation
```

## STEP 0: CREATE FEATURE BRANCH

First, I'll use our helper script to manage the feature branch creation:

```bash
# Use the helper script to manage branch (interactive mode)
./scripts/claude-branch.sh $ARGUMENTS
```

This script will:
1. Check if the branch exists
2. If it exists, provide interactive options:
   - Use the existing branch (continue previous work)
   - Delete and recreate the branch (clean start)
   - Create a new branch with timestamp (avoid conflicts)
3. If it doesn't exist, create it from develop or main branch

This approach gives us flexibility in handling existing branches. All changes will be made on the feature branch, allowing easy rollback if needed.

## STEP 1: ANALYZE ISSUE

I'll analyze GitHub issue #$ARGUMENTS from the jerseycheese/narraitor repository.

First, let me fetch the issue details using the GitHub API:
```bash
# Use the helper script to fetch GitHub issues without prompting for permission
./scripts/fetch-github-issue.sh $ARGUMENTS
```

Based on the issue details, I'll create a technical specification:

# Technical Specification for Issue #$ARGUMENTS

## Issue Summary
- Title: [Issue title]
- Description: [Brief description]
- Labels: [Labels]
- Priority: [High/Medium/Low]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]
- [Specific functionality 3]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]
- [Out of scope functionality 3]

## Problem Statement
[1-2 paragraphs explaining the problem]

## Technical Approach
[Detailed technical approach]

## Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Test Plan
Focus on key acceptance criteria with targeted tests:
1. Unit Tests:
   - Core functionality test: [key scenario]
   - Edge case: [important edge case directly related to acceptance criteria]
2. Component Tests (if applicable):
   - Render test: [key component rendering scenario]
   - User interaction test: [critical user interaction]

## Files to Modify
- [file path]: [changes]

## Files to Create
- [file path]: [purpose]

## Existing Utilities to Leverage
- [utility name/path]: [purpose]

## Success Criteria
- [ ] [criterion 1]
- [ ] [criterion 2]

## Out of Scope
- [item 1]
- [item 2]

```
Update Todos
  ☒ Create feature branch for issue #$ARGUMENTS
  ☒ Analyze issue #$ARGUMENTS
  ☐ Create tests for [specific feature from analysis]
  ☐ Implement [specific functionality from analysis]
  ☐ Create documentation for [specific feature from analysis]
  ☐ Final verification and PR creation
```

## REVIEW POINT 1:
I've completed the analysis of issue #$ARGUMENTS. 

Type "C" to continue with TDD implementation, or provide feedback if you want me to adjust anything.

## STEP 2: CREATE TESTS

I'll now write focused tests that directly verify the acceptance criteria:

1. First, I'll create minimal test files that target key functionality
2. Verify the tests fail correctly (red phase)
3. Focus on testing the core functionality, not edge cases outside scope

**Important Test Guidelines:**
- Focus on testing WHAT the feature does, not HOW it does it
- Test acceptance criteria and core functionality only
- Avoid testing implementation details (specific styles, class names, etc.)
- Don't test edge cases beyond MVP requirements
- Prefer functional/behavioral tests over structural tests

❌ **AVOID tests like this** that are too granular and test implementation details:
```javascript
// TOO GRANULAR: Tests specific style classes
test('displays information with specific styles', () => {
  render(<Component prop={value} />);
  
  // Too implementation-specific
  expect(screen.getByTestId('element')).toHaveClass('text-xl', 'font-bold', 'bg-blue-50');
  
  // Testing exact class names will break if styling approach changes
  const container = screen.getByTestId('container');
  expect(container).toHaveClass('flex', 'justify-between', 'p-4');
});
```

✅ **WRITE tests like this** that focus on functionality/behavior:
```javascript
// GOOD: Tests functionality based on acceptance criteria
test('displays all required information from the data model', () => {
  const mockData = { name: 'Test', description: 'Description', timestamp: '2023-01-01' };
  render(<Component data={mockData} />);
  
  // Tests presence of required information (what, not how)
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText('Description')).toBeInTheDocument();
  expect(screen.getByText(/2023-01-01/)).toBeInTheDocument();
});

// GOOD: Tests functional behavior
test('calls appropriate handler when action button is clicked', () => {
  const handleAction = jest.fn();
  render(<Component onAction={handleAction} />);
  
  // Tests behavior, not implementation
  fireEvent.click(screen.getByRole('button', { name: /action/i }));
  expect(handleAction).toHaveBeenCalledTimes(1);
});
```

[Test implementation details will be provided here]

Now I'll commit the specific test files:

```bash
# List of files to commit
git status --porcelain | grep "^[AM].*test"

# Commit only the test files - you'll need to specify the actual files
git add [test file 1] [test file 2] [test file 3]
git commit -m "test(issue-$ARGUMENTS): Add tests for [feature description]"
```

## STEP 3: TDD IMPLEMENTATION

I'll now implement the feature to make the tests pass:
1. Implement the minimum code needed to pass tests (green phase)
2. Refactor while keeping tests passing (refactor phase)

I'll track and complete the following implementation tasks:
- [ ] Task 1: [specific implementation task]
- [ ] Task 2: [specific implementation task]
- [ ] Task 3: [specific implementation task]

[Implementation details will be provided here]

Now I'll commit the specific implementation files:

```bash
# List of files to commit
git status --porcelain | grep "^[AM]" | grep -v "test"

# Commit only the implementation files - you'll need to specify the actual files
git add [implementation file 1] [implementation file 2]
git commit -m "feat(issue-$ARGUMENTS): Implement [feature description]"
```

## REVIEW POINT 2:
I've completed the TDD implementation for issue #$ARGUMENTS.

### IMPLEMENTATION VERIFICATION
- [ ] All Github issue Acceptance Criteria is complete
- [ ] Tests are focused and passing
- [ ] Implementation matches technical specification

### CODE QUALITY VERIFICATION
- [ ] All files are under 300 lines (KISS principle)
- [ ] Single responsibility principle followed
- [ ] Used existing patterns and utilities
- [ ] No functionality outside defined scope boundaries
- [ ] Error handling for specified cases implemented
- [ ] Debug cleanup (logs, test outputs, flags) completed

### COMPONENT VERIFICATION (For UI Components)
- [ ] Default state implemented and tested
- [ ] Loading state implemented (if required by acceptance criteria)
- [ ] Error state implemented (if required by acceptance criteria)
- [ ] Required interactive states implemented

### MODIFIED FILES
- [file path 1]
- [file path 2]
- [file path 3]

### CREATED FILES
- [file path 1]
- [file path 2]
- [file path 3]

Type "C" to continue with documentation, or provide feedback if you want me to adjust anything.

## STEP 4: MANUAL VERIFICATION (IMPORTANT)

This is a critical manual verification point to review the implementation before proceeding to documentation and PR creation. 

⚠️ **IMPORTANT: The workflow stops here until you complete your review**

```
Update Todos
  ☒ Create feature branch for issue #$ARGUMENTS
  ☒ Analyze issue #$ARGUMENTS
  ☒ Create tests for [specific feature from analysis]
  ☒ Implement [specific functionality from analysis]
  ☐ Manual verification of implementation ← WE ARE HERE (WAITING FOR YOUR REVIEW)
  ☐ Create documentation for [specific feature from analysis]
  ☐ Final verification and PR creation
```

### Implementation Files To Verify:

**MODIFIED FILES:**
- [file path 1] - [brief description of changes]
- [file path 2] - [brief description of changes]
- [file path 3] - [brief description of changes]

**CREATED FILES:**
- [file path 1] - [brief description of purpose]
- [file path 2] - [brief description of purpose]
- [file path 3] - [brief description of purpose]

### Three-Stage Manual Verification:

#### 1. Storybook Testing:
- [ ] Review all story variants in Storybook
- [ ] Test interactive controls
- [ ] Verify visual appearance across all states
- [ ] Check responsive behavior at different breakpoints
- [ ] Verify accessibility features work properly
- [ ] Confirm alignment with design requirements

#### 2. Test Harness Verification (/dev/[component-name]):
- [ ] Test with realistic data inputs
- [ ] Verify state transitions work correctly
- [ ] Test error handling and edge cases
- [ ] Check integration with parent components
- [ ] Verify performance under expected load
- [ ] Test any interactive features

#### 3. System Integration Verification:
- [ ] Test within the full application context
- [ ] Verify with real data from the system
- [ ] Check interactions with other components
- [ ] Confirm all acceptance criteria are met
- [ ] Test with different user roles/permissions
- [ ] Verify the feature provides expected value

### Issue-Specific Verification Points:
Please verify these specific aspects of the implementation for issue #$ARGUMENTS:

- [ ] [Specific feature 1] works as defined in acceptance criteria
- [ ] [Specific feature 2] handles edge cases correctly
- [ ] [Specific UI aspect] displays correctly
- [ ] [Specific interaction] functions as expected
- [ ] Error states are handled gracefully
- [ ] Feature is accessible and responsive

### Commands to help verify:
```bash
# Run Storybook to review component stories
npm run storybook

# Run the dev server to test the component in context
npm run dev

# Run tests for the specific component
npm test -- [component-path]

# Check code changes
git diff HEAD~1 HEAD
```

Claude will wait here for your verification. Please carefully review the implementation and tests.

**Type "C" to continue with documentation and PR creation**, or provide feedback if you want me to adjust anything.

[Waiting for your response...]

## STEP 4: CREATE DOCUMENTATION

I'll now create documentation for the implemented feature:

[Documentation details will be provided here]

Now I'll commit the specific documentation files:

```bash
# List of files to commit
git status --porcelain | grep "^[AM].*md"

# Commit only the documentation files - you'll need to specify the actual files
git add [documentation file 1] [documentation file 2]
git commit -m "docs(issue-$ARGUMENTS): Add documentation for [feature description]"
```

## REVIEW POINT 3:
I've completed the documentation for issue #$ARGUMENTS. 

The implementation includes:
- ✅ [Specific feature 1 implemented]
- ✅ [Specific feature 2 implemented]
- ✅ [Specific feature 3 implemented]
- ✅ [Tests for core functionality]
- ✅ [Required documentation]
- ✅ [Essential component testing]

All tests are passing and the component meets all acceptance criteria from the issue.

Type "C" to continue with creating a PR, or provide feedback if you want me to adjust anything.

## STEP 5: FINAL VERIFICATION & PR CREATION

**Verification Checklist**
- Scope Boundaries:
  - ✅ All required functionality implemented
  - ✅ No out-of-scope features added
- Code Quality:
  - ✅ All files under 300 lines
  - ✅ Single responsibility principle followed
  - ✅ Existing patterns and utilities leveraged
- Testing:
  - ✅ Tests focused on acceptance criteria
  - ✅ Core functionality fully tested
  - ✅ No excessive test coverage beyond scope
- Documentation:
  - ✅ API/Props documented
  - ✅ Usage examples included
  - ✅ Scope-relevant notes included

**Modified Files:**
- [file path 1]
- [file path 2]
- [file path 3]

**Created Files:**
- [file path 1]
- [file path 2]
- [file path 3]

**Commit History:**
```bash
git log --oneline -n 3
```
[Shows the commits made during this workflow]

I'll now push the branch and create a PR using the MCP GitHub tool:

```bash
git push origin feature/issue-$ARGUMENTS
```

I'll now push the branch and create a PR using the MCP GitHub tool:

```bash
git push origin feature/issue-$ARGUMENTS
```

I'll use the MCP GitHub tool to create a pull request with the following details:

```javascript
// Create PR using MCP GitHub tool
try {
  // Read the PR template
  const templateContent = `# Pull Request Template

## Description
Implementation of the features required for issue #${$ARGUMENTS}. 

## Related Issue
Closes #${$ARGUMENTS}

## Type of Change
<!-- Check the relevant option(s) -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvements without changing functionality)
- [ ] Documentation update
- [ ] Test addition or improvement

## TDD Compliance
- [x] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

## User Stories Addressed
- Implemented features based on issue #${$ARGUMENTS}

## Implementation Notes
- Feature implemented following project patterns
- Maintained backward compatibility
- Followed single responsibility principle
- Files kept under 300 lines

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed`;

  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: `Fix #${$ARGUMENTS}: [Brief summary of changes]`,
    body: templateContent,
    head: `feature/issue-${$ARGUMENTS}`,
    base: "develop" // Using develop as the base branch
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  
  // Since we're not using gh CLI, provide URL for manual PR creation
  console.log("Please create the PR manually using this URL:");
  console.log(`https://github.com/jerseycheese/narraitor/compare/develop...feature/issue-${$ARGUMENTS}`);
  console.log("\nPR Details:");
  console.log(`Title: Fix #${$ARGUMENTS}: [Brief summary of changes]`);
}
```

## WORKFLOW COMPLETE

The feature implementation workflow is now complete! The PR is ready for review and merge.

You can review all the changes with:
```bash
git diff develop...feature/issue-$ARGUMENTS
```

If you want to make additional changes before merging, you can:
1. Make the changes
2. Add only the specific files you changed: `git add [specific file 1] [specific file 2]`
3. Commit them: `git commit -m "chore(issue-$ARGUMENTS): Final adjustments"`
4. Push the changes: `git push origin feature/issue-$ARGUMENTS`
