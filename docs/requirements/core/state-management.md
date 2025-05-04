---
title: State Management Requirements
aliases: [Game State Requirements, Persistence Requirements]
tags: [narraitor, requirements, state-management]
created: 2025-04-29
updated: 2025-04-29
---

# State Management Requirements

## Overview
The State Management system handles the persistence, retrieval, and organization of game state data across all Narraitor systems. It provides a unified approach to state manipulation with domain-specific reducers, type-safe operations, and reliable storage using IndexedDB.

## Core Functionality
- **State Storage**: Persist application state between sessions
- **State Retrieval**: Load saved state when resuming sessions
- **Domain-Specific Reducers**: Manage state updates for each domain
- **Type-Safe Operations**: Ensure data integrity through strong typing
- **Campaign Management**: Support basic game sessions tracking
- **Error Recovery**: Handle storage failures gracefully
- **Auto-Save**: Automatically save state at intervals and key events

## Data Model

```typescript
interface AppState {
  worlds: WorldState;
  characters: CharacterState;
  narrative: NarrativeState;
  journal: JournalState;
  ui: UIState;
  session: SessionState;
  config: ConfigState;
  debug?: DebugState;
  meta: MetaState;
}

interface WorldState {
  worlds: Record<string, World>;
  activeWorldId: string | null;
}

interface CharacterState {
  characters: Record<string, Character>;
  activeCharacterId: string | null;
  charactersByWorld: Record<string, string[]>;
  characterCreationProgress?: Partial<Character>;
}

interface NarrativeState {
  narrativesBySession: Record<string, NarrativeSession>;
  activeNarrativeSessionId: string | null;
  narrativeBuffer?: NarrativeHistoryEntry[];
  pendingDecision?: PlayerDecision;
}

interface JournalState {
  entries: Record<string, JournalEntry>;
  entriesBySession: Record<string, string[]>;
}

interface UIState {
  activePage: string;
  modal: {
    isOpen: boolean;
    type: string | null;
    data: any;
  };
  sidebar: {
    isOpen: boolean;
    width: number;
    activeTab?: string;
  };
  theme: Theme;
  loadingStates: Record<string, boolean>;
  errors: Record<string, ErrorInfo>;
}

interface SessionState {
  activeCampaignId: string | null;
  campaigns: Record<string, Campaign>;
  lastSaved: number;
  autoSaveInterval: number;
}

interface ConfigState {
  aiService: {
    provider: string;
    apiKey: string;
    modelName: string;
    temperatureSettings: {
      narrative: number;
      decisions: number;
    };
  };
  system: {
    darkMode: boolean;
    fontSize: number;
    animationsEnabled: boolean;
    debugModeEnabled: boolean;
  };
}

interface DebugState {
  enabled: boolean;
  actionLog: ActionLogEntry[];
  errorLog: ErrorLogEntry[];
  lastDispatchTime: number;
}

interface MetaState {
  version: string;
  lastUpdated: number;
  initTime: number;
  schemaVersion: number;
}

interface Campaign {
  id: string;
  name: string;
  worldId: string;
  characterId: string;
  createdAt: number;
  lastPlayedAt: number;
  narrativeSessionIds: string[];
}

// Standard action pattern
type Action<T extends string, P = void> = P extends void
  ? { type: T }
  : { type: T; payload: P };
```

## User Interactions
- Users create new campaigns or continue existing ones
- Users benefit from automatic saving at key points
- Users receive feedback on save operations
- Users recover from interrupted sessions

## Integration Points
- **World System**: Manages world configuration state
- **Character System**: Manages character data state
- **Narrative Engine**: Manages narrative progression state
- **Journal System**: Manages journal entry state
- **UI Components**: Consume state via hooks and context
- **Debug Tools**: Provides state inspection and manipulation

## MVP Scope Boundaries

### Included
- Core state management implementation with:
  - React Context + useReducer pattern for all domains
  - Typed actions and payloads
  - Immutable state updates
  - Selector functions for basic data access
  - Error boundary handling
- IndexedDB persistence layer with:
  - Auto-save every 5 minutes during active play
  - Auto-save after major events (decisions, scene changes)
  - Asynchronous operations with status tracking
- Basic campaign management with:
  - Create new campaigns
  - List existing campaigns
  - Load saved campaigns
  - Delete campaigns with confirmation
  - Basic campaign metadata (last played date)
- Error handling with:
  - Storage failure detection
  - Automatic retry logic
  - User-friendly error messages
  - Fallback to memory-only state when storage unavailable
  - Recovery from interrupted saves
- State hooks for components:
  - useWorld() - Access world state
  - useCharacter() - Access character state
  - useNarrative() - Access narrative state
  - useJournal() - Access journal state
  - useSession() - Access session state
  - useConfig() - Access configuration state
- DevTools integration to expose helpful info/debug tools (development mode only)

### Excluded from MVP
- State versioning for data migrations
- Database schema versioning
- Import/Export functionality for game data
- Advanced campaign management features:
  - Campaign progress tracking
  - Play time tracking
  - Campaign tags
  - Campaign status management
  - Current location tracking
- Detailed state optimization:
  - State compression
  - Storage quota management
  - State pruning
- Advanced state debugging features:
  - State change history
  - State inspection panel
  - Performance metrics
- User preferences persistence
- Multiple save slots per campaign
- Cloud synchronization of game data
- Multi-device synchronization
- Advanced state migration tools with UI
- State conflict resolution UI
- Session recording/replay functionality
- Advanced analytics on game state
- Automated state backup scheduling
- Custom storage location options
- Save state screenshots
- Detailed save state descriptions
- Save state ratings or favoriting
- Manual save option
- Emergency state export when persistence fails

## User Stories

1. **Campaign Management**
- As a player, I want to create a new campaign with a selected world and character so I can start a new story

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a player, I want to continue an existing campaign so I can resume my story where I left off

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a player, I want to delete campaigns I'm no longer interested in so I can keep my campaign list organized

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. Users can initiate the creation of a new campaign, linking a selected world and character.
  2. Existing campaigns are listed, showing basic metadata (name, world, character, last played).
  3. Users can select an existing campaign to load its state and resume play.
  4. Users can delete a campaign after confirming the action in a dialog.

2. **State Persistence**
- As a player, I want my game state to automatically save during play so I don't lose progress if my browser crashes

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a player, I want to be notified when my game is saved so I know my progress is secure

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a player, I want to safely resume interrupted sessions so no progress is lost

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. The application state (including world, character, narrative, journal, etc.) is automatically saved to IndexedDB every 5 minutes during active gameplay.
  2. State is automatically saved after significant events like player decisions or scene changes.
  3. A visual indicator confirms successful save operations.
  4. Upon reloading the application after a crash or closure, the most recent saved state for the active campaign is automatically loaded.

3. **Error Recovery**
- As a player, I want the system to handle storage failures gracefully so my experience isn't disrupted

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a player, I want to recover from browser crashes without losing significant progress

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [ ] Medium
   - [x] Large

- As a player, I want clear error messages that help me understand and resolve issues

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. The system detects failures during IndexedDB read/write operations.
  2. If storage fails, the system attempts retries before notifying the user.
  3. User-friendly error messages are displayed, explaining the issue without technical jargon.
  4. When applicable, error messages include suggested actions for resolution.

4. **Development Support**
- As a developer, I want to debug and inspect application state during development

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a developer, I want to track state changes to understand the effects of actions

   ## Priority
   - [ ] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [x] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a developer, I want type-safe state operations to prevent data integrity issues

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. DevTools expose the current application state via a UI panel in development mode.
  2. The state tree can be inspected to view nested objects and arrays.
  3. State changes are tracked and displayed via the DevTools (if included in MVP).
  4. Domain reducers are fully typed with TypeScript, enforcing type safety for all state operations.
  5. Custom hooks (`useWorld()`, `useCharacter()`, etc.) provide typed access to specific state slices.

## GitHub Issues
- [Implement domain-specific reducers for all systems] - Link to GitHub issue
- [Create IndexedDB persistence layer with auto-save] - Link to GitHub issue
- [Build basic campaign management functionality] - Link to GitHub issue
- [Develop error recovery mechanisms for storage failures] - Link to GitHub issue
- [Create component hooks for state access] - Link to GitHub issue
- [Implement error recovery for interrupted sessions] - Link to GitHub issue
- [Build visual feedback for save operations] - Link to GitHub issue
- [Implement DevTools integration for state system] - Link to GitHub issue

## BootHillGM Reference Code
- The campaign state management in `/app/components/CampaignStateManager.tsx` offers a proven approach to managing game campaigns
- The state provider pattern in `/app/context/GameStateProvider.tsx` demonstrates effective context-based state management
- The error recovery in `/app/components/GameSessionContent.tsx` shows robust error handling for state failures
- The reducer implementation in `/app/reducers/rootReducer.ts` provides a pattern for organizing domain-specific reducers
- The game actions adapter in `/app/reducers/gameActionsAdapter.ts` shows how to create type-safe action handling

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
