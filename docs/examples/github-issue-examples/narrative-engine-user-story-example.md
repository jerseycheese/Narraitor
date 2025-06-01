---
title: User Story Example - Narrative Engine
aliases: [Narrative Engine Issue Example]
tags: [narraitor, examples, github-issues]
created: 2025-04-29
updated: 2025-04-29
---

# Example User Story for GitHub Issue: Player Choice System

Below is an example of a user story formatted for GitHub issues, focused on the Player Choice System component of the Narrative Engine.

```
[USER STORY] Implement Player Choice System
```

## User Story
As a player, I want to make meaningful decisions that affect the narrative so that I feel agency in the story and can express my character's personality through my choices.

## Domain
- [ ] World Configuration
- [ ] Character System
- [x] Narrative Engine
- [ ] Journal System
- [ ] State Management
- [ ] AI Service Integration
- [ ] Game Session UI
- [ ] Utilities and Helpers
- [ ] Other: _________

## Acceptance Criteria
- [ ] After each narrative segment, I am presented with 3-4 distinct choices
- [ ] Each choice is presented as a clear, concise option (1-2 sentences)
- [ ] Choices reflect different approaches or actions my character could take
- [ ] Selected choice is visually indicated and disabled while processing
- [ ] My choice is recorded in the narrative history
- [ ] My choice influences the subsequent narrative content
- [ ] The system tracks the impact of my decisions for later reference
- [ ] I can see choices that align with my character's attributes or skills
- [ ] I receive appropriate loading feedback while the AI generates the response
- [ ] The choice interface adapts responsively to different screen sizes

## Technical Requirements
- Must implement choice generation using the AI service
- Must use the narrative engine reducer for state updates
- Must record choices in the narrative history
- Must track choice metadata for decision relevance
- Must handle loading states and errors gracefully
- Must optimize token usage in prompt construction

## Implementation Notes
- Choices should be presented as cards or buttons with clear visual hierarchy
- Consider adding subtle visual cues for choices that align with character strengths
- Implement optimistic UI updates with appropriate loading states
- Add animation for transition between choice selection and new narrative
- Consider keyboard navigation for accessibility
- Store choice history with appropriate context for journal integration
- Implement retry mechanism for failed AI responses

## Related Documentation
- [Narrative Engine Requirements](/docs/requirements/core/narrative-engine.md)
- [Player Decision System Requirements](/docs/requirements/core/player-decision-system.md)
- [Game Session UI Requirements](/docs/requirements/ui/game-session.md)

## Definition of Done
- [ ] Code implemented following TDD approach
- [ ] Unit tests cover all logic paths including error scenarios
- [ ] Component has Storybook stories for all states (normal, loading, error)
- [ ] Documentation updated with player choice system details
- [ ] Passes accessibility standards (keyboard navigation, screen reader)
- [ ] Responsive on all target devices
- [ ] Code reviewed
- [ ] Acceptance criteria verified

## Priority
- [x] High (MVP)
- [ ] Medium (MVP Enhancement)
- [ ] Low (Nice to Have)
- [ ] Post-MVP

## Estimated Complexity
- [ ] Small (1-2 days)
- [x] Medium (3-5 days)
- [ ] Large (1+ week)

## Related Issues/Stories
- Related to #XX (Narrative Engine Core)
- Blocked by #XX (AI Service Integration)
- Enables #XX (Decision Relevance System)
