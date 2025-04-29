---
title: User Story Template
aliases: [GitHub Issue Template, Story Template]
tags: [narraitor, workflows, templates]
created: 2025-04-29
updated: 2025-04-29
---

# User Story Template for GitHub Issues

## Purpose
This template provides a standardized format for creating user stories as GitHub issues. It ensures that all necessary information is included for effective development and that stories are consistent across the project.

## When to Use
Use this template when:
- Creating new features from requirements documents
- Breaking down larger features into manageable tasks
- Documenting enhancements to existing functionality
- Defining UI components or system behaviors

## Template Structure

```markdown
## User Story
As a [user type],
I want to [action/feature],
so that [benefit/value].

## Acceptance Criteria
- [ ] Criteria 1: [specific, measurable outcome]
- [ ] Criteria 2: [specific, measurable outcome]
- [ ] Criteria 3: [specific, measurable outcome]
- [ ] ...

## Technical Requirements
- Implementation must follow [specific pattern/approach]
- Must integrate with [system/component]
- Must handle [edge case/error condition]
- ...

## Implementation Notes
- [Any specific implementation guidance]
- [Architectural considerations]
- [Performance requirements]
- [Accessibility requirements]
- ...

## Related Documents
- [Link to requirements document]
- [Link to design mockup]
- [Link to related issues]
- ...

## Definition of Done
- [ ] Code implemented following TDD approach
- [ ] Unit tests cover all logic paths
- [ ] Component has Storybook stories
- [ ] Documentation updated
- [ ] Passes accessibility standards
- [ ] Responsive on all target devices
- [ ] Code reviewed
- [ ] Acceptance criteria verified
```

## Example User Stories

### World Configuration Example

```markdown
## User Story
As a game creator,
I want to define custom attributes for my world,
so that I can establish the traits that characters can have in my narrative setting.

## Acceptance Criteria
- [ ] I can create attributes with names, descriptions, and value ranges
- [ ] I can set minimum and maximum values for each attribute
- [ ] I can set a default value for each attribute
- [ ] I can edit existing attributes
- [ ] I can delete attributes that aren't being used by any characters
- [ ] I receive validation errors if I try to create duplicate attribute names
- [ ] I can see a preview of how attributes will appear in character creation

## Technical Requirements
- Implementation must use the world configuration reducer
- Must validate attribute names for uniqueness within a world
- Must prevent deletion of attributes in use by characters
- Must persist changes to IndexedDB

## Implementation Notes
- Use form validation with React Hook Form
- Attribute editing should be optimistic UI with rollback on failure
- Consider implementing drag-and-drop for attribute reordering

## Related Documents
- [Link to World Configuration System requirements](/docs/requirements/core/world-configuration.md)
- [Link to design mockup in Figma]
- [Related to World Template System issue #XX]

## Definition of Done
- [ ] Code implemented following TDD approach
- [ ] Unit tests cover all logic paths
- [ ] Component has Storybook stories for all states
- [ ] Documentation updated with attribute management
- [ ] Passes accessibility standards
- [ ] Responsive on all target devices
- [ ] Code reviewed
- [ ] Acceptance criteria verified
```

### Character System Example

```markdown
## User Story
As a player,
I want to allocate attribute points to my character,
so that I can customize my character's strengths and weaknesses.

## Acceptance Criteria
- [ ] I can see all attributes defined by the selected world
- [ ] I can adjust attribute values within the world-defined ranges
- [ ] I can see how many attribute points I have remaining to allocate
- [ ] I cannot exceed the maximum total points allowed
- [ ] I cannot set attributes below their minimum or above their maximum values
- [ ] I receive visual feedback when trying to exceed limits
- [ ] I can reset all attributes to their default values
- [ ] I can only proceed when all points are allocated

## Technical Requirements
- Must use the character state reducer for updates
- Must enforce world-defined attribute constraints
- Must calculate and display points remaining
- Must validate complete allocation before allowing progression

## Implementation Notes
- Use a slider or +/- controls for intuitive adjustment
- Consider using color coding for values (low, medium, high)
- Implement optimistic updates with validation

## Related Documents
- [Link to Character System requirements](/docs/requirements/core/character-system.md)
- [Link to attribute allocation design mockup]
- [Related to Character Creation Wizard issue #XX]

## Definition of Done
- [ ] Code implemented following TDD approach
- [ ] Unit tests cover all logic paths and edge cases
- [ ] Component has Storybook stories for different world attributes
- [ ] Documentation updated with attribute allocation guide
- [ ] Passes accessibility standards (keyboard navigation, screen reader)
- [ ] Responsive on all target devices
- [ ] Code reviewed
- [ ] Acceptance criteria verified
```

## Best Practices

1. **Be Specific**: User stories should be specific enough to implement and test
2. **User-Centered**: Focus on the user's perspective and benefit
3. **Measurable**: Acceptance criteria should be objectively verifiable
4. **Independent**: Minimize dependencies on other stories when possible
5. **Estimable**: Stories should be clear enough to estimate effort
6. **Small**: Keep stories small enough to complete in a reasonable timeframe
7. **Testable**: Stories must include clear acceptance criteria

## Creating GitHub Issues from User Stories

1. Create a new issue in the NarrAItor repository
2. Use a concise title that summarizes the user story
3. Copy the template and fill in all sections
4. Add appropriate labels:
   - Type: `feature`, `enhancement`, `bug`, etc.
   - Priority: `high`, `medium`, `low`
   - System: `world`, `character`, `narrative`, `journal`, etc.
   - Phase: `mvp`, `post-mvp`
5. Assign to appropriate milestone
6. Link to related issues if applicable

## Issue Lifecycle

1. **Backlog**: Initial state, prioritized but not scheduled
2. **Ready**: Refined, estimated, and ready for development
3. **In Progress**: Currently being implemented
4. **Review**: Code complete and in review
5. **Testing**: Passing tests and being verified against acceptance criteria
6. **Done**: Fully implemented and meeting all criteria

## Additional Guidance

- Break down stories that are too large or complex
- Include mockups or screenshots when relevant
- Reference specific requirements documents
- Update stories if requirements change
- Use checklists for tracking progress on acceptance criteria
- Include technical requirements but keep implementation details flexible
- Consider adding time estimates once the story is refined
