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

1. **Relevance Scoring**
- As a developer, I want to calculate multi-factor relevance scores for past decisions so that the most applicable ones are prioritized for AI context (Complexity: Medium, Priority: Medium)
- As a developer, I want to weight recent decisions more heavily so that the narrative maintains recency bias for coherence (Complexity: Medium, Priority: Medium)
- As a developer, I want to configure relevance algorithm parameters so that the system can be tuned for optimal performance (Complexity: Medium, Priority: Medium)

2. **Context Matching**
- As a developer, I want to implement tag matching between decisions and current context so that thematically relevant decisions are prioritized (Complexity: Medium, Priority: Medium)
- As a developer, I want to assess the importance of decisions based on their classification so that significant decisions have appropriate influence (Complexity: Medium, Priority: Medium)
- As a developer, I want to evaluate decision consequences to include decisions with major narrative impacts (Complexity: Medium, Priority: Medium)

3. **Context Optimization**
- As a developer, I want to select the most relevant decisions for AI context so that token usage is optimized (Complexity: Medium, Priority: Medium)
- As a developer, I want to format decisions efficiently for the AI context so that token limits are respected (Complexity: Medium, Priority: Medium)
- As a developer, I want to set a minimum relevance threshold so that only meaningfully relevant decisions are included (Complexity: Medium, Priority: Medium)

4. **System Integration**
- As a developer, I want the relevance system to integrate with the player decision system so that decision history is accessible (Complexity: Medium, Priority: Medium)
- As a developer, I want the relevance system to provide optimized context to the narrative engine so that AI generation has appropriate history (Complexity: Medium, Priority: Medium)
- As a developer, I want to expose debugging tools for the relevance system so that the scoring can be monitored and adjusted (Complexity: Medium, Priority: Medium)

5. **User Experience**
- As a user, I want the narrative to appropriately reference my past important decisions so that the story feels responsive to my choices (Complexity: Medium, Priority: Medium)
- As a user, I want continuity in how the narrative responds to my previous actions so that the story feels coherent (Complexity: Medium, Priority: Medium)
- As a user, I want the story to prioritize my recent decisions appropriately so that the narrative flow feels natural (Complexity: Medium, Priority: Medium)

## Acceptance Criteria
1. The system correctly identifies decisions that are relevant to the current context
2. Recent decisions are appropriately weighted higher than older ones
3. Decisions with matching tags/themes receive higher relevance scores
4. Important decisions (critical/significant) are prioritized appropriately
5. Decisions with major narrative impacts are given proper weight
6. The relevance scoring algorithm is configurable via parameters
7. The system optimizes context for token efficiency
8. Relevant decisions are formatted appropriately for AI context

## GitHub Issues
- [Implement relevance scoring algorithm] - Link to GitHub issue
- [Create tag matching system] - Link to GitHub issue
- [Build recency weighting function] - Link to GitHub issue
- [Develop importance weighting system] - Link to GitHub issue
- [Implement context selection logic] - Link to GitHub issue
- [Create configuration interface] - Link to GitHub issue
- [Develop token-efficient context formatting] - Link to GitHub issue
- [Implement DevTools integration for Decision Relevance] - Link to GitHub issue

## BootHillGM Reference Code
- The BootHillGM project doesn't have a dedicated Decision Relevance System, as its narrative is more linear. However, the context management approach in `/app/components/GamePromptWithOptimizedContext.tsx` and the decision tracking in `/app/reducers/gameReducer.ts` could provide some conceptual reference for managing relevant information for the AI.

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met