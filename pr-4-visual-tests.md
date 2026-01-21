Title: Add visual regression tests for tutorial flows

## Description
Now that we have the tours, we need to make sure they don't break as we evolve the UI. This adds a suite of Playwright visual tests that walk through the tutorial steps to ensure the tooltips appear correctly and in the right places.

## Related Issue
Part of #399

## Implementation Notes
- Added new visual specs for character and world creation tours.
- Created `seedTestData` utilities to set up the tutorial state for tests.
