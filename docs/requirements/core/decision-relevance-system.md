---
title: Decision Relevance System Requirements
aliases: [Relevance Scoring Requirements]
tags: [narraitor, requirements, decision-relevance]
created: 2025-04-29
updated: 2025-04-30
---

# Decision Relevance System Requirements

## Overview
The Decision Relevance System determines which past player decisions are most relevant to the current narrative context. This system helps the AI reference appropriate past choices when generating new content, ensuring narrative coherence and meaningful continuity of player actions throughout the game experience.

## Core Functionality
- **Relevance Scoring**: Calculate relevance scores for past decisions
- **Recency Weighting**: Prioritize more recent decisions
- **Tag Matching**: Compare decision tags with current context
- **Importance Weighting**: Consider decision significance level
- **Impact Assessment**: Evaluate decision consequences
- **Context Selection**: Select most relevant decisions for AI context
- **Configuration**: Adjust relevance algorithm parameters
- **Context Optimization**: Format decisions for efficient token usage

## Data Model

```typescript
interface RelevanceConfig {
  recencyWeight: number;       // 0.0 to 1.0
  tagMatchWeight: number;      // 0.0 to 1.0
  importanceWeight: number;    // 0.0 to 1.0
  impactWeight: number;        // 0.0 to 1.0
  maxAge: number;              // Maximum age in milliseconds
  minRelevanceScore: number;   // Minimum score threshold (0.0 to 1.0)
  maxDecisionsToInclude: number; // Maximum decisions to include in context
}

interface DecisionRelevanceScore {
  decisionId: string;
  overallScore: number;        // 0.0 to 1.0 composite score
  recencyScore: number;        // 0.0 to 1.0
  tagMatchScore: number;       // 0.0 to 1.0
  importanceScore: number;     // 0.0 to 1.0
  impactScore: number;         // 0.0 to 1.0
  included: boolean;           // Whether to include in context
}

interface NarrativeContext {
  // Current context elements for comparison
  location: string;
  characters: string[];
  themes: string[];
  currentTags: string[];
  // Other context information
}
```

## User Interactions
- Users don't directly interact with this system
- Users experience indirect effects through narrative coherence
- Users notice when AI appropriately references past decisions
- Users perceive story continuity based on their previous choices

## Integration Points
- **Player Decision System**: Provides decision history and metadata
- **Narrative Engine**: Uses relevant decisions in context generation
- **AI Service**: Receives optimized context with relevant decisions
- **Journal System**: May highlight especially relevant past events
- **State Management**: Persists relevance configuration

## MVP Scope Boundaries

### Included
- Basic multi-factor relevance scoring algorithm
- Recency weighting based on time elapsed
- Simple tag matching for contextual relevance
- Importance weighting based on decision classification
- Basic impact assessment for narrative consequences
- Essential configuration parameters
- Token-efficient context formatting
- DevTools integration to expose helpful info/debug tools

### Excluded
- Advanced semantic analysis of decision content
- Complex relationship mapping between decisions
- Machine learning for relevance prediction
- Visual representation of decision relevance
- User-configurable relevance settings
- Dynamic adjustment of algorithm weights
- Granular dimension-specific relevance scoring
- Multi-dimensional context mapping

## User Stories
For detailed user stories, please see the [Decision Relevance System User Stories CSV file](./decision-relevance-system-user-stories.csv).

## BootHillGM Reference Code
- The BootHillGM project doesn't have a dedicated Decision Relevance System, as its narrative is more linear. However, the context management approach in `/app/components/GamePromptWithOptimizedContext.tsx` and the decision tracking in `/app/reducers/gameReducer.ts` could provide some conceptual reference for managing relevant information for the AI.

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met