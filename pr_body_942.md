# PR Body: test: add coverage for lore extraction hardening logic

## Description
This adds comprehensive tests for the lore extraction hardening logic we recently put in. Basically, we have a bunch of heuristics now for filtering out "bad" character names (like "Man with sword") and cleaning up location names, and I wanted to make sure we have a solid safety net around that so it doesn't silently break later.

I added a new test file `loreStore.hardening.test.ts` that covers the three main pieces: character name validation, location canonicalization, and the event deduplication logic.

## Related Issue
Closes #942

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvements without changing functionality)
- [ ] Documentation update
- [x] Test addition or improvement

## TDD Compliance
- [ ] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

## User Stories Addressed
N/A (Technical debt/hardening)

## Implementation Notes
The location canonicalization tests were interesting—I had to double-check the logic for chained transformations. Turns out `canonicalizeLocationName` applies rules sequentially but keeps the original as an alias for each match, so I verified that behavior explicitly to lock it in.

Also, for the event limiting, I mocked out the context to verify we strictly respect the `MAX_EVENTS_PER_EXTRACTION` limit (currently 3) and that we're prioritizing high-importance events correctly when we have to drop some.

## Testing Instructions
1. Run `npm test src/state/__tests__/loreStore.hardening.test.ts` to verify the hardening logic.
2. Run `npm test` to ensure no regressions in the wider state module.

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed
