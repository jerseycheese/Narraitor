---
name: Enhancement
about: Implement chronological sorting for journal entries
title: "Implement chronological sorting for journal entries"
labels: enhancement, journal-system, mvp
assignees: ''
epic: #494
---

## Plain Language Summary
Journal entries should display in chronological order (newest first) so players can easily follow their adventure timeline.

## Current Feature
The Journal System currently displays entries in the order they were added to the session array, not by their actual creation timestamp. This means entries may appear out of order if they are created asynchronously.

## Domain
- [x] Journal System

## Enhancement Description
Update the `getSessionEntries` method in `journalStore.ts` to sort entries by their `createdAt` timestamp in descending order (newest first). This ensures players see their most recent adventures at the top of their journal.

### Current Implementation:
```typescript
getSessionEntries: (sessionId) => {
  const state = get();
  const entryIds = state.sessionEntries[sessionId] || [];
  return entryIds.map((id) => state.entries[id]).filter(Boolean);
}
```

### Required Implementation:
```typescript
getSessionEntries: (sessionId) => {
  const state = get();
  const entryIds = state.sessionEntries[sessionId] || [];
  return entryIds
    .map((id) => state.entries[id])
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
```

## Reason for Enhancement
This is a **core MVP requirement** that was missed in the initial implementation. The requirements document specifically states:
- "Chronological Organization: Timeline-based viewing of journal entries"
- This is essential for players to understand the sequence of their adventures

## Possible Implementation
1. Update `getSessionEntries` method to include sorting
2. Add unit tests to verify chronological ordering
3. Test with entries created at different times
4. Verify performance with large numbers of entries

## Test Plan
1. **Unit Tests**:
   - Add test in `journalStore.test.ts` to verify chronological sorting
   - Test with entries created seconds apart
   - Test with entries created days apart
   - Test empty and single-entry edge cases

2. **Manual Testing**:
   - Create multiple journal entries with delays between them
   - Verify newest entries appear at the top
   - Test with the enhanced journal test harness at `/dev/enhanced-journal`
   - Verify on mobile devices

## Acceptance Criteria
- [ ] Journal entries display in reverse chronological order (newest first)
- [ ] Sorting works correctly across different sessions
- [ ] Unit tests pass for chronological ordering
- [ ] No performance regression with 100+ entries
- [ ] Mobile responsiveness maintained

## Related Work
- Blocks closing of Epic #494 (Journal System MVP)
- Related to Issue #278 (Journal UI components)
- Related to Issue #562 (Enhanced Journal UI)

## Additional Context
This is the final requirement needed to close the Journal System MVP epic. All other requirements have been successfully implemented and tested.
