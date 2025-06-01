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
- **Decision Presentation**: Display choices to players with basic descriptions
- **Decision Recording**: Store player choices with metadata
- **Decision History**: Maintain a history of past decisions
- **Impact Tracking**: Record basic consequences of decisions
- **Decision Metadata**: Store essential context information (location, timestamp)

## Data Model

```typescript
interface PlayerDecision {
  id: string;
  prompt: string;
  options: DecisionOption[];
  timestamp: number;
  location?: string;
  tags: string[];
}

interface DecisionOption {
  id: string;
  text: string;
  tags: string[];
}

interface PlayerChoice {
  decisionId: string;
  optionId: string;
  timestamp: number;
  consequence?: string;
}
```

## User Interactions
- Users view decision prompts with multiple options
- Users select from available decision options
- Users experience narrative consequences of past decisions
- Users can review major decisions through the journal system

## Integration Points
- **Narrative Engine**: Coordinates decision points within narrative flow
- **Character System**: Reflects basic decision impacts on character
- **Journal System**: Records decisions in journal entries
- **World System**: Provides context for decisions based on world settings
- **AI Service**: Generates contextually appropriate decisions

## MVP Scope Boundaries

### Included
- Basic decision generation with 3-4 options per decision point
- Essential decision metadata (timestamp, location)
- Basic decision history recording and storage
- Clean decision presentation UI
- Simple tagging system for categorizing decisions
- Basic integration with journal system for decision review
- Straightforward impact on subsequent narrative
- DevTools integration to expose helpful info/debug tools

### Excluded from MVP
- Complex decision branching trees
- Detailed impact descriptions for decision options
- Visual representation of decision impacts
- Advanced impact simulation across multiple dimensions
- Decision undo/revision functionality
- Real-time impact visualization
- Decision relationship mapping
- Detailed consequence prediction
- Moral alignment tracking
- Importance classification system (critical, significant, moderate, minor)
- Impact dimensions with numerical values
- Character relationship impact tracking
- Advanced filtering of decision history
- Decision outcome statistics
- Decision flowcharts or visualization
- Multiple decision styles or presentation options
- Consequence animation or special effects
- Decision timers or time-limited choices

## User Stories
For detailed user stories, please see the [Player Decision System User Stories CSV file](./player-decision-system-user-stories.csv).

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met