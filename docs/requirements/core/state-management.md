---
title: State Management Requirements
aliases: [Game State Requirements, Persistence Requirements]
tags: [narraitor, requirements, state-management]
created: 2025-04-29
updated: 2025-04-29
---

# State Management Requirements

## Overview
The State Management system handles the persistence, retrieval, and organization of game state data across all NarrAItor systems. It provides a unified approach to state manipulation with domain-specific reducers, type-safe operations, and reliable storage using IndexedDB.

## Core Functionality
- **State Storage**: Persist application state between sessions
- **State Retrieval**: Load saved state when resuming sessions
- **Domain-Specific Reducers**: Manage state updates for each domain
- **Type-Safe Operations**: Ensure data integrity through strong typing
- **Campaign Management**: Support multiple independent game campaigns
- **Import/Export**: Enable backup and sharing of game data
- **Error Recovery**: Handle storage failures gracefully
- **State Optimization**: Manage state size to prevent performance issues
- **Auto-Save**: Automatically save state at intervals and key events
- **State Versioning**: Handle schema changes and migrations
- **State Debugging**: Tools for inspecting and troubleshooting state
- **Progress Tracking**: Track and display campaign progress
- **Safe Resume**: Recover from interrupted sessions safely

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
  inventory?: InventoryState;
  meta: MetaState;
}

interface WorldState {
  worlds: Record<string, World>;
  activeWorldId: string | null;
  worldTemplates: Record<string, World>;
  lastEdited?: string | null;
}

interface CharacterState {
  characters: Record<string, Character>;
  activeCharacterId: string | null;
  charactersByWorld: Record<string, string[]>;
  characterCreationProgress?: Partial<Character>;
  lastEdited?: string | null;
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
  lastViewedTimestamp: number;
  unreadCount: number;
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
  alerts: Alert[];
  theme: Theme;
  loadingStates: Record<string, boolean>;
  errors: Record<string, ErrorInfo>;
  preferences: UserPreferences;
}

interface SessionState {
  activeCampaignId: string | null;
  campaigns: Record<string, Campaign>;
  lastSaved: number;
  savingEnabled: boolean;
  autoSaveInterval: number;
  saveHistory: SaveHistoryEntry[];
  playStats: PlayStatistics;
}

interface ConfigState {
  aiService: {
    provider: string;
    apiKey: string;
    modelName: string;
    temperatureSettings: {
      narrative: number;
      decisions: number;
      summaries: number;
      character: number;
    };
  };
  system: {
    darkMode: boolean;
    fontSize: number;
    animationsEnabled: boolean;
    debugModeEnabled: boolean;
    storageQuota: {
      max: number;
      used: number;
    };
  };
  persistenceConfig: {
    autoSaveIntervalMs: number;
    maxSaveHistoryEntries: number;
    compressionEnabled: boolean;
    cleanupThreshold: number;
  };
}

interface InventoryState {
  inventoriesByCharacter: Record<string, Inventory>;
  activeInventoryId: string | null;
}

interface DebugState {
  enabled: boolean;
  stateHistory: StateHistoryEntry[];
  actionLog: ActionLogEntry[];
  errorLog: ErrorLogEntry[];
  performanceMetrics: PerformanceMetrics;
  lastDispatchTime: number;
}

interface MetaState {
  version: string;
  lastUpdated: number;
  initTime: number;
  schemaVersion: number;
  deviceId: string;
}

interface Campaign {
  id: string;
  name: string;
  worldId: string;
  characterId: string;
  description: string;
  createdAt: number;
  lastPlayedAt: number;
  playTime: number;
  status: 'active' | 'completed' | 'abandoned';
  narrativeSessionIds: string[];
  saveCount: number;
  currentLocation?: string;
  progress?: CampaignProgress;
  tags?: string[];
}

interface SaveHistoryEntry {
  id: string;
  timestamp: number;
  campaignId: string;
  description: string;
  type: 'auto' | 'manual' | 'checkpoint';
  stateSize: number;
}

interface PlayStatistics {
  totalPlayTime: number;
  campaignPlayTimes: Record<string, number>;
  sessionsPlayed: number;
  decisionsCount: number;
  worldsCreated: number;
  charactersCreated: number;
}

interface CampaignProgress {
  storyProgress: number;
  discoveredLocations: string[];
  completedEvents: string[];
  metNPCs: string[];
  achievedMilestones: string[];
}

interface StateHistoryEntry {
  timestamp: number;
  action: string;
  stateDiff: any;
  stateSize: number;
}

// Standard action pattern
type Action<T extends string, P = void> = P extends void
  ? { type: T }
  : { type: T; payload: P };
```

## User Interactions
- Users create new campaigns or continue existing ones
- Users save their game progress manually
- Users benefit from automatic saving at key points
- Users import and export game data
- Users delete unwanted campaigns
- Users navigate between multiple campaigns
- Users recover from interrupted sessions
- Users view campaign progress information
- Users receive feedback on save operations
- Users can roll back to previous save points (post-MVP)
- Users can debug state issues (development mode only)

## Integration Points
- **World System**: Manages world configuration state
- **Character System**: Manages character data state
- **Narrative Engine**: Manages narrative progression state
- **Journal System**: Manages journal entry state
- **UI Components**: Consume state via hooks and context
- **Inventory System**: Manages character inventory (post-MVP)
- **Debug Tools**: Provides state inspection and manipulation

## MVP Scope Boundaries

### Included
- Complete state management implementation with:
  - React Context + useReducer pattern for all domains
  - Typed actions and payloads
  - Immutable state updates
  - Selector functions for derived data
  - State validation middleware
  - Error boundary handling
- IndexedDB persistence layer with:
  - Auto-save every 5 minutes during active play
  - Auto-save after major events (decisions, scene changes)
  - Manual save option
  - State versioning for data migrations
  - Database schema versioning
  - 50MB storage quota management
  - Asynchronous operations with status tracking
- Campaign management with:
  - Create new campaigns
  - List existing campaigns
  - Load saved campaigns
  - Delete campaigns with confirmation
  - Campaign metadata (play time, last played date)
  - Basic progress tracking
- Export/Import functionality for:
  - Full game data backup as JSON
  - Individual campaign export/import
  - World configuration export/import
  - Error handling for invalid imports
- Error handling with:
  - Storage failure detection
  - Automatic retry logic
  - User-friendly error messages
  - Fallback to memory-only state when storage unavailable
  - Emergency state export when persistence fails
  - Recovery from interrupted saves
- State hooks for components:
  - useWorld() - Access world state
  - useCharacter() - Access character state
  - useNarrative() - Access narrative state
  - useJournal() - Access journal state
  - useSession() - Access session state
  - useConfig() - Access configuration state
  - useCampaign() - Access active campaign data
- State debugging tools (development mode only):
  - State inspection panel
  - Action logging
  - Performance metrics
  - Error tracking

### Excluded from MVP
- Cloud synchronization of game data
- Multi-device synchronization
- Complex game state versioning/branching
- Shared campaigns between users
- Advanced state migration tools with UI
- Detailed state change history
- State compression for large datasets
- Encryption of saved game data
- State conflict resolution UI
- Session recording/replay functionality
- Advanced analytics on game state
- Automated state backup scheduling
- Custom storage location options
- Multiple save slots per campaign
- Save state screenshots
- Detailed save state descriptions
- Save state ratings or favoriting
- In-game achievement system

## User Stories

1. **Campaign Management**
   - As a player, I want to create a new campaign with a selected world and character so I can start a new story
   - As a player, I want to continue an existing campaign so I can resume my story where I left off
   - As a player, I want to delete campaigns I'm no longer interested in so I can keep my campaign list organized
   - As a player, I want to see basic progress information for my campaigns so I know where I left off

2. **State Persistence**
   - As a player, I want my game state to automatically save during play so I don't lose progress if my browser crashes
   - As a player, I want to manually save my game at important points so I have control over my save points
   - As a player, I want to be notified when my game is saved so I know my progress is secure
   - As a player, I want to safely resume interrupted sessions so no progress is lost

3. **Data Portability**
   - As a player, I want to export my campaign data so I can back it up or transfer it to another device
   - As a player, I want to import campaign data so I can continue playing on a different device
   - As a player, I want to share my world configurations with others so they can use my custom settings
   - As a player, I want to import worlds created by others so I can use them in my games

4. **Error Recovery**
   - As a player, I want the system to handle storage failures gracefully so my experience isn't disrupted
   - As a player, I want the option to export my state as an emergency backup if persistent storage fails
   - As a player, I want to recover from browser crashes without losing significant progress
   - As a player, I want clear error messages that help me understand and resolve issues

5. **State Optimization**
   - As a developer, I want to optimize state size so the game performs well even with large campaigns
   - As a developer, I want to prevent unnecessary re-renders so the UI remains responsive
   - As a developer, I want to monitor state growth so I can prevent performance degradation over time
   - As a developer, I want to implement state pruning so old, unused data doesn't impact performance

6. **Debugging Support** (development only)
   - As a developer, I want to inspect application state so I can diagnose issues
   - As a developer, I want to track state changes so I can understand the effects of actions
   - As a developer, I want to monitor performance metrics so I can optimize critical operations
   - As a developer, I want to simulate different state conditions so I can test edge cases

## Acceptance Criteria
1. Game state persists correctly between browser sessions with all relevant data intact
2. Players can create, load, and delete campaigns with appropriate confirmations
3. Automatic saving occurs at 5-minute intervals and after significant events
4. Manual saving is available with visual confirmation
5. The system handles storage failures with appropriate error messages and fallback options
6. Players can export and import campaign data as JSON files
7. State operations maintain type safety and data integrity through validation
8. Loading saved campaigns restores the exact state of narrative, character, and journal
9. The system prevents data corruption through proper error handling
10. State selectors optimize component rendering by preventing unnecessary re-renders
11. The system respects browser storage quotas and handles quota exceeded errors
12. Component hooks provide clean, simple access to appropriate state slices
13. State version migrations successfully handle schema changes
14. User preferences persist across sessions
15. Action dispatches are type-safe and validated
16. The system recovers gracefully from interrupted save operations
17. Campaign progress information is tracked and displayed accurately
18. Save operations provide visual feedback to the user
19. Import validation prevents loading corrupted data
20. Debug tools only appear in development mode

## GitHub Issues
- [Implement domain-specific reducers for all systems] - Link to GitHub issue
- [Create IndexedDB persistence layer with auto-save] - Link to GitHub issue
- [Build campaign management functionality] - Link to GitHub issue
- [Implement export/import features for campaigns] - Link to GitHub issue
- [Create manual and automatic saving system] - Link to GitHub issue
- [Develop error recovery mechanisms for storage failures] - Link to GitHub issue
- [Build state selector functions for optimized rendering] - Link to GitHub issue
- [Create component hooks for state access] - Link to GitHub issue
- [Implement state validation middleware] - Link to GitHub issue
- [Build database versioning system] - Link to GitHub issue
- [Create storage quota management] - Link to GitHub issue
- [Implement safe resume functionality] - Link to GitHub issue
- [Build campaign progress tracking] - Link to GitHub issue
- [Create debug tools for development mode] - Link to GitHub issue
- [Implement state optimization techniques] - Link to GitHub issue

## BootHillGM Reference Code
- The campaign state management in `/app/components/CampaignStateManager.tsx` offers a proven approach to managing game campaigns
- The state provider pattern in `/app/context/GameStateProvider.tsx` demonstrates effective context-based state management
- The error recovery in `/app/components/GameSessionContent.tsx` shows robust error handling for state failures
- The reducer implementation in `/app/reducers/rootReducer.ts` provides a pattern for organizing domain-specific reducers
- The game actions adapter in `/app/reducers/gameActionsAdapter.ts` shows how to create type-safe action handling
- The persistence implementation in BootHillGM demonstrates effective IndexedDB patterns
- The debug tools in `/app/components/Debug/DevToolsPanel.tsx` offer a model for state inspection during development

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
