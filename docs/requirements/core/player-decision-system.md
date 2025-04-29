---
title: Player Decision System Requirements
aliases: [Decision Tracking Requirements]
tags: [narraitor, requirements, decision-system]
created: 2025-04-29
updated: 2025-04-29
---

# Player Decision System Requirements

## Overview
The Player Decision System is responsible for creating, presenting, tracking, and recording player choices throughout the narrative experience. This system ensures that player decisions have meaningful impact and persistence across game sessions, contributing to a personalized narrative experience.

## Core Functionality
- **Decision Generation**: Create contextually relevant decision points in narrative
- **Decision Presentation**: Display choices to players with impact descriptions
- **Decision Recording**: Store player choices with metadata
- **Decision History**: Maintain a searchable history of past decisions
- **Impact Tracking**: Record and track the consequences of decisions
- **Decision Metadata**: Store context information (location, characters, etc.)
- **Importance Classification**: Categorize decisions by significance level

## Data Model

```typescript
interface PlayerDecision {
  id: string;
  prompt: string;
  options: DecisionOption[];
  importance: DecisionImportance;
  timestamp: number;
  location: string;
  characters: string[];
  context: string;
  tags: string[];
}

interface DecisionOption {
  id: string;
  text: string;
  impact?: string;
  tags: string[];
}

interface PlayerChoice {
  decisionId: string;
  optionId: string;
  timestamp: number;
  consequence: string;
  impactRecords: DecisionImpact[];
}

type DecisionImportance = 'critical' | 'significant' | 'moderate' | 'minor';

interface DecisionImpact {
  dimensionId: string;
  dimensionName: string; // e.g., "Reputation", "Relationship:John", "WorldState:TownSafety"
  value: number; // -10 to +10 scale
  description: string;
}
```

## User Interactions
- Users view decision prompts with multiple options
- Users select from available decision options
- Users see brief descriptions of potential impacts
- Users can review their decision history
- Users experience narrative consequences of past decisions

## Integration Points
- **Narrative Engine**: Coordinates decision points within narrative flow
- **Character System**: Reflects decision impacts on character relationships
- **Journal System**: Records decisions in journal entries
- **World System**: Applies decision impacts to world state
- **AI Service**: Generates contextually appropriate decisions
- **Decision Relevance System**: Evaluates which past decisions are relevant

## MVP Scope Boundaries

### Included
- Basic decision generation with 3-5 options per decision point
- Simple importance classification (critical, significant, moderate, minor)
- Essential decision metadata (timestamp, location, characters)
- Basic impact descriptions for decision options
- Decision history recording and storage
- Straightforward decision presentation UI
- Basic tagging system for decisions

### Excluded
- Complex decision branching trees
- Visual representation of decision impacts
- Advanced impact simulation across multiple dimensions
- Decision undo/revision functionality
- Real-time impact visualization
- Decision relationship mapping
- Detailed consequence prediction
- Moral alignment tracking

## Acceptance Criteria
1. Players are presented with clear, contextual decision points in the narrative
2. Each decision offers 3-5 meaningful options with impact descriptions
3. Player choices are recorded with appropriate metadata
4. Decision history is maintained between game sessions
5. Past decisions influence subsequent narrative content
6. Players can review their decision history in a readable format
7. Decision importance is classified appropriately

## GitHub Issues
- [Implement decision data model and storage] - Link to GitHub issue
- [Create decision presentation component] - Link to GitHub issue
- [Build decision history tracking system] - Link to GitHub issue
- [Develop decision impact recording] - Link to GitHub issue
- [Implement decision metadata classification] - Link to GitHub issue
- [Create decision history viewer] - Link to GitHub issue
- [Integrate with narrative engine] - Link to GitHub issue

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
