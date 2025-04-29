---
title: NarrAItor GitHub Project Board
aliases: [GitHub Project Board, Project Board]
tags: [narraitor, documentation, workflow, github, project-management]
created: 2025-04-29
updated: 2025-04-29
---

# NarrAItor GitHub Project Board

This document describes the GitHub Project Board setup for NarrAItor and how to effectively use it for tracking user stories and development progress.

## Project Board Overview

The NarrAItor development team uses a GitHub Project Board to visualize and manage the workflow of user stories, bugs, and other development tasks. The project board is accessible at [https://github.com/jerseycheese/narraitor/projects](https://github.com/jerseycheese/narraitor/projects).

## Board Columns

The project board uses a Kanban-style workflow with the following columns:

1. **Backlog**: Issues that have been created but are not yet ready for implementation. This is where all new issues initially land.

2. **Ready**: Issues that have been refined, have clear acceptance criteria, and are ready to be picked up for implementation.

3. **In Progress**: Issues that are actively being worked on. There should be a GitHub branch associated with these issues.

4. **In Review**: Issues with completed implementation that are waiting for code review via a pull request.

5. **Done**: Issues that have been completed, reviewed, and merged into the main codebase.

## Automation Rules

The project board has the following automation rules configured:

- **Backlog**:
  - New issues are automatically added here
  - New pull requests without linked issues are added here

- **In Progress**:
  - Issues are moved here when assigned to someone
  - Pull requests are moved here when opened

- **In Review**:
  - Pull requests are moved here when marked ready for review
  - Issues are moved here when linked to a pull request that's ready for review

- **Done**:
  - Issues are moved here when closed
  - Pull requests are moved here when merged
  - Issues are moved here when the linked pull request is merged

## Working with the Project Board

### Adding Issues to the Board

All new issues created in the repository are automatically added to the Backlog column. If you need to manually add an existing issue:

1. Go to the issue in GitHub
2. On the right sidebar, click on "Projects"
3. Select the NarrAItor Development project
4. The issue will be added to the Backlog column

### Moving Issues Between Columns

1. Navigate to the project board
2. Drag and drop issues between columns as their status changes
3. Alternatively, update the issue status via automation triggers (assignment, PR creation, etc.)

### Effective Board Usage

For effective project management, follow these guidelines:

1. **Regular Backlog Grooming**:
   - Review the Backlog column regularly
   - Ensure issues have appropriate domain and priority labels
   - Move refined issues with clear acceptance criteria to the Ready column

2. **Work in Progress (WIP) Limits**:
   - Try to limit the number of issues in the In Progress column
   - A good rule of thumb is no more than 2-3 issues per developer

3. **Pull Request Linkage**:
   - Always link pull requests to their corresponding issues
   - Use "Fixes #issue-number" or "Resolves #issue-number" in PR descriptions or commit messages

4. **Review Process**:
   - Items in the In Review column should be reviewed promptly
   - Pull requests should include comprehensive test coverage

5. **Definition of Done**:
   - All acceptance criteria met
   - Code reviewed and approved
   - Tests passing
   - Documentation updated

## Board Views and Filtering

The project board supports different views to help focus on specific aspects:

1. **Board View**: The default Kanban-style view showing all columns
2. **Table View**: A spreadsheet-like view with customizable columns
3. **Domain-Specific Views**: Filtered views focusing on specific domains like Character System or Narrative Engine
4. **Priority Views**: Filtered views showing only issues of a specific priority

To access these views, use the view selector at the top of the project board.

## Integration with Development Workflow

The project board integrates with the overall development workflow as follows:

1. **User Story Creation**: Created from templates and automatically added to the Backlog
2. **Grooming and Refinement**: Moved to Ready when fully specified
3. **Implementation**: Assigned and moved to In Progress, branch created
4. **Pull Request**: Created when implementation is complete, moves to In Review
5. **Review and Merge**: Approved PRs are merged, closing issues and moving them to Done

## Related Documentation

- [[user-story-workflow|User Story Workflow]]: Detailed process for creating and managing user stories
- [[feature-development-workflow|Feature Development Workflow]]: End-to-end process for implementing features
