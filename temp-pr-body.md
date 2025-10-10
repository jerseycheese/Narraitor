## Description
This PR tackles the dead code cleanup that was outlined in the `docs/dead-code-inventory.md` document. It was a good bit of spring cleaning that removes a fair amount of unused code.

## Related Issue
<!-- Link to the issue this PR addresses (if applicable) -->
Closes #

## Type of Change
<!-- Check the relevant option(s) -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Refactoring (code improvements without changing functionality)
- [x] Documentation update
- [ ] Test addition or improvement

## TDD Compliance
<!-- Explain how this PR follows the TDD approach -->
- [ ] Tests written before implementation
- [ ] All new code is tested
- [x] All tests pass locally
- [ ] Test coverage maintained or improved

## User Stories Addressed
<!-- List the user stories this PR addresses -->

## Flow Diagrams
<!-- Link to or include relevant flow diagrams (if applicable) -->

## Component Development
<!-- For UI changes, include information about Storybook development -->
- [ ] Storybook stories created/updated
- [ ] Components developed in isolation first
- [ ] Visual consistency verified

## Implementation Notes
The approach was pretty straightforward: this change validates each item in the inventory to confirm it was genuinely orphaned, and then removes it. This included a mix of unused UI components, several barrel files that weren't being consumed, and some helper/utility functions that are no longer referenced in the app.

## Screenshots
<!-- For UI changes, include before/after screenshots if applicable -->

## Code Review Summary (if applicable)
<!-- For automated implementations, include code review analysis -->

## Playwright MCP Verification Summary (if applicable)
<!-- For browser automation testing, include verification results -->

## Quality Checks (if applicable)
<!-- For automated workflows, check relevant items -->
- [x] Linting passed
- [ ] Type checking passed
- [ ] Security audit passed
- [ ] No console.log statements in production code
- [ ] No unhandled promises

## Testing Instructions
After the removal, the full test suite and linter were run to ensure that no dependencies were accidentally broken. Everything is passing, so this should be a safe and straightforward merge.

To verify locally:
1. Pull down the `feature/remove-dead-code` branch.
2. Run `npm install`.
3. Run `npm run test` and confirm all tests pass.
4. Run `npm run lint` and confirm there are no new errors or warnings.

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [ ] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [ ] Accessibility considerations addressed