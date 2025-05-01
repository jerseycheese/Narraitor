---
title: Lore Management System Requirements
aliases: [Lore System Requirements, World Facts System]
tags: [narraitor, requirements, lore-system]
created: 2025-04-29
updated: 2025-04-29
---

# Lore Management System Requirements

## Overview
The Lore Management System tracks, organizes, and applies world facts and knowledge throughout the narrative experience. By systematically managing lore, the system enhances narrative coherence, prevents contradictions, and maintains consistent world details across play sessions.

## Core Functionality
- **Lore Tracking**: Record and store world facts and details
- **Lore Categorization**: Organize facts into meaningful categories
- **Fact Extraction**: Identify new facts from narrative content
- **Lore Storage**: Maintain a central repository of world knowledge
- **Context Building**: Include relevant lore in AI prompts

## Data Model

```typescript
interface LoreFact {
  id: string;
  content: string;                  // The actual factual statement
  category: LoreCategory;           // Type classification
  createdAt: number;                // Timestamp of creation
  updatedAt: number;                // Timestamp of last update
  sourceId?: string;                // Original source reference
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
  latestUpdate: number;                         // Timestamp of last update
}
```

## User Interactions
- Users don't directly interact with this system in MVP
- Users experience consistent world details in narrative
- Users benefit from AI referencing established lore

## Integration Points
- **Narrative Engine**: Provides source content for lore extraction
- **World System**: Provides foundational lore from world configuration
- **Character System**: Connects character lore with character data
- **AI Service**: Receives lore context for prompt enhancement
- **State Management**: Persists lore data between sessions

## MVP Scope Boundaries

### Included
- Basic lore fact storage and retrieval
- Simple fact categorization with five primary categories:
  - Character (information about NPCs and PCs)
  - Location (places, landmarks, regions)
  - History (past events of significance)
  - Item (notable objects and artifacts)
  - Concept (abstract ideas, rules, customs)
- Manual fact extraction from narrative content
- Storage of fact source references
- Persistence via IndexedDB
- Basic context inclusion in AI prompts
- Simple timestamp tracking for facts
- DevTools integration to expose helpful info/debug tools

### Excluded from MVP
- Confidence scoring and importance ranking
- Contradiction detection and resolution
- User-facing lore codex or interface
- Advanced fact extraction using NLP
- Fact versioning and history tracking
- Fact validation and verification status
- Related facts identification
- Tagging system
- Advanced context building with prioritization
- Complex semantic analysis
- Visual relationship mapping
- External knowledge base integration
- Lore suggestion system
- Auto-generation of facts from world configuration
- Automatic contradiction resolution
- Fact search or filtering functionality
- Semantic similarity detection
- Advanced relationship mapping between facts
- Fact editing interface
- Custom categorization beyond the five primary types
- Importance or relevance scoring
- Analytics or fact usage statistics

## User Stories

1. **Lore Tracking**
- As a developer, I want the system to store world facts so they can be referenced consistently (Complexity: Small, Priority: Medium)
- As a developer, I want facts categorized to better organize world knowledge (Complexity: Small, Priority: Medium)
- As a player, I want the AI to remember established world details for a coherent experience (Complexity: Small, Priority: Medium)

2. **Lore Integration**
- As a developer, I want relevant lore included in AI prompts for consistent storytelling (Complexity: Small, Priority: Medium)
- As a player, I want the narrative to maintain consistent details about the world (Complexity: Small, Priority: Medium)
- As a developer, I want to trace facts back to their original sources for verification (Complexity: Small, Priority: Medium)

3. **Development Support**
- As a developer, I want access to debug tools to inspect the lore database during development (Complexity: Small, Priority: Medium)
- As a developer, I want to see how lore is being used in AI contexts to improve the system (Complexity: Small, Priority: Medium)

## Acceptance Criteria
1. The system correctly stores and categorizes lore facts
2. Facts are properly associated with their sources
3. Basic fact extraction from narrative content works correctly
4. Lore context is included in AI prompts when relevant
5. Facts persist between game sessions
6. The system maintains a consistent world state across gameplay
7. DevTools provide visibility into the lore database for debugging

## GitHub Issues
- [Implement lore data model and store] - Link to GitHub issue
- [Create basic fact categorization system] - Link to GitHub issue
- [Build fact source reference tracking] - Link to GitHub issue
- [Implement basic lore context for AI prompts] - Link to GitHub issue
- [Develop persistence layer for lore data] - Link to GitHub issue
- [Create manual fact extraction functionality] - Link to GitHub issue
- [Implement DevTools integration for lore system] - Link to GitHub issue

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
