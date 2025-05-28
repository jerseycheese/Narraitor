# MVP Lore System Implementation Checklist

## Quick Reference for Issue #434

### Phase 1: Setup & Tests (Day 1)
- [ ] Create `/src/types/lore.types.ts` with MVP interfaces
- [ ] Write unit tests for loreStore in `/src/state/__tests__/loreStore.test.ts`
- [ ] Write tests for AI extraction mock responses
- [ ] Write tests for context hook with token limits

### Phase 2: Core Implementation (Day 1-2)
- [ ] Implement `/src/state/loreStore.ts` with basic CRUD
- [ ] Add `getFactsForContext()` method with character limit
- [ ] Create `/src/lib/ai/loreExtractor.ts` with Gemini integration
- [ ] Parse AI responses into LoreFact objects
- [ ] Add error handling for AI extraction failures

### Phase 3: UI & Integration (Day 2)
- [ ] Create `/src/components/Lore/LoreViewer.tsx` component
- [ ] Add Storybook story: `LoreViewer.stories.tsx`
- [ ] Build manual fact entry form
- [ ] Integrate extraction into narrative generation flow
- [ ] Add lore viewer to GameSessionActive component

### Phase 4: Testing & Polish (Day 2-3)
- [ ] Create test harness at `/dev/lore-system`
- [ ] Test with real narrative segments
- [ ] Verify token budget calculations
- [ ] Check persistence across sessions
- [ ] Performance testing (target: <100ms impact)

### Ready for #185 Integration
- [ ] `getFactsForContext()` returns formatted string
- [ ] Token budget management working
- [ ] Facts properly categorized
- [ ] Basic search functionality operational

### Documentation
- [ ] Update type exports in `/src/types/index.ts`
- [ ] Add JSDoc comments to public methods
- [ ] Update project README if needed

## Key Constraints (MVP)
- ✅ 5 facts max per narrative segment
- ✅ 20% of context window for lore (≈2000 chars)
- ✅ No fact editing (immutable after creation)
- ✅ No deduplication (add in post-MVP)
- ✅ Simple string search only

## Success Metrics
- [ ] All tests passing
- [ ] Storybook story renders correctly
- [ ] Facts extracted from test narratives
- [ ] Context hook returns proper format for AI
- [ ] No performance degradation in narrative generation
