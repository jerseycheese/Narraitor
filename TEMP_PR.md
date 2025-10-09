## Description
This PR addresses the dead code audit from early October, removing a significant amount of unused code. It was a pretty straightforward cleanup, targeting orphaned hooks, components, and service methods that were no longer being called anywhere in the app. The main goal here is just to reduce codebase clutter and future maintenance burden.

## Related Issue
Closes #<ISSUE_NUMBER>

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Refactoring (code improvements without changing functionality)
- [ ] Documentation update
- [ ] Test addition or improvement

## TDD Compliance
- [x] Tests written before implementation (N/A for deletion, but existing tests were run to validate changes)
- [ ] All new code is tested (N/A)
- [x] All tests pass locally
- [x] Test coverage maintained or improved

## Implementation Notes
The process was mostly just deleting files and running tests. The most interesting part was discovering that the `useToast` hook, which the audit flagged as unused, is actually alive and well. It's being used by the `useAutoSave` hook in `ActiveGameSession`, so I left it alone. It's a good reminder that audits can get stale, and it's always worth double-checking.

## Testing Instructions
1.  Pull down the `chore/remove-dead-code` branch.
2.  Run `npm install` to be safe.
3.  Run the full test suite with `npm test` and ensure everything passes.
4.  Run the linter with `npm run lint` to check for issues.
5.  Start the app with `npm run dev` and navigate through the main flows (world creation, starting a game session). There should be no visible changes or new errors in the console, as all the removed code was already inactive.
