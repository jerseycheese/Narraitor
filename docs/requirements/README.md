---
title: "Narraitor Requirements System"
type: overview
category: requirements
tags: [requirements, documentation, github-sync]
created: 2025-05-08
updated: 2025-06-08
---

# Narraitor Requirements System

## Overview

This directory contains the standardized requirements documentation for the Narraitor project. The requirements are organized into a structured format that ensures consistency across documents and proper synchronization with GitHub issues.

## Directory Structure

- `/docs/requirements/core/` - Core system requirements
- `/docs/requirements/ui/` - User interface requirements
- `/docs/requirements/integrations/` - Integration requirements
- `/docs/requirements/style-guide.md` - Format and style guide for requirements
- `/docs/requirements/github-sync-guide.md` - Guide for synchronizing requirements with GitHub issues

## User Stories Organization

User stories are organized in CSV files that follow the structure of the requirements:

- Each source document (`requirements/core/x.md`, `requirements/ui/y.md`, etc.) has a corresponding CSV file named `x-user-stories.csv` or `y-user-stories.csv`
- All user stories are categorized by their source document for easier traceability
- GitHub Issue Links are maintained in each CSV file
- TBD status is preserved for issues without matching GitHub issues

## Requirements Format

All requirements documents follow a standardized format:

- User stories include complexity and priority indicators
- Acceptance criteria are formatted as numbered lists
- Technical notes provide implementation guidance
- Open questions highlight decisions that need to be made

Example:

```markdown
- As a player, I want to create a character so that I can start playing. (Complexity: Medium, Priority: High)

## Acceptance Criteria

1. User can enter a character name.
2. User can allocate attribute points.
3. User can select and rate skills.
```

## GitHub Integration

Requirements are synchronized with GitHub issues using scripts in the `/scripts/` directory:

- `annotate-requirements-docs.js` - Updates complexity/priority indicators
- `update-user-stories.js` - Syncs GitHub issues with requirements
- `verify-requirements-sync.js` - Validates consistency
- `test-requirements-migration.js` - Tests the migration process
- `test-requirements-workflow.js` - Runs the entire workflow for CI/CD

## Standardization Process

This repository has undergone a standardization process to ensure consistency:

1. All requirements documents now use consistent formatting
2. User stories include complexity and priority indicators
3. Acceptance criteria are formatted as numbered lists
4. Requirements are aligned with the MVP implementation plan
5. GitHub issue templates are aligned with requirements format
6. User stories have been split into document-specific CSV files

## Managing Requirements

1. Follow the [Style Guide](style-guide.md) when creating or modifying requirements
2. Use the scripts to maintain synchronization with GitHub issues
3. Validate changes before committing them
4. Update the appropriate user-stories CSV file when modifying requirements

For detailed instructions on maintaining synchronization, see the [GitHub Sync Guide](github-sync-guide.md).

## Validation

To validate the requirements:

```bash
# Test the requirements migration
node scripts/test-requirements-migration.js

# Verify synchronization with GitHub issues
node scripts/verify-requirements-sync.js

# Test the entire workflow
node scripts/test-requirements-workflow.js
```

## Contributing

When contributing to the requirements:

1. Ensure you understand the scope boundaries
2. Follow the style guide for formatting
3. Run the validation scripts before submitting changes
4. Update GitHub issues after making changes to requirements
5. Update the corresponding user-stories CSV file to maintain consistency

## TDD & KISS Principles

The requirements system follows TDD (Test-Driven Development) and KISS (Keep It Simple, Stupid) principles:

- Scripts include validation to test requirements format
- Components are kept under 300 lines of code
- Existing utilities are leveraged where possible
- Functionality is focused on the defined scope boundaries

## MVP Alignment

All requirements documents are aligned with the MVP implementation plan:

- High priority items are required for the MVP
- Medium priority items are MVP enhancements
- Low priority items are nice-to-have features
- Post-MVP items are future enhancements