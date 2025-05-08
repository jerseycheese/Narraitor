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
- **Entry Categorization**: Organization of entries by type
- **Journal Viewing**: Interface for browsing and reading journal entries
- **Entry Persistence**: Storage of journal entries between sessions
- **Chronological Organization**: Timeline-based viewing of journal entries
- **Summary Generation**: Basic AI-assisted creation of entry summaries
- **Entry Formatting**: Proper formatting of text with paragraph structure

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
  sessionId: string;
}

type JournalEntryType = 'narrative' | 'decision' | 'discovery' | 'character';

interface JournalState {
  entries: Record<string, JournalEntry>;
  currentEntryId: string | null;
  sessions: Record<string, JournalSession>;
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
```

## User Interactions
- Users view chronologically organized journal entries
- Users read detailed entry content with proper formatting
- Users access the journal during gameplay via collapsible section
- Users see basic summaries of entries

## Integration Points
- **Narrative Engine**: Receives narrative events for journal entry creation
- **Character System**: Links journal entries to character information
- **World System**: Provides world context for journal entries
- **State Management**: Persists journal data between sessions
- **AI Service**: Generates basic entry summaries

## MVP Scope Boundaries

### Included
- Automatic journal entry creation for:
  - Major narrative events (scene transitions, discoveries)
  - Player decisions with their selected options
  - Character interactions with important NPCs
  - Session start and end markers
- Entry categorization with four primary types:
  - Narrative events (story developments)
  - Decisions (player choices)
  - Discoveries (important information learned)
  - Character encounters (significant NPC interactions)
- Journal UI with:
  - Chronological list view of entries
  - Entry detail view with formatted content
- Mobile and desktop responsive design
- Persistence features:
  - IndexedDB storage of all entries
- Display integration:
  - Basic collapsible section of page
- Basic summary generation:
  - AI-assisted summaries of individual entries
- DevTools integration to expose helpful info/debug tools

### Excluded from MVP
- Journal UI with:
  - Basic filtering by entry type (multi-select)
  - Significant/All entries toggle filter
  - Session date grouping
  - New/unread entry indicators
  - Entry count and session statistics
  - Importance level indicators (high, medium, low)
  - Journal button with unread count indicator
  - Quick access from game header
  - Modal or sidebar display options
- Persistence features:
  - Last viewed position tracking
  - Entry count per session tracking
  - Read/unread status tracking
- Advanced summary generation:
  - Recent session summaries
  - Character interaction summaries
  - AI-generated insights or patterns
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

## User Stories
For detailed user stories, please see the [Journal System User Stories CSV file](./journal-system-user-stories.csv).

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