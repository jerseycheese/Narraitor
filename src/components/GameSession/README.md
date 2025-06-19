# GameSession Components

This folder contains the refactored GameSession components, which were split according to issue #361 to meet the project's file size constraints (<300 lines per file).

## Component Architecture

The GameSession has been refactored using the Container/Presenter pattern:

### Main Components

- **GameSession** (`GameSession.tsx`): The main container component that orchestrates state and child components
- **ActiveGameSession** (`ActiveGameSession.tsx`): Handles the active game session with AI-driven narrative and choice generation
  - Manages `localSelectedChoiceId` state to track player choice selection and trigger narrative progression
- **GameSessionError** (`GameSessionError.tsx`): Error state component
- **GameSessionLoading** (`GameSessionLoading.tsx`): Loading state component
- **PlayerChoices** (`PlayerChoices.tsx`): Renders and handles player choices
- **SessionControls** (`SessionControls.tsx`): Pause/Resume/End session controls
- **JournalModal** (`JournalModal.tsx`): Displays persistent journal entries with accessibility features

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
- **ActiveGameSession**: Enhanced active session component with integrated AI narrative generation and contextual choice systems

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

## AI Choice Generation Features

The `ActiveGameSession` component includes:

### Core AI Features
- **Automated Choice Generation**: AI-powered player choices based on narrative context
- **Contextual Integration**: Choices reflect recent story segments and world themes
- **Smart Loading States**: Smooth transitions with "Generating your choices..." feedback
- **Error Recovery**: Graceful fallbacks when AI generation fails

### Technical Implementation
- **Google Gemini AI**: Primary choice generation service
- **Context Assembly**: Recent narrative segments provide story context
- **Fallback System**: Pre-defined choices when AI is unavailable
- **State Management**: Integrated with narrativeStore and sessionStore

### User Experience
- **No Jarring Transitions**: Eliminated "choice flashing" through proper loading states
- **Contextual Choices**: AI generates options relevant to current story situation
- **Error Resilience**: System continues functioning even with AI service issues

## Journal System Integration

The GameSession includes a fully integrated journal system that:

### Core Journal Features
- **Persistent Storage**: Journal entries persist across browser sessions using IndexedDB
- **Automatic Entry Creation**: AI-generated journal entries from narrative events
- **Modal Interface**: Accessible journal modal with proper ARIA attributes, including full keyboard navigation and screen reader support
- **Entry Organization**: Entries grouped by type with significance indicators
- **Session Integration**: Journal access available during active gameplay

### Technical Implementation
- **Zustand Persistence**: Uses `journalStore` with IndexedDB adapter
- **AI Summarization**: Automatic journal entry generation from narrative segments
- **Performance**: Fast loading with synchronous data access

### Usage
- Journal button appears when character is present
- Click to open modal showing all session entries
- Entries automatically created during story progression
- Data persists across browser refreshes and sessions

## Future Improvements

- Context API for deeper component nesting
- Performance optimization for narrative rendering
- Enhanced loading states with progress indicators
- Additional accessibility improvements
- Character integration for personalized choice generation (linked to issues #116, #118, #121, #123, #124, #251)
- Journal entry filtering and search functionality