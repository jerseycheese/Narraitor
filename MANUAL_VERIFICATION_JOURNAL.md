# Manual Verification Guide: Journal Interface (Issue #278)

## Overview
This guide provides step-by-step manual verification for the journal interface functionality implemented in Issue #278. Perform these tests to ensure the journal system works correctly in the live application.

## Prerequisites
- Development server running (`npm run dev`)
- At least one world created
- At least one character created

## Test Scenarios

### Scenario 1: Journal Access Button Visibility (AC1)
**Objective**: Verify journal access button appears in active game sessions

**Steps**:
1. Navigate to `/dev/journal-access` (dev harness)
2. Verify journal button appears in character summary area
3. Check button has book icon and "Journal" text
4. Verify button styling (blue background, proper hover states)

**Expected Results**:
- ✓ Journal button visible with book icon
- ✓ Button shows "Journal" text on larger screens
- ✓ Button has proper blue styling and hover effects
- ✓ Button has accessible aria-label: "Open journal to view your adventure entries"

### Scenario 2: Journal Modal Opening (AC2)
**Objective**: Verify clicking journal button opens modal

**Steps**:
1. From journal access dev page, click the "Journal" button
2. Observe modal behavior
3. Check modal positioning and backdrop

**Expected Results**:
- ✓ Modal opens immediately when button clicked
- ✓ Modal appears centered on screen
- ✓ Dark backdrop appears behind modal
- ✓ Modal has proper heading "Game Journal"
- ✓ Close button (×) visible in top-right

### Scenario 3: Empty Journal State (AC4)
**Objective**: Verify empty state when no journal entries exist

**Steps**:
1. Open journal modal (should be empty by default)
2. Verify empty state messaging
3. Check layout and styling

**Expected Results**:
- ✓ Shows "Your journal is empty" message
- ✓ Shows "Entries will appear here as your story unfolds" subtitle
- ✓ Empty state is centered and well-styled
- ✓ No error messages or broken layouts

### Scenario 4: Journal Modal Closing (AC2)
**Objective**: Verify multiple ways to close modal

**Steps**:
1. Open journal modal
2. Test closing via close button (×)
3. Reopen modal
4. Test closing via backdrop click
5. Test with keyboard (ESC key if implemented)

**Expected Results**:
- ✓ Close button (×) closes modal immediately
- ✓ Clicking backdrop (dark area) closes modal
- ✓ Modal fully disappears and backdrop removed
- ✓ Focus returns appropriately

### Scenario 5: Journal Entries Display (AC5)
**Objective**: Verify journal entries appear correctly (requires test data)

**Steps**:
1. In dev environment, add test journal entries:
   - Navigate to browser console
   - Execute: 
   ```javascript
   // Add test journal entries
   const { useJournalStore } = await import('/src/state/journalStore');
   const store = useJournalStore.getState();
   
   store.addEntry({
     sessionId: 'test-session',
     worldId: 'test-world', 
     characterId: 'test-character',
     type: 'character_event',
     title: 'Met the Village Elder',
     content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy.',
     significance: 'major',
     relatedEntities: [],
     metadata: { tags: ['prophecy', 'elder'], automaticEntry: true }
   });
   
   store.addEntry({
     sessionId: 'test-session',
     worldId: 'test-world',
     characterId: 'test-character', 
     type: 'discovery',
     title: 'Found Ancient Scroll',
     content: 'Discovered a mysterious scroll hidden in the library ruins.',
     significance: 'minor',
     relatedEntities: [],
     metadata: { tags: ['scroll', 'discovery'], automaticEntry: true }
   });
   ```

2. Refresh page and open journal modal
3. Verify entries display correctly

**Expected Results**:
- ✓ "Character Events" section header appears
- ✓ Journal entries show with titles and content
- ✓ Significance badges display correctly (major/minor)
- ✓ Unread indicators (blue dots) appear for new entries
- ✓ Entries are clickable and well-formatted

### Scenario 6: Mark as Read Functionality (AC5)
**Objective**: Verify clicking entries marks them as read

**Steps**:
1. With journal entries visible (from Scenario 5)
2. Note unread indicators (blue dots)
3. Click on a journal entry
4. Observe changes to unread status

**Expected Results**:
- ✓ Clicking entry removes unread indicator (blue dot)
- ✓ Entry remains clickable after being marked read
- ✓ Other entries still show unread indicators if not clicked
- ✓ No errors in browser console

### Scenario 7: Accessibility Testing (AC4)
**Objective**: Verify modal meets accessibility standards

**Steps**:
1. Open journal modal
2. Check with screen reader or accessibility tools
3. Test keyboard navigation
4. Verify ARIA attributes

**Expected Results**:
- ✓ Modal has `role="dialog"` attribute
- ✓ Modal has `aria-modal="true"` attribute  
- ✓ Modal properly labeled with `aria-labelledby="journal-modal-title"`
- ✓ Close button has proper `aria-label="Close journal"`
- ✓ Unread indicators have `aria-label="Unread"`

### Scenario 8: Automatic Journal Entry Creation
**Objective**: Verify journal entries are automatically created during narrative progression

**Steps**:
1. Navigate to `/dev/journal-access` or a real game session
2. Progress through the narrative by making choices
3. Open journal modal after each narrative progression
4. Verify new entries appear automatically

**Expected Results**:
- ✓ Journal entries automatically created when narrative progresses
- ✓ Entry titles reflect the narrative content appropriately  
- ✓ Entry types categorized correctly (scene → discovery, action → character_event, etc.)
- ✓ All new entries start as unread (blue dot indicator)
- ✓ Entries contain **AI-generated summaries** of what the player experienced
- ✓ Summaries are 1-2 sentences in past tense from player's perspective ("I did X")
- ✓ Summaries focus on key actions, discoveries, and story events

### Scenario 9: Real Game Session Integration
**Objective**: Verify journal works in actual game sessions

**Steps**:
1. Navigate to `/play` or `/worlds` 
2. Start or continue a game session
3. Look for journal button in active session UI
4. Test journal functionality during actual gameplay
5. Progress the narrative and verify automatic journal entries

**Expected Results**:
- ✓ Journal button appears in real game sessions
- ✓ Modal opens/closes correctly during gameplay
- ✓ No interference with other game session controls
- ✓ Journal persists between page refreshes
- ✓ Automatic entries created during real gameplay

## Browser Testing
Test in multiple browsers:
- ✓ Chrome/Chromium
- ✓ Firefox  
- ✓ Safari (if on Mac)
- ✓ Mobile browsers (responsive design)

## Performance Checks
- ✓ Modal opens/closes smoothly without lag
- ✓ No console errors during journal operations
- ✓ Journal entries load quickly
- ✓ No memory leaks when opening/closing repeatedly

## Error Scenarios
Test edge cases:
- ✓ What happens with very long journal entry content?
- ✓ What happens with many journal entries (scrolling)?
- ✓ What happens if journal store has errors?
- ✓ Does modal handle window resizing properly?

## Acceptance Criteria Verification

### AC1: Journal Access Button
- [ ] Button appears in active game sessions
- [ ] Button has appropriate styling and icon
- [ ] Button is accessible with proper ARIA labels

### AC2: Modal Open/Close
- [ ] Clicking button opens modal
- [ ] Modal can be closed via close button
- [ ] Modal can be closed via backdrop click
- [ ] Modal appears/disappears smoothly

### AC4: Modal UI/Accessibility
- [ ] Modal renders only when open
- [ ] Modal has proper accessibility attributes
- [ ] Empty state displays correctly
- [ ] Modal is properly styled and responsive

### AC5: Journal Content
- [ ] Journal entries display with proper formatting
- [ ] Unread indicators work correctly
- [ ] Clicking entries marks them as read
- [ ] Content shows titles, descriptions, and metadata

## Notes
- Use browser developer tools to check for console errors
- Test with different screen sizes for responsive behavior
- Verify that journal state persists correctly
- Check that modal z-index is appropriate (appears above other content)

## Troubleshooting

### Issue: Journal shows JSON instead of narrative text
If you see journal entries displaying raw JSON like:
```json
{
  "content": "The narrative text...",
  "type": "scene",
  ...
}
```

**Solution**: This has been fixed with automatic JSON parsing. The system now:
1. Detects JSON-formatted narrative segments in the **narrative generator**
2. Extracts the `content` field and metadata automatically
3. Stores clean narrative text and proper location metadata in segments
4. Creates concise journal entries using the extracted metadata
5. Uses `Clear & Regenerate Journal` button in dev harness to refresh

### Issue: Narrative segments show generic locations
If narrative segments display "Starting Location" instead of actual locations like "Rewind Oasis Video Store":

**Solution**: Fixed by updating the narrative generator to properly parse AI JSON responses:
1. The `formatResponse` method now extracts actual location from AI metadata
2. Both narrative display AND journal entries now show the correct location
3. Segments will display the true location provided by the AI

### Issue: Journal entries are unhelpful metadata summaries
If journal entries show generic content like "Location: tag1, tag2 (mood)" instead of meaningful summaries:

**Solution**: Implemented AI-powered journal summaries:
1. **New API endpoint**: `/api/narrative/summarize` generates 1-2 sentence summaries
2. **AI prompt**: Specifically asks for player-perspective, past-tense summaries of key events
3. **Fallback system**: If AI fails, uses cleaned first sentence of narrative content
4. **Examples**: 
   - ❌ Old: "Rewind Oasis: opening, introduction (calm)"
   - ✅ New: "I started my shift at the video store, organizing DVD stacks while Marco dealt with an angry customer."

### Clear Journal Data
In the dev harness (`/dev/journal-access`), use the **"Clear & Regenerate Journal"** button to:
- Clear existing problematic journal entries
- Regenerate clean entries with proper content
- Test the automatic parsing functionality

## Quick Test Commands
If you need to quickly add test data for verification:

```javascript
// Browser console commands for testing
const addTestEntry = (title, content, significance = 'minor') => {
  const { useJournalStore } = window.__NARRAITOR_STORES__ || {};
  if (useJournalStore) {
    useJournalStore.getState().addEntry({
      sessionId: 'test-session',
      worldId: 'test-world',
      characterId: 'test-character',
      type: 'character_event',
      title,
      content,
      significance,
      relatedEntities: [],
      metadata: { tags: [], automaticEntry: true }
    });
  }
};

// Add test entries
addTestEntry('Village Meeting', 'Attended the weekly village council meeting.', 'minor');
addTestEntry('Dragon Sighting', 'Spotted a dragon flying over the mountains!', 'major');
```