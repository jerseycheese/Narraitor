---
title: Requirements to GitHub Issues Workflow
aliases: [Converting Requirements to GitHub Issues]
tags: [narraitor, workflows, github, requirements]
created: 2025-04-29
updated: 2025-04-29
---

# Converting Requirements to GitHub Issues

## Overview
This document outlines the process for transforming our documented requirements into actionable GitHub issues. This structured approach ensures that all development work is properly tracked, prioritized, and aligned with our defined scope boundaries.

## Why This Matters
Converting detailed requirements to focused GitHub issues helps us to:
- Break down complex systems into manageable tasks
- Ensure nothing gets overlooked during implementation
- Create clear acceptance criteria for each feature
- Track progress effectively during development
- Maintain alignment with scope boundaries
- Provide clear guidance for implementation

## The Conversion Process

### Step 1: Analyze Requirements Documents
1. Review the complete requirements document
2. Identify distinct features or components that can be implemented independently
3. Note dependencies between components
4. Understand scope boundaries (what's included vs. excluded)
5. Analyze acceptance criteria for testability

### Step 2: Break Down Features into User Stories
1. For each feature, identify the primary user and their goal
2. Write user stories in the format: "As a [user], I want [feature] so that [benefit]"
3. Create multiple user stories if a feature serves different types of users
4. Keep user stories focused on a single, coherent piece of functionality
5. Ensure each story delivers tangible value

### Step 3: Define Clear Acceptance Criteria
1. Write specific, measurable acceptance criteria for each user story
2. Focus on observable behavior and outcomes
3. Include edge cases and error scenarios
4. Ensure criteria are testable
5. Align with the scope boundaries defined in requirements

### Step 4: Add Technical Requirements
1. Include important implementation details from the requirements
2. Note integration points with other systems
3. Specify any architectural patterns to follow
4. Include performance, security, or accessibility requirements
5. Keep technical details focused on "what" rather than "how"

### Step 5: Create GitHub Issues
1. Use the [User Story Template](/.github/ISSUE_TEMPLATE/user-story.md) to create new issues
2. Give each issue a clear, descriptive title
3. Set appropriate labels for domain, priority, and complexity
4. Link to the original requirements document
5. Assign to the appropriate milestone
6. Link related issues to indicate dependencies

### Step 6: Organize in Project Board
1. Add all created issues to the Narraitor project board
2. Organize by priority and implementation phase
3. Group related issues together
4. Identify critical path issues
5. Highlight any blocking dependencies

## Guidelines for Good GitHub Issues

### Issue Titles
- Begin with a verb (Create, Implement, Build, Develop)
- Be concise but descriptive
- Avoid technical jargon
- Examples:
  - "Create World Creation Wizard"
  - "Implement Character Attribute Allocation"
  - "Build Journal Entry Filtering System"

### User Stories
- Focus on user benefit, not implementation
- Be specific about the user type
- Connect the feature to a concrete value proposition
- Examples:
  - "As a game creator, I want to define custom attributes for my world so that I can establish the traits that characters can have in my narrative setting."
  - "As a player, I want to allocate points to my character's attributes so that I can customize my character's strengths and weaknesses."

### Acceptance Criteria
- Start each criterion with "I can..." or "The system..."
- Make criteria specific and measurable
- Include validation requirements
- Address edge cases and error handling
- Examples:
  - "I can create attributes with names, descriptions, and value ranges"
  - "The system validates that attribute points don't exceed the maximum allowed"
  - "I receive an error message when trying to create duplicate attribute names"

### Technical Requirements
- Include specific technical constraints
- Note integration points
- Reference architectural patterns
- Examples:
  - "Must implement the wizard using a multi-step form pattern"
  - "Must use the character state reducer for updates"
  - "Must validate inputs according to world-defined constraints"

## Scope Management

### MVP vs. Post-MVP
- Always mark issues as either MVP or Post-MVP
- MVP issues must align exactly with scope boundaries in requirements
- Post-MVP issues should be captured but clearly labeled
- Be vigilant about scope creep during the breakdown process

### Managing Dependencies
- Use GitHub's linking features to connect dependent issues
- Identify and highlight blocking dependencies
- Consider implementation order when creating issues
- Use notes like "Blocked by #XX" or "Depends on #XX"

## Example Conversion

See the following examples of requirements converted to GitHub issues:

1. [World Creation Wizard Example](/docs/examples/github-issue-examples/world-configuration-user-story-example.md)
2. [Character Creation Wizard Example](/docs/examples/github-issue-examples/character-system-user-story-example.md)
3. [Player Choice System Example](/docs/examples/github-issue-examples/narrative-engine-user-story-example.md)

## Tips for Effective Conversion

1. **Right Size**: Issues should be completable in 1-5 days; break down larger features
2. **Single Responsibility**: Each issue should focus on one cohesive feature
3. **Clear Outcomes**: Acceptance criteria should leave no ambiguity about completion
4. **Testability**: Every acceptance criterion should be testable
5. **Link Back**: Always reference the original requirements document
6. **Capture Discussions**: Note any clarifications or decisions made during breakdown
7. **Visualize Flow**: Consider creating a sequence diagram for complex features

## Common Pitfalls to Avoid

1. **Too Vague**: User stories that are overly general or lack specific benefits
2. **Too Technical**: Focusing on implementation details rather than user value
3. **Too Large**: Creating issues that encompass too much functionality
4. **Missing Dependencies**: Failing to identify and link dependent issues
5. **Scope Expansion**: Adding features beyond the defined scope boundaries
6. **Untestable Criteria**: Acceptance criteria that can't be objectively verified
7. **Missing User Perspective**: Technical descriptions without user context

## Workflow Integration

Once issues are created:
1. Plan them into development sprints
2. Link to branches and pull requests during implementation
3. Update with additional context as development progresses
4. Close with references to the implementing code
5. Track velocity to improve future estimation

By following this workflow, we ensure that our GitHub issues accurately reflect our requirements and provide clear guidance for implementation.
