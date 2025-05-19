# GameSession Components

This folder contains the refactored GameSession components, which were split according to issue #361 to meet the project's file size constraints (<300 lines per file).

## Component Architecture

The GameSession has been refactored using the Container/Presenter pattern:

### Main Components

- **GameSession** (`GameSession.tsx`): The main container component that orchestrates state and child components
- **GameSessionActive** (`GameSessionActive.tsx`): Handles the active game session rendering
- **GameSessionError** (`GameSessionError.tsx`): Error state component
- **GameSessionLoading** (`GameSessionLoading.tsx`): Loading state component
- **PlayerChoices** (`PlayerChoices.tsx`): Renders and handles player choices
- **SessionControls** (`SessionControls.tsx`): Pause/Resume/End session controls

### Custom Hook

- **useGameSessionState** (`hooks/useGameSessionState.ts`): Encapsulates all state management logic

## Component Responsibilities

### GameSession
- Manages client-side rendering detection
- Handles accessibility features (focus management, screen reader announcements)
- Routes to appropriate state components (loading, error, active)
- Maintains component under 250 lines

### PlayerChoices
- Renders player choice buttons with radio button semantics
- Handles choice selection
- Supports disabled state
- Maintains proper accessibility attributes

### SessionControls
- Renders pause/resume/end buttons
- Handles session state transitions
- Provides visual feedback for current state

### State Components
- **GameSessionLoading**: Shows loading spinner with customizable message
- **GameSessionError**: Uses existing ErrorMessage component for consistency
- **GameSessionActive**: Combines narrative, choices, and controls

### useGameSessionState Hook
- Encapsulates all state management logic
- Handles polling for session state updates
- Manages pause/resume functionality
- Provides all handlers for user interactions

## Usage Example

```tsx
<GameSession 
  worldId="world-123"
  onSessionStart={() => console.log('Session started')}
  onSessionEnd={() => console.log('Session ended')}
/>
```

## Testing

Each component has:
- Unit tests in `.test.tsx` files
- Storybook stories in `.stories.tsx` files
- Integration tests in `__tests__/integration.test.tsx`

## Test Harness

A test harness is available at `/dev/game-session-components` for interactive testing of all components.

## Accessibility Features

- Proper ARIA labels and roles
- Focus management on state transitions
- Screen reader announcements for status changes
- Keyboard navigation support

## Future Improvements

- Context API for deeper component nesting
- Performance optimization for narrative rendering
- Enhanced loading states with progress indicators
- Additional accessibility improvements