# Option 1 Fix Implementation Results

**Date**: 2026-01-28
**Approach**: onReady callback with DOM readiness check
**Status**: ❌ **FAILED - Race condition persists**

## Changes Made

### 1. CharacterCreationWizard.tsx
- Added `onReady?: () => void` prop
- Added `templateSelectorRef` to track template selector DOM element
- Added `domReady` state to track when DOM is fully painted
- Implemented `requestAnimationFrame` loop to check element dimensions before calling `setCurrentWizardStep`
- Only syncs wizard step with tutorial provider after DOM is ready

### 2. TutorialProvider.tsx
- Enhanced retry logic to check element dimensions and visibility, not just existence
- Changed from `if (element)` to checking `rect.width > 0 && rect.height > 0` and visibility styles

### 3. page.tsx
- Added `onReady` callback to CharacterCreationWizard (logs "ready" message)

## Test Results

### What Works ✅
- QuickStart steps 0-2 work perfectly
- Tour starts correctly
- DOM readiness check runs (confirmed by console log "CharacterCreationWizard ready for tutorial")
- Template selector element exists and has proper dimensions

### What Fails ❌
- **Tour does not advance from step 2 to step 3**
- Tooltip remains stuck showing "Want more control? Create a custom character from scratch" (step 2 content)
- Wizard loads correctly but tour doesn't sync with it
- No "Tutorial missing target timeout" error appears in console (retry logic may not be triggering)

### Console Output
```
[WARNING] Target not mounted (3 occurrences)
[LOG] CharacterCreationWizard ready for tutorial (logged twice)
```

## Root Cause Analysis

The fix attempted to solve the race condition by:
1. Waiting for DOM to be painted (checking element dimensions)
2. Only calling `setCurrentWizardStep` after DOM is ready

However, this approach has **fundamental flaws**:

### Flaw 1: Tour State Confusion
When the user clicks "Create Custom Character":
- Tour is on step 2 (QuickStart custom button)
- QuickStart unmounts (step 2 target disappears)
- Wizard mounts but delays calling `setCurrentWizardStep`
- **Tour is stuck on step 2 with no valid target**
- Even when wizard becomes ready, tour is in an invalid state

### Flaw 2: Timing Dependencies
The approach relies on perfect timing coordination between:
- React rendering cycle
- Joyride's internal mounting logic
- TutorialProvider's step synchronization
- CharacterCreationWizard's readiness signal

This is too fragile and prone to race conditions.

### Flaw 3: onReady Fires Multiple Times
Console shows "CharacterCreationWizard ready for tutorial" logged twice, suggesting:
- Effect is running multiple times
- May be creating conflicting state updates
- Timing becomes unpredictable

## Why This Approach Failed

**The core issue**: Delaying `setCurrentWizardStep` creates a gap where the tour is on step 2 but the QuickStart component (step 2's target) no longer exists. Joyride enters an error state and doesn't know how to recover.

The improved retry logic (checking dimensions) helps, but **doesn't address the fundamental state machine problem**: the tour needs to transition smoothly from step 2 → step 3 as a single atomic operation, not as separate delayed operations.

## Alternative Approaches to Consider

### Option 2 (Revised): Explicit Tour Pause/Resume
Instead of delaying `setCurrentWizardStep`, explicitly pause the tour during page transitions:

```typescript
// In page.tsx handleCustomizeClick
const handleCustomizeClick = () => {
  // Pause tour before unmounting QuickStart
  pauseTour('wizard-transition');
  setShowQuickStart(false);
};

// In CharacterCreationWizard onReady
onReady={() => {
  // Resume tour after wizard is fully ready
  resumeTour();
}}
```

**Pros**:
- Tour state is explicitly managed
- No ambiguity about what step the tour should be on
- Joyride won't try to mount until explicitly resumed

**Cons**:
- Requires exposing `pauseTour` and `resumeTour` from TutorialProvider
- More complex state management

### Option 3: Increase Retry Timeout
Simply give the retry logic more time:

```typescript
const maxRetries = 80; // 20 seconds instead of 10
const retryInterval = 250; // Keep 250ms intervals
```

**Pros**:
- Minimal code changes
- May work on slower devices/networks

**Cons**:
- Doesn't address root cause
- Users wait longer for failures
- Band-aid solution

### Option 4: Synchronous Step Transition
Call `setCurrentWizardStep(0)` BEFORE the wizard mounts, then use a flag to prevent Joyride from trying to mount until DOM is ready:

```typescript
// Before setShowQuickStart(false)
setCurrentWizardStep(0); // Sync step immediately

// In TutorialProvider
if (stepIndex === 3 && !wizardReady) {
  // Don't run Joyride yet
  return null;
}
```

**Pros**:
- Tour step syncs immediately
- Prevents Joyride from mounting prematurely

**Cons**:
- Requires new "wizardReady" state in TutorialProvider
- More complex conditional rendering

## Recommended Next Step

**Try Option 2 (Explicit Pause/Resume)** because:
1. It addresses the root cause (tour state confusion during transitions)
2. It's explicit and predictable
3. It follows the pattern already used for "end-of-page" transitions
4. The TutorialProvider already has `pauseTour` and `resumeTour` functions

## Files Modified (Need to Revert or Refine)
- `/src/components/CharacterCreationWizard/CharacterCreationWizard.tsx`
- `/src/components/TutorialProvider/TutorialProvider.tsx`
- `/src/app/characters/create/page.tsx`

## Time Spent
- Implementation: 1.5 hours
- Testing: 30 minutes
- **Total: 2 hours**

## Conclusion

Option 1 (onReady with DOM readiness) **does not solve the race condition**. The approach is fundamentally flawed because it creates a gap where the tour is in an invalid state.

**Recommendation**: Proceed with Option 2 (Explicit Pause/Resume) which directly addresses the state management issue.
