# GameSession Components

This folder contains the game session components that were split up to keep files under 300 lines (issue #361). The main challenge was organizing complex state management and AI interactions into manageable pieces without losing the flow between components.

## How It's Organized

We're using a Container/Presenter pattern where the main GameSession component orchestrates everything, and smaller components handle specific responsibilities:

### Main Components

- **GameSession** (`GameSession.tsx`): The main container that orchestrates state and child components
- **ActiveGameSession** (`ActiveGameSession.tsx`): Handles the active game session with AI-driven narrative and choice generation
  - Manages `localSelectedChoiceId` state to track player choice selection and trigger narrative progression
- **GameSessionError** (`GameSessionError.tsx`): Error state component
- **GameSessionLoading** (`GameSessionLoading.tsx`): Loading state component
- **PlayerChoices** (`PlayerChoices.tsx`): Renders and handles player choices
- **JournalPage** (`src/components/Journal/JournalPage.tsx`): Dedicated journal page for reading session entries

### Custom Hook

- **useGameSessionState** (`hooks/useGameSessionState.ts`): Encapsulates all state management logic

## Component Responsibilities

### GameSession
The main container that:
- Manages client-side rendering detection
- Handles accessibility features (focus management, screen reader announcements)
- Routes to appropriate state components (loading, error, active)
- Keeps the component under 250 lines

### PlayerChoices
Handles player interaction by:
- Rendering choice buttons with radio button semantics
- Managing choice selection
- Supporting disabled states
- Maintaining proper accessibility attributes

### State Components
- **GameSessionLoading**: Shows loading spinner with customizable message
- **GameSessionError**: Uses existing ErrorMessage component for consistency
- **ActiveGameSession**: Enhanced active session component with integrated AI narrative generation and contextual choice systems

### useGameSessionState Hook
This hook encapsulates:
- All state management logic
- Polling for session state updates
- Pause/resume functionality
- All handlers for user interactions

## Usage Example

```tsx
<GameSession 
  worldId="world-123"
  onSessionStart={() => console.log('Session started')}
  onSessionEnd={() => console.log('Session ended')}
/>
```

## Testing

Each component is tested:
- Unit tests in `.test.tsx` files
- Storybook stories in `.stories.tsx` files
- Integration tests in `__tests__/integration.test.tsx`

## Test Harness

`ChoiceSelector.stories.tsx`, `GameSessionLoading.stories.tsx`, and `GameSessionError.stories.tsx` cover interactive testing of these components. The full session is still exercised live at `/dev/game-session`.

## Accessibility Features

- Proper ARIA labels and roles
- Focus management on state transitions
- Screen reader announcements for status changes
- Keyboard navigation support

## AI Choice Generation Features

The `ActiveGameSession` component includes some pretty sophisticated AI features:

### Core AI Features
- **Automated Choice Generation**: AI-powered player choices based on narrative context
- **Contextual Integration**: Choices reflect recent story segments and world themes
- **Smart Loading States**: Smooth transitions with "Generating your choices..." feedback
- **Error Recovery**: Graceful fallbacks when AI generation fails

### Technical Implementation
We're using:
- **Google Gemini AI**: Primary choice generation service
- **Context Assembly**: Recent narrative segments provide story context
- **Fallback System**: Pre-defined choices when AI is unavailable
- **State Management**: Integrated with narrativeStore and sessionStore

### User Experience
The system provides:
- **No Jarring Transitions**: Eliminated "choice flashing" through proper loading states
- **Contextual Choices**: AI generates options relevant to current story situation
- **Error Resilience**: System continues functioning even with AI service issues

## Journal System Integration

The GameSession includes a fully integrated journal system that handles persistent story tracking:

### Core Journal Features
- **Persistent Storage**: Journal entries persist across browser sessions using IndexedDB
- **Automatic Entry Creation**: AI-generated journal entries from narrative events
- **Dedicated Journal Page**: Full-page journal view with list-detail navigation and accessibility support
- **Entry Organization**: Entries grouped by type with significance indicators
- **Session Integration**: Journal access available during active gameplay

### Technical Implementation
- **Zustand Persistence**: Uses `journalStore` with IndexedDB adapter
- **AI Summarization**: Automatic journal entry generation from narrative segments
- **Performance**: Fast loading with synchronous data access

### How It Works
- Journal button appears when character is present
- Click to open the journal page showing all session entries
- Entries automatically created during story progression
- Data persists across browser refreshes and sessions

## Future Improvements

We're considering:
- Context API for deeper component nesting
- Performance optimization for narrative rendering
- Enhanced loading states with progress indicators
- Additional accessibility improvements
- Character integration for personalized choice generation (linked to issues #116, #118, #121, #123, #124, #251)
- Journal entry filtering and search functionality
