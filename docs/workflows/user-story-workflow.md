---
title: NarrAItor User Story Workflow
aliases: [User Story Workflow, Issue Management Workflow]
tags: [narraitor, documentation, workflow, agile]
created: 2025-04-28
updated: 2025-04-28
---

# NarrAItor User Story Workflow

This document outlines the workflow for creating, tracking, and completing user stories in the NarrAItor project using GitHub Issues.

## Issue Templates

NarrAItor uses several issue templates to standardize how we track work:

### User Story Template

Use this template for describing features from a user's perspective. The template follows the standard format:

```
As a [type of user], I want [goal/need] so that [benefit/value].
```

When creating a user story:
1. Clearly identify the type of user (e.g., player, game master, system designer)
2. Specify what they want to achieve
3. Explain the benefit or value they'll receive
4. Assign the relevant domain label
5. Set the appropriate priority level
6. Define clear acceptance criteria

### Bug Report Template

Use this template when reporting bugs or issues in the system. When creating a bug report:
1. Provide a clear description of the issue
2. Select the domain where the bug was found
3. List steps to reproduce the bug
4. Describe the expected behavior and actual behavior
5. Include screenshots if applicable
6. Specify the environment details

### Enhancement Template

Use this template for suggesting improvements to existing features. When creating an enhancement:
1. Identify the current feature to be enhanced
2. Select the relevant domain
3. Describe the proposed enhancement
4. Explain the reason or value of the enhancement
5. Suggest possible implementation approaches if known

### Epic Template

Use this template for tracking larger features that consist of multiple user stories. When creating an epic:
1. Provide a high-level description of the epic
2. Select the domain it belongs to
3. Define the main goals
4. List the related user stories (can be added as the epic progresses)
5. Set a timeline if applicable
6. Define the criteria for considering the epic complete

## Domain Organization

All issues are organized by domain to maintain a clear structure:

- **World Configuration**: Features related to defining settings, rules, and parameters
- **Character System**: Features related to character creation and management
- **Decision Tracking System**: Features related to tracking player choices and decisions
- **Decision Relevance System**: Features related to scoring and using past decisions
- **Narrative Engine**: Features related to AI-driven storytelling
- **Journal System**: Features related to tracking gameplay events
- **State Management**: Features related to persisting game state between sessions

## Priority Levels

User stories are prioritized into four levels:

- **High (MVP)**: Must be implemented for the Minimum Viable Product
- **Medium**: Important but not critical for the initial release
- **Low**: Desirable but can be deferred to later releases
- **Post-MVP**: Explicitly planned for after the MVP release

## GitHub Project Board

The NarrAItor project uses GitHub Projects to visualize and manage the workflow. The board consists of the following columns:

1. **Backlog**: User stories that have been created but not yet planned for implementation
2. **Ready**: User stories that are planned for the current or upcoming development cycle
3. **In Progress**: User stories currently being worked on
4. **In Review**: User stories that are completed and awaiting review
5. **Done**: User stories that are completed and merged

## Workflow Process

### Creating User Stories

1. Go to the [Issues tab](https://github.com/jerseycheese/narraitor/issues) of the NarrAItor repository
2. Click "New Issue"
3. Select the appropriate template
4. Fill in the required information
5. Assign relevant labels and domain
6. Submit the issue

### Working on User Stories

1. Assign the user story to yourself
2. Move it to the "In Progress" column on the project board
3. Create a branch for implementing the user story
4. Make your changes and commit them
5. Create a pull request referencing the issue number
6. Move the issue to the "In Review" column

### Reviewing User Stories

1. Reviewers check the implementation against the acceptance criteria
2. If changes are needed, provide feedback on the pull request
3. Once approved, the pull request can be merged
4. Move the issue to the "Done" column

### Closing User Stories

1. After merging, the issue should be automatically closed
2. Verify that all acceptance criteria have been met
3. Update the issue with any final comments or documentation links

## MCP Integration

If using the Model Context Protocol (MCP) with Claude, you can leverage the GitHub Issues MCP server to interact with issues directly from Claude. This allows for:

1. Creating new user stories through natural language
2. Querying the status of existing issues
3. Updating issue details
4. Managing the project board

## Best Practices

### Writing Good User Stories

1. **Focus on user value**: User stories should describe value to the user, not implementation details
2. **Keep it simple**: User stories should be concise and easy to understand
3. **Use consistent language**: Maintain consistent terminology across user stories
4. **Be specific**: Avoid vague or ambiguous language
5. **Include acceptance criteria**: Clear criteria help define when a story is complete

### Managing the Backlog

1. **Regular grooming**: Review the backlog regularly to ensure stories are still relevant
2. **Prioritization**: Keep the backlog prioritized by business value
3. **Breaking down epics**: Break large epics into smaller, manageable user stories
4. **Domain organization**: Keep stories organized by domain for better tracking

### Documentation

1. **Update docs**: Update relevant documentation when completing user stories
2. **Reference issues**: Reference issue numbers in commits and documentation
3. **Track decisions**: Document important decisions made during implementation

## Example User Story

Here's an example of a well-formed user story:

```
Title: [USER STORY] As a player, I want to create a character with custom attributes

Domain: Character System
Priority: High (MVP)

User Story:
As a player, I want to create a character with custom attributes so that I can tailor my character to my preferred playstyle.

Acceptance Criteria:
1. The character creation interface allows selecting and customizing attributes
2. Players can distribute a fixed number of points across attributes
3. The system validates that all required attributes are set
4. The character sheet displays the selected attributes
5. The system saves the character data to the database

Additional Context:
This is a core feature for the MVP as it enables basic character creation functionality.
```

## Troubleshooting

If you encounter issues with the workflow:

1. **Issue template not working**: Check for syntax errors in the template files
2. **Project board automation not working**: Verify the project board settings
3. **Unable to assign issues**: Ensure you have the necessary permissions
