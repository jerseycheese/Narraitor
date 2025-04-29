---
title: Journal System Requirements
aliases: [Game History Requirements]
tags: [narraitor, requirements, journal-system]
created: 2025-04-29
updated: 2025-04-29
---

# Journal System Requirements

## Overview
The Journal System records and organizes the player's game history, including narrative events, character interactions, and significant decisions. It serves as both a gameplay aid for remembering past events and an artifact of the player's unique story.

## Core Functionality
- **Entry Creation**: Automatic recording of narrative events and player actions
- **Entry Categorization**: Organization of entries by type and significance
- **Journal Viewing**: Interface for browsing and reading journal entries
- **Entry Persistence**: Storage of journal entries between sessions
- **Chronological Organization**: Timeline-based viewing of journal entries
- **Summary Generation**: AI-assisted creation of narrative summaries
- **Entry Formatting**: Proper formatting of text with paragraph structure
- **Quick Reference**: Easily accessible information during gameplay
- **Search and Filter**: Find specific entries based on various criteria
- **Player Annotations**: Allow players to add their own notes (post-MVP)
- **Entry Importance**: Mark entries by significance level

## Data Model

```typescript
interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title: string;
  content: string;
  summary?: string;
  formattedContent?: string;
  timestamp: number;
  worldId: string;
  characterId: string;
  location?: string;
  tags: string[];
  relatedEntryIds?: string[];
  isSignificant: boolean;
  playerAnnotation?: string;
  sessionId: string;
  importance: 'high' | 'medium' | 'low';
  isRead: boolean;
}

type JournalEntryType = 'narrative' | 'decision' | 'discovery' | 'character' | 'item' | 'location' | 'system';

interface JournalState {
  entries: Record<string, JournalEntry>;
  filteredEntryIds: string[];
  currentEntryId: string | null;
  filter: JournalFilter | null;
  lastViewedTimestamp: number;
  sessions: Record<string, JournalSession>;
  entryStats: JournalStats;
  searchHistory?: string[];
  bookmarkedEntryIds?: string[];
}

interface JournalFilter {
  entryType?: JournalEntryType[];
  searchText?: string;
  startDate?: number;
  endDate?: number;
  showSignificantOnly: boolean;
  location?: string;
  tags?: string[];
  session?: string;
  importance?: ('high' | 'medium' | 'low')[];
}

interface JournalSession {
  id: string;
  startTime: number;
  endTime?: number;
  entryIds: string[];
  worldId: string;
  characterId: string;
  title?: string;
}

interface JournalStats {
  totalEntries: number;
  entriesByType: Record<JournalEntryType, number>;
  entriesByImportance: Record<string, number>;
  entriesBySession: Record<string, number>;
  unreadEntries: number;
}
```

## User Interactions
- Users view chronologically organized journal entries
- Users filter entries by type, date, or search terms
- Users read detailed entry content with proper formatting
- Users navigate between related entries
- Users review summaries of recent events
- Users access the journal during gameplay via sidebar or modal
- Users see unread entry indicators
- Users see entry importance levels
- Users add their own notes to entries (post-MVP)
- Users bookmark important entries for quick access (post-MVP)

## Integration Points
- **Narrative Engine**: Receives narrative events for journal entry creation
- **Character System**: Links journal entries to character information
- **World System**: Provides world context for journal entries
- **State Management**: Persists journal data between sessions
- **AI Service**: Generates entry summaries and highlights
- **Inventory System**: Records item acquisitions and uses (post-MVP)
- **Location System**: Tracks location changes and discoveries
- **Game Session UI**: Provides journal access during gameplay

## MVP Scope Boundaries

### Included
- Automatic journal entry creation for:
  - Major narrative events (scene transitions, discoveries)
  - Player decisions with their selected options
  - Character interactions with important NPCs
  - Session start and end markers
  - System events (game saved, error recovered, etc.)
- Entry categorization with four primary types:
  - Narrative events (story developments)
  - Decisions (player choices)
  - Discoveries (important information learned)
  - Character encounters (significant NPC interactions)
- Journal UI with:
  - Chronological list view of entries
  - Entry detail view with formatted content
  - Basic filtering by entry type (multi-select)
  - Significant/All entries toggle filter
  - Session date grouping
  - New/unread entry indicators
  - Entry count and session statistics
  - Importance level indicators (high, medium, low)
- Mobile and desktop responsive design
- Persistence features:
  - IndexedDB storage of all entries
  - Last viewed position tracking
  - Entry count per session tracking
  - Read/unread status tracking
- Integration with game session UI:
  - Journal button with unread count indicator
  - Quick access from game header
  - Modal or sidebar display options
- Basic summary generation:
  - AI-assisted summaries of longer entries
  - Recent session summaries
  - Character interaction summaries

### Excluded from MVP
- Advanced search functionality with full-text search
- Custom player annotations and notes
- Entry tagging system beyond the basic types
- Media attachments or screenshots
- Relationship mapping between characters
- Journal export functionality
- Complex filtering by multiple criteria
- Interactive timeline visualization
- Custom journal styling beyond world theme
- Entry editing by players
- Sharing functionality
- Journal statistics and analytics
- Achievement tracking within journal
- Bookmarking functionality
- Entry rating system
- Map or location visualization
- Character relationship tracking
- Advanced summary generation for full sessions
- AI-generated insights or patterns

## User Stories

1. **Journal Recording**
   - As a player, I want the system to automatically record important narrative events so I can review them later
   - As a player, I want my decisions and their outcomes recorded so I can remember the choices I've made
   - As a player, I want to see when I discovered important information so I can track my progress
   - As a player, I want system events recorded so I have a complete history of my game session

2. **Journal Navigation**
   - As a player, I want to browse journal entries chronologically so I can follow the story progression
   - As a player, I want to filter entries by type so I can focus on specific aspects of the story
   - As a player, I want to distinguish between significant and minor entries so I can identify key moments
   - As a player, I want to see entries grouped by game session so I can recall specific play sessions

3. **Journal Interaction**
   - As a player, I want to access the journal during gameplay so I can remind myself of previous events
   - As a player, I want to see which entries are new or unread so I can catch up on recent developments
   - As a player, I want the journal to be organized by game sessions so I can recall each playing period
   - As a player, I want to see the importance level of entries so I can focus on critical information
   - As a player, I want to read entries with proper formatting so they're easy to read

4. **Journal Persistence**
   - As a player, I want my journal to persist between sessions so my story history is preserved
   - As a player, I want the journal to remember my last viewed position so I can continue browsing seamlessly
   - As a player, I want to know my reading progress with unread indicators so I can catch up on what I missed

5. **Journal Summaries**
   - As a player, I want to see summaries of longer entries so I can quickly understand their content
   - As a player, I want to get a summary of recent sessions so I can recall where I left off
   - As a player, I want to see summaries of character interactions so I remember important relationships

## Acceptance Criteria
1. The system automatically creates journal entries for narrative events, decisions, discoveries, and character encounters
2. Journal entries are correctly categorized by type
3. Entries are marked as significant or minor based on their importance
4. The journal interface displays entries in chronological order
5. Users can filter entries by type and significance
6. Entry content is displayed with appropriate formatting
7. The journal tracks and indicates new/unread entries
8. Entries persist between game sessions with proper associations to world and character
9. The journal interface is responsive on both mobile and desktop devices
10. The journal interface follows the world theme for visual consistency
11. The system indicates when a player last accessed the journal
12. Journal entries include timestamps with both real-world and in-game time when applicable
13. Users can access the journal during gameplay without losing their place in the narrative
14. Entry importance levels are clearly indicated in the interface
15. The system generates basic summaries for longer entries
16. The journal shows entry counts and basic statistics

## GitHub Issues
- [Implement journal entry data model and state management] - Link to GitHub issue
- [Create automatic entry creation system] - Link to GitHub issue
- [Build journal list view component] - Link to GitHub issue
- [Create journal entry detail component] - Link to GitHub issue
- [Implement entry categorization system] - Link to GitHub issue
- [Develop journal filtering functionality] - Link to GitHub issue
- [Create new/unread entry tracking] - Link to GitHub issue
- [Build journal persistence layer] - Link to GitHub issue
- [Implement journal access from game session] - Link to GitHub issue
- [Create journal session grouping] - Link to GitHub issue
- [Develop mobile-responsive journal interface] - Link to GitHub issue
- [Build world theme integration for journal] - Link to GitHub issue
- [Implement importance level indicators] - Link to GitHub issue
- [Create basic summary generation] - Link to GitHub issue
- [Implement entry formatting] - Link to GitHub issue

## BootHillGM Reference Code
- The journal implementation in `/app/components/JournalViewer.tsx` provides a solid foundation for the journal interface
- The journal stories in `/app/components/JournalViewer.stories.tsx` demonstrate how to test journal UI components
- The journal reducer in `/app/reducers/journal/journalReducer.ts` offers patterns for state management
- The journal entry creation triggered by narrative events in BootHillGM shows effective integration patterns
- The narrative summary service in `/app/services/ai/narrativeSummaryService.ts` demonstrates how to generate entry summaries
- The formatting used in BootHillGM's journal display provides useful patterns for proper text formatting

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
