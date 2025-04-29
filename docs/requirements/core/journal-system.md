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

## Data Model

```typescript
interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title: string;
  content: string;
  summary?: string;
  timestamp: number;
  worldId: string;
  characterId: string;
  location?: string;
  tags: string[];
  relatedEntryIds?: string[];
}

type JournalEntryType = 'narrative' | 'decision' | 'discovery' | 'character';

interface JournalState {
  entries: Record<string, JournalEntry>;
  filteredEntryIds: string[];
  currentEntryId: string | null;
  filter: JournalFilter | null;
}

interface JournalFilter {
  entryType?: JournalEntryType;
  searchText?: string;
  startDate?: number;
  endDate?: number;
  tags?: string[];
}
```

## User Interactions
- Users view chronologically organized journal entries
- Users filter entries by type, date, or search terms
- Users read detailed entry content
- Users navigate between related entries
- Users review summaries of recent events

## Integration Points
- **Narrative Engine**: Receives narrative events for journal entry creation
- **Character System**: Links journal entries to character information
- **World System**: Provides world context for journal entries
- **State Management**: Persists journal data between sessions
- **AI Service**: Generates entry summaries and highlights

## MVP Scope Boundaries

### Included
- Basic journal entry creation for narrative events
- Simple entry categorization by type
- Chronological journal viewing interface
- Entry persistence between sessions
- Basic filtering by entry type
- Simple text-based entry display

### Excluded
- Advanced search functionality
- Entry tagging system
- Custom player annotations
- Relationship visualizations
- Media attachments
- Journal export functionality
- Complex filtering options
- Interactive timeline visualization

## Acceptance Criteria
1. The system automatically creates journal entries for significant narrative events
2. Journal entries persist between game sessions
3. Users can browse journal entries in chronological order
4. The journal interface displays entry content in a readable format
5. Users can filter entries by basic types
6. Journal entries correctly maintain their association with the world and character

## GitHub Issues
- [Implement journal entry data model and state management] - Link to GitHub issue
- [Create journal entry creation system] - Link to GitHub issue
- [Build journal viewing interface] - Link to GitHub issue
- [Implement basic entry filtering] - Link to GitHub issue
- [Develop journal persistence] - Link to GitHub issue
- [Create integration with narrative engine] - Link to GitHub issue

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
