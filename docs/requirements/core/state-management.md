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
For detailed user stories, please see the [State Management User Stories CSV file](./state-management-user-stories.csv).

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