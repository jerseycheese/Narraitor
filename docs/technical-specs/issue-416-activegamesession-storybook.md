# Technical Specification for Issue #416

## Issue Summary
- Title: Create Storybook story for GameSessionActiveWithNarrative component
- Description: The ActiveGameSession component needs a Storybook story for isolation testing
- Labels: enhancement, storybook, testing
- Priority: High (violates three-stage testing approach)

## Scope Boundaries
What IS included:
- Create comprehensive Storybook story for ActiveGameSession component
- Mock all external dependencies (stores, AI services)
- Cover all component states and scenarios
- Follow existing Storybook patterns

What is NOT included:
- Modifying the ActiveGameSession component itself
- Creating new test utilities beyond what's needed for mocking
- Changing existing store implementations
- Adding new features to the component

## Problem Statement
The ActiveGameSession component is a critical part of the narrative gameplay experience but lacks a Storybook story. This violates our three-stage component testing approach and makes it difficult to test the component in isolation. The component integrates with multiple stores and services, making comprehensive mocking essential.

## Technical Approach
1. Create ActiveGameSession.stories.tsx following existing patterns
2. Mock narrativeStore, sessionStore, and characterStore
3. Create mock data for worlds, characters, and narrative segments
4. Implement stories for all required states
5. Use decorators to provide store context
6. Follow existing mocking patterns from other GameSession stories

## Implementation Plan
1. Analyze existing story patterns in GameSession components
2. Create comprehensive mock data structures
3. Implement story file with all required scenarios
4. Test each story variant for proper behavior
5. Ensure interactive controls work correctly

## Test Plan
Focus on Storybook story functionality:
1. Story Rendering:
   - All story variants render without errors
   - Component displays correctly in each state
2. Interaction Testing:
   - Choice selection triggers callbacks
   - Loading states display properly
   - Error states show appropriate messages

## Files to Modify
None - we're only creating new files

## Files to Create
- `/src/components/GameSession/ActiveGameSession.stories.tsx`: The Storybook story file

## Existing Utilities to Leverage
- Existing GameSession story patterns
- Mock utilities from other component stories
- Storybook decorators and controls

## Success Criteria
- [x] Story file created at correct location
- [x] All major component states represented
- [x] Interactive controls for testing scenarios
- [x] Proper mocking of dependencies
- [x] Follows project Storybook patterns
- [x] Component behavior testable in isolation

## Out of Scope
- Modifying ActiveGameSession component code
- Creating unit tests (already exist)
- Changing store implementations
- Adding new features or fixing bugs