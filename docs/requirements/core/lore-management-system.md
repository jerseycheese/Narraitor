---
title: Lore Management System Requirements
aliases: [Lore System Requirements, World Facts System]
tags: [narraitor, requirements, lore-system]
created: 2025-04-29
updated: 2025-04-29
---

# Lore Management System Requirements

## Overview
The Lore Management System tracks, organizes, and applies world facts and knowledge throughout the narrative experience. By systematically managing lore, the system enhances narrative coherence, prevents contradictions, and maintains consistent world details across long play sessions.

## Core Functionality
- **Lore Tracking**: Record and store world facts and details
- **Lore Categorization**: Organize facts into meaningful categories
- **Fact Extraction**: Identify new facts from narrative content
- **Lore Storage**: Maintain a central repository of world knowledge
- **Context Building**: Include relevant lore in AI prompts
- **Lore Validation**: Track and verify the reliability of facts
- **Contradiction Detection**: Identify potentially conflicting information
- **Importance Scoring**: Assign priority levels to different facts

## Data Model

```typescript
interface LoreFact {
  id: string;
  content: string;                  // The actual factual statement
  category: LoreCategory;           // Type classification
  createdAt: number;                // Timestamp of creation
  updatedAt: number;                // Timestamp of last update
  sourceId?: string;                // Original source reference
  confidence: number;               // Confidence score (1-10)
  importance: number;               // Importance score (1-10)
  version: number;                  // Version number
  isValid: boolean;                 // Validation status
  relatedFactIds: string[];         // Related facts by ID
  tags: string[];                   // Searchable tags
}

type LoreCategory = 
  | 'character'    // Information about NPCs and PCs
  | 'location'     // Places, landmarks, regions
  | 'history'      // Past events of significance
  | 'item'         // Notable objects and artifacts
  | 'concept';     // Abstract ideas, rules, customs

interface LoreStore {
  facts: Record<string, LoreFact>;              // All facts by ID
  categorizedFacts: Record<LoreCategory, string[]>; // Fact IDs by category
  factsByTag: Record<string, string[]>;         // Fact IDs by tag
  factVersions: Record<string, LoreFact[]>;     // Version history by fact ID
  latestUpdate: number;                         // Timestamp of last update
}
```

## User Interactions
- Users don't directly interact with this system in MVP
- Users experience consistent world details in narrative
- Users benefit from AI referencing established lore
- Users notice fewer contradictions in long play sessions

## Integration Points
- **Narrative Engine**: Provides source content for lore extraction
- **World System**: Provides foundational lore from world configuration
- **Character System**: Connects character lore with character data
- **AI Service**: Receives lore context for prompt enhancement
- **State Management**: Persists lore data between sessions

## MVP Scope Boundaries

### Included
- Basic lore fact storage and categorization
- Simple lore extraction from narrative content
- Essential lore categories (character, location, history, item, concept)
- Basic confidence and importance scoring
- Fact versioning and validation status
- Simple contradiction detection
- Lore context inclusion in AI prompts

### Excluded
- Advanced natural language processing for extraction
- Player-facing lore codex UI
- Complex semantic analysis for contradictions
- Automatic tagging based on content analysis
- Visual lore relationship mapping
- External knowledge base integration
- Advanced contradiction resolution
- Lore suggestion system

## Acceptance Criteria
1. The system correctly stores and categorizes lore facts
2. Lore extraction identifies new facts from narrative content
3. Lore context is appropriately included in AI prompts
4. Fact versioning maintains history of changes
5. Basic contradiction detection identifies obvious conflicts
6. Importance and confidence scoring prioritizes facts appropriately
7. The system maintains a consistent world state across play sessions

## GitHub Issues
- [Implement lore data model and store] - Link to GitHub issue
- [Create basic lore extraction functionality] - Link to GitHub issue
- [Build lore categorization system] - Link to GitHub issue
- [Develop fact versioning and validation] - Link to GitHub issue
- [Implement lore context builder for AI prompts] - Link to GitHub issue
- [Create simple contradiction detection] - Link to GitHub issue
- [Develop importance and confidence scoring] - Link to GitHub issue

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
