# Auto-Save Feature Testing Guide

## Issue #233 Implementation Verification

This guide provides step-by-step manual testing procedures to verify the auto-save functionality works correctly.

## Prerequisites
1. Start the development server: `npm run dev`
2. Ensure you have a test world and character created
3. Open browser developer tools (Console tab) to monitor auto-save logs

## Test Scenarios

### 1. Periodic Auto-Save (5-minute intervals)
**Expected Behavior**: Game automatically saves every 5 minutes during active gameplay

**Steps**:
1. Navigate to `/play` and start a game session
2. Wait in an active game for 5+ minutes
3. Check console logs for auto-save notifications
4. Verify save indicator shows "Saved at [timestamp]"

**Acceptance Criteria**:
- ✅ Auto-save triggers every 5 minutes
- ✅ Save indicator updates with timestamp
- ✅ No error messages in console
- ✅ Game continues without interruption

### 2. Event-Based Auto-Save (Player Choices)
**Expected Behavior**: Game saves after significant events like player choices

**Steps**:
1. Start a game session with choices available
2. Make a choice selection
3. Observe immediate save indicator activity
4. Check console for "player-choice" save trigger

**Acceptance Criteria**:
- ✅ Save triggers immediately after choice selection
- ✅ Save indicator shows "Saving..." then "Saved at [timestamp]"
- ✅ Save reason logged as "player-choice"

### 3. Event-Based Auto-Save (Scene Changes)
**Expected Behavior**: Game saves when narrative scenes change

**Steps**:
1. Progress through narrative that triggers scene changes
2. Observe save indicator during scene transitions
3. Check console for "scene-change" save trigger

**Acceptance Criteria**:
- ✅ Save triggers on scene changes
- ✅ Save indicator updates appropriately
- ✅ Save reason logged as "scene-change"

### 4. Manual Save Functionality
**Expected Behavior**: Players can trigger manual saves via Save Indicator

**Steps**:
1. Locate the Save Indicator in the game UI
2. Click "Save Now" button
3. Observe immediate save activity
4. Check console for "manual" save trigger

**Acceptance Criteria**:
- ✅ Manual save executes immediately
- ✅ Button shows "Saving..." state during operation
- ✅ Save completes with success indication
- ✅ Save reason logged as "manual"

### 5. Large State Optimization
**Expected Behavior**: System handles large game states efficiently

**Steps**:
1. Create a game session with extensive narrative history
2. Add multiple journal entries and character interactions
3. Trigger a save operation
4. Check console for compression/optimization logs

**Acceptance Criteria**:
- ✅ Large states (>100KB) trigger optimization
- ✅ Save completes within reasonable time (< 2 seconds)
- ✅ Console shows optimization activity if applicable
- ✅ No memory or performance issues

### 6. Error Handling and Recovery
**Expected Behavior**: System gracefully handles save failures with retry logic

**Steps**:
1. Simulate save failure (temporarily disable IndexedDB in DevTools)
2. Attempt save operation
3. Observe error handling and retry attempts
4. Re-enable IndexedDB and verify recovery

**Acceptance Criteria**:
- ✅ Error messages are user-friendly
- ✅ Retry logic attempts with exponential backoff
- ✅ Save indicator shows error state clearly
- ✅ Manual retry option available
- ✅ System recovers when storage becomes available

### 7. Auto-Save Enable/Disable
**Expected Behavior**: Players can control auto-save settings

**Steps**:
1. Locate auto-save settings in game
2. Disable auto-save functionality
3. Verify periodic saves stop
4. Re-enable and verify saves resume

**Acceptance Criteria**:
- ✅ Auto-save can be disabled
- ✅ Periodic saves stop when disabled
- ✅ Manual saves still work when auto-save disabled
- ✅ Re-enabling restarts auto-save service

### 8. Save Status Tracking
**Expected Behavior**: System tracks and displays save history

**Steps**:
1. Perform multiple save operations
2. Check save counter in UI
3. Verify last save timestamp accuracy
4. Review save history persistence

**Acceptance Criteria**:
- ✅ Save counter increments with each save
- ✅ Last save timestamp displays correctly
- ✅ Save status persists across page refreshes
- ✅ Multiple save operations tracked accurately

## Test Results Log

### Test Session: [Date/Time]
**Tester**: _____________
**Environment**: Development/Production
**Browser**: _____________

| Test Scenario | Status | Notes |
|---------------|--------|-------|
| Periodic Auto-Save | ⭕ | |
| Player Choice Save | ⭕ | |
| Scene Change Save | ⭕ | |
| Manual Save | ⭕ | |
| Large State Optimization | ⭕ | |
| Error Handling | ⭕ | |
| Enable/Disable | ⭕ | |
| Status Tracking | ⭕ | |

**Legend**: ✅ Pass | ❌ Fail | ⭕ Not Tested

## Common Issues & Troubleshooting

### Auto-Save Not Triggering
- Check browser console for JavaScript errors
- Verify IndexedDB is enabled in browser
- Ensure game session is in 'active' status

### Save Indicator Not Updating
- Check if auto-save is enabled in settings
- Verify component is receiving store updates
- Check for React state update errors

### Performance Issues
- Monitor save operation duration in console
- Check for memory leaks in DevTools
- Verify large state optimization is working

## Developer Notes

### Console Logging
The auto-save system provides detailed console logging:
- `[AutoSaveService]` - Service-level operations
- Save triggers show reason: periodic/player-choice/scene-change/manual
- Error messages include user-friendly descriptions
- Performance metrics logged for optimization

### Store Integration
Auto-save integrates with multiple Zustand stores:
- Session Store: Auto-save state and settings
- World Store: World data for saves
- Character Store: Character data for saves  
- Narrative Store: Story progress and segments
- Journal Store: Player journal entries

### Testing Components
Key components involved in testing:
- `SaveIndicator`: UI component showing save status
- `useAutoSave`: React hook providing auto-save functionality
- `AutoSaveService`: Core service handling save operations
- `ActiveGameSession`: Main game component with auto-save integration