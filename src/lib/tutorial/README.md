# Tutorial System

The tutorial system provides guided tours and contextual help for Narraitor users.

## Architecture

- **State**: Managed by `sessionStore.tutorialProgress` (Zustand). Persisted via IndexedDB.
- **Tours**: Powered by `react-joyride`. Definitions in `src/lib/tutorial/*.ts`.
- **Provider**: `TutorialProvider` manages tour state and synchronization.
- **UI**: 
  - `TutorialProgressWidget`: Shows status when paused.
  - `TutorialMenu`: Allows resetting/restarting.
  - `TutorialHint`: Inline dismissible hints.

## Adding a New Tour

1. Create a tour definition file in `src/lib/tutorial/myNewTour.ts`.
2. Define steps using `Step[]` from `react-joyride`.
3. Add `TutorialPhase` type in `src/types/tutorial.types.ts`.
4. Update `loadTour` in `src/components/TutorialProvider/TutorialProvider.tsx`.
5. Trigger it using `startTour('myNewTour')`.

## Wizard Synchronization

For wizard-based tours, define a `tourStepToWizardStep` mapping.
This ensures the tour waits for the wizard to be on the correct step before showing the tooltip.

```typescript
export const tourStepToWizardStep: Record<number, number> = {
  // Tour Step Index : Wizard Step Index
  0: 0,
  1: 1,
};
```
