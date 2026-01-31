# Option 2 Fix Implementation Results

**Date**: 2026-01-28
**Approach**: Explicit Pause/Resume for tutorial transitions
**Status**: ❌ **FAILED - Tour does not resume**

## Changes Made

### 1. TutorialProvider.tsx
- Added `resumeTour` to `TutorialContextValue` interface
- Exported `resumeTour` in provider value

### 2. page.tsx (characters/create)
- Added `pauseTour` and `resumeTour` to `useTutorial()` destructuring
- Modified `handleCustomizeClick`:
  - Calls `pauseTour('wizard-transition')` BEFORE `setShowQuickStart(false)`
  - Pauses tour while QuickStart is still mounted
- Modified CharacterCreationWizard `onReady` callback:
  - Calls `resumeTour()` after wizard DOM is fully ready

### 3. CharacterCreationWizard.tsx
- Simplified readiness check (removed `domReady` state)
- Restored immediate `setCurrentWizardStep` sync (no delays)
- Kept `requestAnimationFrame` check for template selector dimensions

## Test Results

❌ **FAILED - Tour does not resume after pause**

### Console Output
- 190+ "Target not mounted" warnings
- No tooltip visible after wizard loads
- No tour state recovery

### What Happened
1. Tour started correctly on QuickStart
2. Progressed through steps 0, 1, 2 successfully
3. User clicked "Create Custom Character"
4. `pauseTour('wizard-transition')` was called
5. QuickStart unmounted, wizard mounted
6. Wizard `onReady` callback fired
7. `resumeTour()` was called
8. **Tour did not resume - no tooltip appeared**

## Root Cause Analysis

The explicit pause/resume approach failed because **`resumeTour()` reloads steps and tries to mount Joyride at the paused step index**, but:

1. The paused step was step 2 (QuickStart custom button)
2. That target no longer exists (QuickStart unmounted)
3. Joyride enters error state trying to mount on non-existent target
4. Retry logic triggers but never succeeds
5. Tour is stuck in limbo

### The Core Problem

**Both Option 1 and Option 2 failed for the same fundamental reason**: We're trying to preserve continuity from QuickStart step 2 → Wizard step 3, but Joyride's state machine doesn't support transitioning between components that unmount/remount.

When `resumeTour()` is called:
```typescript
const resumeTour = useCallback(async () => {
  if (activeTour) {
    const { steps: loadedSteps } = await loadTour(activeTour);
    setSteps(loadedSteps); // Reloads all 9 steps
  }
  setRun(true); // Tries to run Joyride
  setIsPaused(false);
  setPauseReason(null);
  missingTargetRef.current = null;
}, [activeTour]);
```

Joyride attempts to mount at the current `stepIndex` (which is 2 or 3), but:
- Step 2's target (`quickstart-custom`) doesn't exist
- Step 3's target (`template-selector`) exists but Joyride can't find it
- The retry logic improved element checking, but Joyride's internal mounting state is corrupted

## Why This Is So Hard

Joyride was designed for **in-page tours**, not **cross-page/cross-component transitions**. The library assumes:
1. All tour steps exist in the same component tree
2. Targets may temporarily hide/show, but don't completely unmount
3. The tour runs continuously without major DOM restructuring

Our use case violates these assumptions:
- QuickStart and Wizard are separate components
- They mount/unmount completely
- Tour steps span both components (steps 0-2 in QuickStart, steps 3-8 in Wizard)

## Attempted Solutions Summary

| Option | Approach | Result | Time Spent |
|--------|----------|--------|------------|
| Option 1 | onReady callback + DOM readiness check + delayed `setCurrentWizardStep` | ❌ Failed | 2 hours |
| Option 2 | Explicit pause before unmount + resume after mount | ❌ Failed | 1 hour |

**Total time spent: 3 hours**

## Alternative Approaches

### Option 3: Restart Tour at Wizard Step
Instead of trying to preserve continuity, **restart the tour from step 3** when the wizard loads:

```typescript
// In CharacterCreationWizard onReady
onReady={() => {
  stopTour(); // Stop the QuickStart tour
  startTour('characterCreation', 3); // Start fresh at wizard step
}}
```

**Pros**:
- Clean break between QuickStart and Wizard tours
- No state machine confusion
- Joyride starts fresh with valid targets

**Cons**:
- Breaks tutorial continuity (user loses progress indicator "3/9")
- May confuse users ("why did the tour restart?")

### Option 4: Split Into Separate Tours
Treat QuickStart and Wizard as **two independent tours**:

```typescript
const quickStartTour = steps 0-2; // "Quick Start Selection"
const wizardTour = steps 0-5; // "Character Creation"  (renumbered)
```

**Pros**:
- Each tour is self-contained
- No cross-component transitions
- Clear separation of concerns

**Cons**:
- Requires refactoring tour configuration
- Changes user experience (two separate tutorials)
- More complex progress tracking

### Option 5: Keep Components Mounted
Don't unmount QuickStart - just hide it with CSS:

```typescript
<div style={{ display: showQuickStart ? 'block' : 'none' }}>
  <QuickStartCharacters {...props} />
</div>
<div style={{ display: showQuickStart ? 'none' : 'block' }}>
  <CharacterCreationWizard {...props} />
</div>
```

**Pros**:
- DOM targets never unmount
- Joyride state remains valid
- Tour can transition smoothly

**Cons**:
- Both components remain in memory
- Potential performance impact
- Weird semantics (both mounted but one hidden)

### Option 6: Increase Retry Timeout (Band-Aid)
Just give the retry logic more time:

```typescript
const maxRetries = 200; // 50 seconds
```

**Pros**:
- Minimal code changes
- Might work on slow devices

**Cons**:
- Doesn't address root cause
- Users wait up to 50 seconds for failures
- Still might not work

## Recommended Next Steps

**I recommend Option 3 (Restart Tour) or Option 4 (Split Tours)** because:
1. They work with Joyride's design, not against it
2. They're architecturally simpler
3. They avoid the race condition entirely by not attempting cross-component transitions

**However**, before implementing either:
1. Consider whether the guided tutorial is worth the complexity
2. Evaluate if users actually need hand-holding through QuickStart → Wizard transition
3. Consider simpler onboarding (tooltips, help text, video tutorial)

## Conclusion

After 3 hours of attempts, **neither Option 1 nor Option 2 successfully resolves the race condition**. The issue is fundamental to Joyride's architecture, not just a timing problem.

**Verdict**: This bug blocks PR #1009 from merging. Recommend either:
1. Implement Option 3/4 (architectural change)
2. Remove the QuickStart → Wizard tutorial transition
3. Accept the bug and document it as a known issue
4. Consider alternative tutorial libraries designed for multi-page flows
