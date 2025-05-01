# Narraitor GitHub Configuration

This directory contains configuration files for GitHub features used in the Narraitor project.

## Issue Templates

The `ISSUE_TEMPLATE` directory contains templates for creating different types of issues:

- **User Story**: For describing features from a user's perspective
- **Bug Report**: For reporting bugs or issues in the system
- **Enhancement**: For suggesting improvements to existing features
- **Epic**: For tracking larger features that consist of multiple user stories

## Usage

When creating a new issue, you'll be prompted to select one of these templates. Each template includes fields and checkboxes to help provide all the necessary information.

For more detailed information about the workflow for managing user stories and issues, see the [User Story Workflow](../docs/workflows/user-story-workflow.md) documentation.

## Domain Organization

All issues are organized by domain to maintain a clear structure:

- **World Configuration**: Features related to defining settings, rules, and parameters
- **Character System**: Features related to character creation and management
- **Decision Tracking System**: Features related to tracking player choices and decisions
- **Decision Relevance System**: Features related to scoring and using past decisions
- **Narrative Engine**: Features related to AI-driven storytelling
- **Journal System**: Features related to tracking gameplay events
- **State Management**: Features related to persisting game state between sessions

## Labels

The following labels are used to categorize issues:

- `bug`: Issues reporting bugs or problems
- `enhancement`: Issues suggesting improvements to existing features
- `user-story`: Issues describing new features from a user's perspective
- `epic`: Issues tracking larger features or groups of related user stories
- Domain-specific labels (e.g., `world-configuration`, `character-system`, etc.)
- Priority labels (e.g., `priority-high`, `priority-medium`, etc.)

## GitHub Project

Narraitor uses GitHub Projects to visualize and manage the workflow. The project board consists of the following columns:

1. **Backlog**: Issues that have been created but not yet planned for implementation
2. **Ready**: Issues that are planned for the current or upcoming development cycle
3. **In Progress**: Issues currently being worked on
4. **In Review**: Issues that are completed and awaiting review
5. **Done**: Issues that are completed and merged
