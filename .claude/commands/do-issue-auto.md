# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL

# NOTE: For true auto-mode without any prompts, please select 
# "Yes, and don't ask again this session" on the first prompt you see.
# This will enable session-level auto-accept for all subsequent operations.

I'll implement issue #$ARGUMENTS entirely automatically, proceeding through all steps without manual stops using enhanced subagent delegation.

## SUBAGENT DELEGATION STRATEGY

Throughout this workflow, I'll leverage specialized subagents via the Task tool for expert-level work:
- **Analysis Tasks**: Issue Analysis Specialist for GitHub issue research and specification creation
- **Test Writing**: Test Writing Specialist for TDD-focused test creation
- **Implementation**: UI Component, Business Logic, and Integration Specialists (parallel execution)
- **Verification**: Verification Coordinator for BrowserMCP testing orchestration
- **Code Review**: Code Review Specialist for pattern analysis and optimization identification
- **Documentation**: Documentation Specialist for API/usage docs creation

Let's start by creating the comprehensive todo structure and beginning with specialized subagent delegation.

Please use the TodoWrite tool to create these workflow todos:

[
  {"id": "branch-creation-analysis-$ARGUMENTS", "content": "Branch Creation & Issue Analysis", "status": "pending", "priority": "high"},
  {"id": "define-tests-$ARGUMENTS", "content": "Define Tests Phase", "status": "pending", "priority": "high"},
  {"id": "implementation-$ARGUMENTS", "content": "Implementation Phase", "status": "pending", "priority": "high"},
  {"id": "build-$ARGUMENTS", "content": "Build Phase", "status": "pending", "priority": "high"},
  {"id": "test-fixes-$ARGUMENTS", "content": "Test Fixes Phase", "status": "pending", "priority": "high"},
  {"id": "automated-verification-$ARGUMENTS", "content": "Automated Verification Phase", "status": "pending", "priority": "high"},
  {"id": "code-review-reusability-$ARGUMENTS", "content": "Code Review & Reusability Analysis", "status": "pending", "priority": "medium"},
  {"id": "cleanup-documentation-$ARGUMENTS", "content": "Cleanup & Documentation Phase", "status": "pending", "priority": "medium"},
  {"id": "github-issue-management-$ARGUMENTS", "content": "GitHub Issue Management", "status": "pending", "priority": "medium"}
]

## STEP 1: BRANCH CREATION & ISSUE ANALYSIS

Now I'll mark the first phase as in_progress and begin the Issue Analysis.

Please update the "Branch Creation & Issue Analysis" todo to in_progress status.

First, I'll generate a descriptive branch name based on the issue title and create the feature branch:

```bash
# Get descriptive branch name from issue
export BRANCH_NAME=$(./scripts/get-issue-branch-name.sh $ARGUMENTS)
echo "Creating branch: $BRANCH_NAME"

# Ensure we're on the latest develop/main
git checkout develop 2>/dev/null || git checkout main
git pull origin $(git rev-parse --abbrev-ref HEAD)

# Delete branch if it exists (for clean start)
git branch -D "$BRANCH_NAME" 2>/dev/null || true

# Create and checkout new branch
git checkout -b "$BRANCH_NAME"
echo "✅ Created branch: $BRANCH_NAME"
```

All changes will be made on this feature branch, allowing easy rollback if needed.

### SUBAGENT: Issue Analysis Specialist

I'll now delegate the issue analysis to a specialized subagent using the Task tool:

Please use the Task tool to delegate this work to a specialized subagent:

Description: Analyze GitHub issue and create technical specification
Prompt: You are an Issue Analysis Specialist subagent. Your task is to:

1. Fetch GitHub issue #$ARGUMENTS from jerseycheese/narraitor repository using available GitHub tools
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

Please analyze issue #$ARGUMENTS and return a complete technical specification.

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
  ☐ Code Review & Reusability Analysis
  ☐ Cleanup & Documentation Phase
  ☐ GitHub Issue Management
```

## STEP 2: DEFINE TESTS PHASE

Please mark "Branch Creation & Issue Analysis" as completed and "Define Tests Phase" as in_progress.

### SUBAGENT: Test Writing Specialist

I'll delegate test creation to a specialized testing subagent using the Task tool:

Please use the Task tool to delegate this work to a specialized subagent:

Description: Create focused TDD tests for implementation
Prompt: You are a Test Writing Specialist subagent following strict TDD principles. Your task is to:

1. Based on the technical specification above, write focused tests that verify core functionality
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

Please create focused test files and specifications that directly verify the acceptance criteria without testing implementation details.

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

Please mark "Define Tests Phase" as completed and "Implementation Phase" as in_progress.

### SUBAGENT: Implementation Specialists

I'll delegate the implementation to specialized subagents using the Task tool for parallel execution:

Please use the Task tool to delegate to three parallel implementation specialists:

**UI Component Specialist:**
Description: Implement React components following project patterns
Prompt: You are a UI Component Implementation Specialist subagent. Your task is to:

1. Create React components following project patterns from the specification
2. Use existing shadcn/ui components where possible  
3. Maintain <300 lines per component following single responsibility principle
4. Follow established TypeScript patterns and domain boundaries
5. Create Storybook stories for all component variants and states
6. Ensure accessibility is built-in, not added later

Focus only on UI component implementation to pass the defined tests. Do not add features outside the specification scope.

**Business Logic Specialist:**
Description: Implement core functionality and state management
Prompt: You are a Business Logic Implementation Specialist subagent. Your task is to:

1. Implement core functionality to pass tests using existing patterns
2. Use existing utilities from the codebase where possible
3. Follow established Zustand store patterns for state management
4. Ensure proper error handling with recovery mechanisms
5. Maintain atomic and predictable state updates
6. Integrate with existing domain stores appropriately

Implement the minimum business logic needed to satisfy the test requirements and acceptance criteria.

**Integration Specialist:**
Description: Connect components with stores and services
Prompt: You are an Integration Specialist subagent. Your task is to:

1. Connect components with stores/services following project patterns
2. Ensure proper data flow between components and state management
3. Handle edge cases within the defined scope
4. Create test harness pages at /dev/[component-name] for interactive testing
5. Ensure integration with existing systems follows domain boundaries

Focus on integration points and ensure all components work together seamlessly within the existing architecture.

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

## STEP 5.5: AUTOMATED VERIFICATION PHASE

### BrowserMCP Automated Testing

I'll now run automated verification using BrowserMCP to test the implementation before manual review:

```bash
# Run BrowserMCP automated verification suite
./scripts/browsermcp-verify.sh $ARGUMENTS full
```

This automated verification includes:

#### 🧪 Test Harness Verification
- Automated navigation to relevant `/dev/[component-name]` test harness
- Testing core acceptance criteria scenarios with realistic data
- Screenshots of different states (default, loading, error)
- Responsive behavior testing (mobile, tablet, desktop)
- Interactive feature verification
- Console error detection and accessibility checks

#### 📖 Storybook Verification  
- Automated navigation through all component stories
- Interactive controls testing and visual verification
- Visual snapshot capture for comparison
- Accessibility feature testing (keyboard navigation, screen reader)
- Component rendering verification across all defined states

#### 🔄 Integration Testing
- Feature testing within full application context
- Real data integration verification
- Cross-component interaction testing
- Acceptance criteria verification in realistic scenarios
- Edge case and error handling testing

#### 📊 Automated Report Generation

The BrowserMCP verification generates a comprehensive report including:
- ✅ **Passed Checks**: Functionality working correctly
- ⚠️ **Issues Found**: Problems requiring attention
- 📸 **Screenshots**: Visual evidence of testing
- 🔧 **Suggested Fixes**: Specific recommendations for issues
- 💡 **Recommendations**: Best practices and improvements

```
Update Todos
  ☒ Branch Creation & Issue Analysis
  ☒ Define Tests Phase
  ☒ Implementation Phase
  ☒ Build Phase
  ☒ Test Fixes Phase
  ☒ Automated Verification Phase
  ☐ Code Review & Reusability Analysis
  ☐ Cleanup & Documentation Phase
  ☐ GitHub Issue Management
```

### Automated Verification Results

After BrowserMCP testing completes, I'll review the generated report and address any critical issues found:

- [ ] **Critical Issues**: Fix any blocking problems immediately
- [ ] **Performance Issues**: Address significant performance concerns  
- [ ] **Accessibility Issues**: Fix accessibility violations
- [ ] **Responsive Issues**: Resolve mobile/tablet display problems
- [ ] **Console Errors**: Eliminate JavaScript errors and warnings

If critical issues are found, I'll implement fixes and re-run verification before proceeding.

## STEP 6: CODE REVIEW & REUSABILITY ANALYSIS

### SUBAGENT: Code Review Specialist

I'll delegate code analysis to a specialized review subagent using the Task tool:

Please use the Task tool to delegate this work to a specialized subagent:

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

I'll analyze the implemented code for potential improvements and reuse opportunities:

### 6.1 Existing Component Integration Analysis
- [ ] **UI Components**: Check if raw HTML elements can be replaced with existing shadcn/ui components
- [ ] **Button Components**: Verify correct Button component usage with proper variants/sizes
- [ ] **Form Components**: Look for reusable form wrappers, error displays, and validation patterns
- [ ] **Loading States**: Identify opportunities to use existing LoadingState components
- [ ] **Error Handling**: Check if ErrorDisplay components can replace custom error UI

### 6.2 Type Safety & Interface Reuse
- [ ] **Character Types**: Ensure compatibility with existing Character interfaces from `/src/types/character.types.ts`
- [ ] **Skill Requirements**: Verify integration with existing `DecisionRequirement` interfaces
- [ ] **State Management**: Check for consistency with established store patterns and state interfaces

### 6.3 Utility Function Integration
- [ ] **Debouncing**: Replace custom debouncing with existing `useDebounce` from `/src/lib/utils/debounce.ts`
- [ ] **Form Helpers**: Use existing form utilities from `/src/lib/utils/formHelpers.ts` if applicable
- [ ] **Validation**: Integrate with existing validation patterns instead of creating new ones
- [ ] **Error Handling**: Use established error handling utilities for consistency

### 6.4 Performance Optimization Opportunities
- [ ] **Memoization**: Add React.memo for components with stable props to reduce re-renders
- [ ] **Lazy Loading**: Identify components that can be loaded on demand
- [ ] **Hook Optimization**: Ensure custom hooks follow performance best practices

### 6.5 Refactoring Actions

Based on the analysis above, I'll implement improvements:

1. **Replace Custom Implementations** with existing components
2. **Integrate Existing Types** to maintain consistency
3. **Add Performance Optimizations** where beneficial
4. **Extract Reusable Patterns** for future use
5. **Update Tests** to reflect any refactoring changes

```bash
# Commit refactoring improvements
git add [refactored files]
git commit -m "refactor(issue-$ARGUMENTS): Integrate existing components and extract reusable patterns"
```

## STEP 7: CLEANUP & DOCUMENTATION PHASE

### SUBAGENT: Documentation Specialist

I'll delegate documentation creation to a specialized subagent using the Task tool:

Please use the Task tool to delegate this work to a specialized subagent:

Description: Create comprehensive technical documentation
Prompt: You are a Documentation Specialist subagent focused on comprehensive technical documentation. Your task is to:

1. Create API/Props/Parameters documentation for all new components
2. Write usage examples demonstrating key functionality from the implementation
3. Document integration points with existing systems
4. Cover error handling scenarios and edge cases
5. Follow project documentation standards from CLAUDE.md
6. Ensure documentation is concise and AI-readable (150 lines max per doc)

Return documentation files ready for commit that provide comprehensive guidance for using the implemented features.

I'll create documentation and clean up the implementation:

1. **Code Cleanup**:
   - Remove debug statements (console.log, etc.)
   - Ensure code comments are clear and necessary
   - Check for unused imports or variables
   - Verify code formatting

2. **Test & Story Cleanup** (Removing trivial tests/stories for this branch only):
   
   **Analyzing tests for removal:**
   ```bash
   # Find all test files modified in this branch
   git diff --name-only develop...HEAD | grep -E "\.(test|spec)\.(ts|tsx)$"
   ```
   
   **Tests to remove (if found):**
   - ❌ Render-only tests (just checking if component renders)
   - ❌ Basic prop passing tests without behavior verification
   - ❌ Snapshot tests without specific purpose
   - ❌ Simple CSS class tests
   - ❌ Tests with only 1-2 basic assertions
   
   **Analyzing stories for removal:**
   ```bash
   # Find all story files modified in this branch
   git diff --name-only develop...HEAD | grep -E "\.stories\.(ts|tsx)$"
   ```
   
   **Stories to remove (if found):**
   - ❌ Stories without meaningful interactions
   - ❌ Stories that duplicate other stories
   - ❌ Simple wrapper stories without added value
   - ❌ Stories showing only default state without variations
   
   **Analyzing test harnesses for removal:**
   ```bash
   # Find all test harness files modified in this branch
   git diff --name-only develop...HEAD | grep -E "src/app/dev/.*\.(ts|tsx)$"
   ```
   
   **Test harnesses to remove (if found):**
   - ❌ Harnesses that just render without test scenarios
   - ❌ Harnesses that duplicate Storybook functionality
   - ❌ Simple wrapper harnesses without interaction testing
   - ❌ Placeholder harnesses with minimal testing value

3. **Documentation**:
   - Document API/Props/Parameters for implemented functionality
   - Describe actual behavior and core usage patterns
   - Include examples that demonstrate the key functionality
   - Document error handling for expected scenarios

**Cleanup Summary:**
- Trivial tests removed: [list of removed test files]
- Trivial stories removed: [list of removed story files]
- Trivial test harnesses removed: [list of removed harness files]
- Tests kept (MVP-aligned): [list of valuable tests]
- Stories kept (meaningful): [list of valuable stories]
- Test harnesses kept (valuable): [list of valuable harnesses]

After completing the documentation and cleanup, I'll commit the specific files:

```bash
# List of files to commit (including deletions)
git status --porcelain | grep -E "^[AMD].*md|^[AMD].*ts|^[AMD].*tsx"

# Stage all changes including deletions
git add -A

# Commit the cleanup changes
git commit -m "refactor(issue-$ARGUMENTS): Cleanup trivial tests/stories/harnesses and update documentation

- Removed trivial tests that don't align with MVP requirements
- Removed duplicate/simple storybook stories
- Removed placeholder test harnesses without testing value
- Updated component documentation
- Cleaned up debug statements and unused code"
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
  ☒ Automated Verification Phase
  ☒ Code Review & Reusability Analysis
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

Feature implementation is ready for review.

**Modified Files:**
- [file path 1]
- [file path 2]
- [file path 3]

**Created Files:**
- [file path 1]
- [file path 2]
- [file path 3]

PR will be created momentarily with manual verification checklist.`
  });
  
  console.log(`Successfully added comment to issue #${$ARGUMENTS}`);
} catch (error) {
  console.error("Error adding comment:", error);
}
```

Now I'll push the branch and create a PR with verification checklist:

```bash
# Push the branch
git push origin "$BRANCH_NAME"
```

```javascript
// Create PR using MCP GitHub tool with manual verification checklist
try {
  // Get list of modified/created files for verification
  const modifiedFiles = /* list of modified files from git */;
  const createdFiles = /* list of created files from git */;
  
  // Read the PR template with verification checklist
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

## Implementation Files

**Modified Files:**
${modifiedFiles.map(f => `- ${f}`).join('\n')}

**Created Files:**
${createdFiles.map(f => `- ${f}`).join('\n')}

## Automated Verification Completed ✅

This PR includes comprehensive automated testing using BrowserMCP:

### 🤖 BrowserMCP Verification Results:
- **Test Harness Testing**: Automated navigation and testing of \`/dev/[component-name]\` harnesses
- **Storybook Verification**: Automated story testing and visual validation  
- **Integration Testing**: Full application context and cross-component testing
- **Responsive Design**: Multi-viewport testing (mobile, tablet, desktop)
- **Accessibility**: Automated accessibility compliance checks
- **Performance**: Load time and responsiveness monitoring

📊 **Verification Report**: \`[Link to generated BrowserMCP report]\`

### Manual Verification Required ⚠️

The following items require manual verification (reduced scope due to automated testing):

### Three-Stage Manual Verification:

#### 1. Strategic Review (BrowserMCP covered basics):
- [ ] Review BrowserMCP verification report for any issues
- [ ] Spot-check critical user flows manually if needed
- [ ] Verify business logic aligns with requirements

#### 2. Edge Case Validation (If not fully covered by automation):
- [ ] Test any complex edge cases specific to this feature
- [ ] Verify error handling for scenarios not automated
- [ ] Check any domain-specific business rules

#### 3. Final Acceptance (Business validation):
- [ ] Confirm feature delivers expected user value
- [ ] Verify all original acceptance criteria are met
- [ ] Check for any integration impacts on existing features

### Issue-Specific Verification Points:
Please verify these specific aspects of the implementation for issue #${$ARGUMENTS}:

- [ ] [Specific feature 1] works as defined in acceptance criteria
- [ ] [Specific feature 2] handles edge cases correctly
- [ ] [Specific UI aspect] displays correctly
- [ ] [Specific interaction] functions as expected
- [ ] Error states are handled gracefully
- [ ] Feature is accessible and responsive

### Commands for Verification:
\`\`\`bash
# View BrowserMCP verification report
cat .claude/verification-reports/issue-${$ARGUMENTS}-*.md

# Re-run BrowserMCP verification if needed
./scripts/browsermcp-verify.sh ${$ARGUMENTS} full

# Run specific test types if issues found
./scripts/browsermcp-verify.sh ${$ARGUMENTS} storybook
./scripts/browsermcp-verify.sh ${$ARGUMENTS} harness  
./scripts/browsermcp-verify.sh ${$ARGUMENTS} integration

# Traditional verification (if needed)
npm run dev    # Manual testing
npm run storybook  # Manual story review
git diff develop...$BRANCH_NAME  # Code review
\`\`\`

## User Stories Addressed
- Implemented features based on issue #${$ARGUMENTS}

## Implementation Notes
- Feature implemented following project patterns
- Maintained backward compatibility
- Followed single responsibility principle
- Files kept under 300 lines
- Integrated existing components where possible
- Removed trivial tests/stories/harnesses that don't align with MVP requirements
- Kept only meaningful tests that verify acceptance criteria
- Added performance optimizations

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed
- [ ] Manual verification completed (reviewer to check)`;

  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: `Fix #${$ARGUMENTS}: [Brief summary of changes]`,
    body: templateContent,
    head: process.env.BRANCH_NAME || `feature/issue-${$ARGUMENTS}`,
    base: "develop" // Using develop as the base branch
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  
  // Since we're not using gh CLI, provide URL for manual PR creation
  console.log("Please create the PR manually using this URL:");
  console.log(`https://github.com/jerseycheese/narraitor/compare/develop...${process.env.BRANCH_NAME || 'feature/issue-' + $ARGUMENTS}`);
  console.log("\nPR Details:");
  console.log(`Title: Fix #${$ARGUMENTS}: [Brief summary of changes]`);
}
```

## WORKFLOW COMPLETE

The feature implementation workflow is now complete! The issue has been updated and the PR is ready for review.

```
Update Todos
  ☒ Branch Creation & Issue Analysis
  ☒ Define Tests Phase
  ☒ Implementation Phase
  ☒ Build Phase
  ☒ Test Fixes Phase
  ☒ Code Review & Reusability Analysis
  ☒ Cleanup & Documentation Phase
  ☒ GitHub Issue Management
```

You can review all the changes with:
```bash
git diff develop..."$BRANCH_NAME"
```

The implementation is complete and ready for manual verification during PR review.

### SUBAGENT PERFORMANCE SUMMARY

Throughout this workflow, specialized subagents were used for:
- **Issue Analysis**: Technical specification and scope definition
- **Test Writing**: Focused test creation following TDD principles
- **Implementation**: Component and logic development
- **Code Review**: Pattern analysis and optimization opportunities
- **Documentation**: Comprehensive docs and usage examples

If I detect myself potentially implementing something outside the defined scope, I will:
1. Stop and reconsider the implementation
2. Verify against the scope boundaries
3. Remove any out-of-scope changes
4. Continue with in-scope implementation only

This ensures the implementation follows the KISS principle (Keep It Simple) and prevents scope creep.
