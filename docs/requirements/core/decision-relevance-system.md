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
- As a developer, I want to calculate multi-factor relevance scores for past decisions so that the most applicable ones are prioritized for AI context

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
  1. The system calculates a composite relevance score between 0.0 and 1.0 for each past decision.
  2. The scoring algorithm considers multiple factors including recency, tag matches, and impact.
  3. The calculated scores (`overallScore`, `recencyScore`, etc.) are stored in the `DecisionRelevanceScore` object.
  4. Higher scoring decisions are prioritized for inclusion in the AI context.

- As a developer, I want to weight recent decisions more heavily so that the narrative maintains recency bias for coherence

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. The recency score decreases proportionally as the time difference between the decision and the current context increases.
  2. The recency weighting is configurable via the `maxAge` parameter.
  3. Very old decisions (beyond `maxAge`) receive minimal or zero recency score.
  4. The formula for recency decay is consistently applied across all decisions.

- As a developer, I want to configure relevance algorithm parameters so that the system can be tuned for optimal performance

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
  1. The relevance algorithm parameters (`recencyWeight`, `tagMatchWeight`, `impactWeight`, etc.) can be adjusted in the `RelevanceConfig`.
  2. Changes to configuration parameters take effect immediately for subsequent relevance calculations.
  3. Parameters have reasonable default values that work without manual configuration.
  4. Parameter values are validated to ensure they remain within acceptable ranges.

2. **Context Matching**
- As a developer, I want to implement tag matching between decisions and current context so that thematically relevant decisions are prioritized

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
  1. The `tagMatchScore` increases based on the number of matching tags between the decision's tags and the `currentTags` in the `NarrativeContext`.
  2. Decisions that share multiple tags with the current context receive higher scores than those with fewer matches.
  3. The tag matching algorithm handles both exact and partial tag matches.
  4. Tag matching is case-insensitive to prevent mismatches due to capitalization differences.

- As a developer, I want to assess the importance of decisions based on their classification so that significant decisions have appropriate influence

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
  1. Decisions have classification metadata that indicates their relative importance.
  2. The system uses this classification to calculate an appropriate `importanceScore`.
  3. More significant decisions receive higher importance scores in the relevance calculation.
  4. The importance weighting can be configured in the `RelevanceConfig`.

- As a developer, I want to evaluate decision consequences to include decisions with major narrative impacts

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. The `impactScore` reflects the recorded basic consequence of the decision (as tracked by the Player Decision System).
  2. Decisions with greater narrative impact receive higher impact scores.
  3. The impact weighting can be configured in the `RelevanceConfig`.
  4. The impact assessment uses available metadata without requiring complex narrative analysis.

3. **Context Optimization**
- As a developer, I want to select the most relevant decisions for AI context so that token usage is optimized

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
  1. The system applies the configured relevance algorithm to rank available decisions by their relevance scores.
  2. Higher-scored decisions are prioritized for inclusion in the context.
  3. The selection process handles edge cases such as ties in relevance scores.
  4. The system performs efficiently even with a large number of past decisions to evaluate.

- As a developer, I want to format decisions efficiently for the AI context so that token limits are respected

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. Selected decisions are formatted into a concise string representation suitable for inclusion in AI prompts.
  2. The formatting optimizes for token efficiency while preserving essential information.
  3. The system estimates token usage of the formatted content.
  4. Formatting is consistent to help the AI interpret the context correctly.

- As a developer, I want to set a minimum relevance threshold so that only meaningfully relevant decisions are included

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
  1. The system selects a maximum of `maxDecisionsToInclude` decisions based on their `overallScore`.
  2. Only decisions with an `overallScore` greater than or equal to `minRelevanceScore` are considered for inclusion.
  3. These threshold parameters can be configured in the `RelevanceConfig`.
  4. When no decisions meet the minimum relevance threshold, the system handles this gracefully.

4. **System Integration**
- As a developer, I want the relevance system to integrate with the player decision system so that decision history is accessible

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
  1. The system retrieves decision history, including metadata (tags, basic recorded consequence), from the Player Decision System.
  2. The integration handles updates to the decision history in real-time.
  3. The system correctly associates decision metadata with the corresponding decision objects.
  4. The integration is resilient to changes in the Player Decision System's implementation.

- As a developer, I want the relevance system to provide optimized context to the narrative engine so that AI generation has appropriate history

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
  1. The formatted string of relevant decisions is passed to the Narrative Engine for context generation.
  2. The format of the context aligns with what the Narrative Engine expects.
  3. The context is provided at the appropriate time in the narrative generation process.
  4. The integration handles errors gracefully if the context cannot be generated.

- As a developer, I want to expose debugging tools for the relevance system so that the scoring can be monitored and adjusted

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. DevTools allow inspection of `RelevanceConfig`, `NarrativeContext`, and calculated `DecisionRelevanceScore` for debugging.
  2. The debugging interface displays relevance scores for all decisions considered.
  3. The interface shows which decisions were selected for inclusion in the context and why.
  4. Changes to configuration parameters can be tested in real-time through the debugging interface.

5. **User Experience**
- As a user, I want the narrative to appropriately reference my past important decisions so that the story feels responsive to my choices

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [ ] Medium
   - [x] Large

  **Acceptance Criteria**:
  1. Narrative outputs generated using the optimized context demonstrably reference relevant past decisions.
  2. Important decisions are given appropriate weight in the narrative.
  3. The system prioritizes decisions based on tags, recency, and basic impact.
  4. References to past decisions feel natural and integrated within the narrative.

- As a user, I want continuity in how the narrative responds to my previous actions so that the story feels coherent

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
  1. Story continuity is maintained by referencing the basic consequences of past choices when appropriate.
  2. The narrative maintains consistent interpretations of past decisions over time.
  3. Related decisions are referenced together when contextually appropriate.
  4. Contradictions between past decisions and current narrative are minimized.

- As a user, I want the story to prioritize my recent decisions appropriately so that the narrative flow feels natural

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. Narrative flow reflects recent player actions more prominently than distant past actions.
  2. Recent decisions receive appropriate emphasis in the narrative context.
  3. Older actions with recorded basic consequences are still referenced when relevant.
  4. The balance between recent and important older decisions feels natural to the player.

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