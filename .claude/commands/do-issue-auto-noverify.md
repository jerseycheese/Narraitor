# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL

# This version is specifically designed for continuous batch processing
# by removing the manual verification step that exists in do-issue-auto

I'll implement issue #$ARGUMENTS entirely automatically, proceeding through all steps without stopping for review or approval prompts.

Let's start by creating a feature branch and defining clear scope boundaries to prevent scope creep.

```
Update Todos
  ☐ Branch Creation & Issue Analysis
  ☐ Define Tests Phase
  ☐ Implementation Phase
  ☐ Build Phase
  ☐ Test Fixes Phase
  ☐ Automated Testing
  ☐ Cleanup & Documentation Phase
  ☐ GitHub Issue Management
```

## STEP 1: BRANCH CREATION & ISSUE ANALYSIS

First, I'll use our helper script to handle the feature branch creation:

```bash
# Use the helper script to manage branch (auto mode)
./scripts/claude-branch.sh $ARGUMENTS auto
```

This script will automatically:
1. Check if the branch exists
2. If it exists, delete and recreate it for a clean start
3. If it doesn't exist, create it from develop or main branch

All changes will be made on this feature branch, allowing easy rollback if needed.

Next, I'll analyze GitHub issue #$ARGUMENTS from the jerseycheese/narraitor repository.

First, let me fetch the issue details using the MCP GitHub tool:
```javascript
// Fetch GitHub issue using MCP GitHub tool (no permission prompts)
try {
  const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
    owner: "jerseycheese",
    repo: "narraitor",
    issueNumber: parseInt($ARGUMENTS)
  });
  
  console.log(`Successfully fetched issue #${issue.number}: ${issue.title}`);
  
  // Continue with issue analysis using the fetched data
} catch (error) {
  // Fall back to helper script if MCP tool fails
  console.log("Falling back to helper script:");
  console.log("./scripts/fetch-github-issue.sh $ARGUMENTS");
}
```

Based on the issue details, I'll create a technical specification with explicit scope boundaries:

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
  ☒ Branch Creation & Issue Analysis
  ☐ Define Tests Phase
  ☐ Implementation Phase
  ☐ Build Phase
  ☐ Test Fixes Phase
  ☐ Automated Testing
  ☐ Cleanup & Documentation Phase
  ☐ GitHub Issue Management
```

## STEP 2: DEFINE TESTS PHASE

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

After creating the tests, I'll commit the specific test files:

```bash
# List of files to commit
git status --porcelain | grep "^[AM].*test"

# Commit only the test files
git add [test file 1] [test file 2] [test file 3]
git commit -m "test(issue-$ARGUMENTS): Add tests for [feature description]"
```

## STEP 3: IMPLEMENTATION PHASE

I'll implement the feature using Test-Driven Development, strictly adhering to the defined scope boundaries:

1. Implement the minimum code needed to pass tests (green phase)
2. Refactor while keeping tests passing (refactor phase)
3. Maintain component size under 300 lines
4. Follow single responsibility principle
5. Use existing patterns and utilities from the codebase

I'll track progress on a checklist to ensure all required functionality is implemented while avoiding scope creep:

- [ ] Implement [functionality 1]
- [ ] Implement [functionality 2]
- [ ] Implement [functionality 3]

After implementing the feature, I'll commit the specific implementation files:

```bash
# List of files to commit
git status --porcelain | grep "^[AM]" | grep -v "test"

# Commit only the implementation files
git add [implementation file 1] [implementation file 2]
git commit -m "feat(issue-$ARGUMENTS): Implement [feature description]"
```

## STEP 4: BUILD PHASE

I'll now verify the build success for the implementation:

```bash
# Run build to check for any TypeScript errors or warnings
npm run build
```

I'll address any build issues that arise:

- [ ] Fix TypeScript errors
- [ ] Resolve import/export issues
- [ ] Address any warnings

After fixing any build issues, I'll commit them:

```bash
# Commit build fixes if needed
git add [build fix files]
git commit -m "fix(issue-$ARGUMENTS): Fix build issues"
```

## STEP 5: TEST FIXES PHASE

I'll now run tests to ensure everything passes:

```bash
# Run tests for the implemented component
npm test [component test path]
```

I'll address any test failures:

- [ ] Fix failing tests
- [ ] Verify test coverage
- [ ] Ensure all edge cases are covered

After fixing any test issues, I'll commit them:

```bash
# Commit test fixes if needed
git add [test fix files]
git commit -m "test(issue-$ARGUMENTS): Fix test issues"
```

## STEP 6: AUTOMATED TESTING

For continuous processing mode, I'll run automated verification instead of waiting for manual verification:

```bash
# Run all tests to verify implementation
npm test

# Run build to ensure no breaking changes
npm run build

# Check Storybook compilation if applicable
npm run build-storybook -- --quiet
```

If any tests fail or the build fails, I'll make the necessary fixes before proceeding. This automated verification ensures the implementation meets quality standards without requiring manual intervention.

```
Update Todos
  ☒ Branch Creation & Issue Analysis
  ☒ Define Tests Phase
  ☒ Implementation Phase
  ☒ Build Phase
  ☒ Test Fixes Phase
  ☒ Automated Testing
  ☐ Cleanup & Documentation Phase
  ☐ GitHub Issue Management
```

## STEP 7: CLEANUP & DOCUMENTATION PHASE

I'll create documentation and clean up the implementation:

1. **Cleanup**:
   - Remove debug statements (console.log, etc.)
   - Ensure code comments are clear and necessary
   - Check for unused imports or variables
   - Verify code formatting

2. **Documentation**:
   - Document API/Props/Parameters for implemented functionality
   - Describe actual behavior and core usage patterns
   - Include examples that demonstrate the key functionality
   - Document error handling for expected scenarios

After completing the documentation and cleanup, I'll commit the specific files:

```bash
# List of files to commit
git status --porcelain | grep "^[AM].*md\|^[AM].*ts\|^[AM].*tsx"

# Commit only the documentation files
git add [documentation file 1] [documentation file 2]
git commit -m "docs(issue-$ARGUMENTS): Add documentation and cleanup"
```

## STEP 8: GITHUB ISSUE MANAGEMENT & PR CREATION

The implementation and documentation are now complete. I'll update the GitHub issue and create a PR:

```
Update Todos
  ☒ Branch Creation & Issue Analysis
  ☒ Define Tests Phase
  ☒ Implementation Phase
  ☒ Build Phase
  ☒ Test Fixes Phase
  ☒ Automated Testing
  ☒ Cleanup & Documentation Phase
  ☒ GitHub Issue Management & PR Creation
```

First, I'll add a comment to the GitHub issue:

```javascript
// Add a comment to the GitHub issue
try {
  const comment = await mcp__modelcontextprotocol_server_github__server_github.addIssueComment({
    owner: "jerseycheese",
    repo: "narraitor",
    issueNumber: parseInt($ARGUMENTS),
    body: `## Implementation Complete ✅

Feature completed with the following changes:
- [change 1]
- [change 2]
- [change 3]

Three-Stage Component Testing implementation:
- ✅ Storybook stories created
- ✅ Test harness implemented (/dev/[component-name])
- ✅ Automated tests passing

This was implemented in continuous mode with automated verification.
**IMPORTANT**: Please perform manual testing before merging the PR.

**Modified Files:**
- [file path 1]
- [file path 2]
- [file path 3]

**Created Files:**
- [file path 1]
- [file path 2]
- [file path 3]

PR will be created momentarily.`
  });
  
  console.log(`Successfully added comment to issue #${$ARGUMENTS}`);
} catch (error) {
  console.error("Error adding comment:", error);
}
```

Now I'll push the branch and create a PR without waiting for confirmation:

```bash
# Push the branch
git push origin feature/issue-$ARGUMENTS
```

```javascript
// Create PR using MCP GitHub tool automatically
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

## Three-Stage Component Testing
- [x] Storybook stories created and tested
- [x] Test harness (/dev/[component-name]) implemented
- [x] Integration testing completed

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
- [x] Accessibility considerations addressed

## ⚠️ IMPORTANT: Automated Implementation ⚠️
This PR was created through automated implementation in continuous mode.
**Manual testing is required before merging.**`;

  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: `Fix #${$ARGUMENTS}: [Brief summary of changes]`,
    body: templateContent,
    head: `feature/issue-${$ARGUMENTS}`,
    base: "develop" // Using develop as the base branch
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
  
  // Return the PR URL for the continuous-issues command to track
  return pullRequest.html_url;
  
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  
  // Since we're not using gh CLI, provide URL for manual PR creation
  console.log("Please create the PR manually using this URL:");
  console.log(`https://github.com/jerseycheese/narraitor/compare/develop...feature/issue-${$ARGUMENTS}`);
  console.log("\nPR Details:");
  console.log(`Title: Fix #${$ARGUMENTS}: [Brief summary of changes]`);
  
  // Return the manual URL for the continuous-issues command to track
  return `https://github.com/jerseycheese/narraitor/compare/develop...feature/issue-${$ARGUMENTS}`;
}
```

## IMPLEMENTATION COMPLETE

The feature implementation workflow is now complete! The issue has been updated and the PR is ready for manual testing and review.

The Three-Stage Component Testing approach has been implemented:
- ✅ Storybook stories created and verified
- ✅ Test harness implementation at /dev/[component-name]
- ✅ Automated tests passing

If I detect myself potentially implementing something outside the defined scope, I will:
1. Stop and reconsider the implementation
2. Verify against the scope boundaries
3. Remove any out-of-scope changes
4. Continue with in-scope implementation only

This ensures the implementation follows the KISS principle (Keep It Simple) and prevents scope creep.