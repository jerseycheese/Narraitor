# Narraitor Scripts

This directory contains various scripts for maintaining and managing the Narraitor project.

## Directory Structure

The scripts have been organized into the following directories:

- **github/** - Scripts for managing GitHub repositories, issues, and labels
- **user-stories/** - Scripts for managing user stories and requirements
  - **modules/** - Modular components used by the user story scripts
- **testing/** - Scripts for testing and validating other scripts

## Available Scripts

### GitHub Management

- **github/github-issue-utils.js** - Utility functions for working with GitHub issues
- **github/github-label-creator.js** - Create and manage GitHub labels
- **github/setup-github-labels.js** - Set up standard labels for the repository

### User Story Management

- **user-stories/annotate-requirements-docs.js** - Update requirements documents with standard annotations
- **user-stories/migrate-user-stories.js** - Migrate user stories from CSV to GitHub issues
- **user-stories/process-issues.js** - Process GitHub issues to update formatting
- **user-stories/story-validation-utils.js** - Utilities for validating story format
- **user-stories/update-user-stories.js** - Update GitHub issues based on requirements and sources "Priority" and "Estimated Complexity" directly from the user story CSV files.
- **user-stories/validate-user-stories.js** - Validate consistency between requirements and issues

### Testing

- **testing/test-update-stories.sh** - Test scripts for user story updates

## Usage

For detailed usage of each script, run it with the `--help` flag:

```bash
node scripts/user-stories/migrate-user-stories.js --help
```

For more comprehensive documentation on working with user stories and GitHub issues, see:

- [GitHub Sync Guide](/docs/requirements/github-sync-guide.md)
- [User Story Template](/docs/workflows/user-story-template.md)

## Environment Variables

Some scripts require environment variables to be set:

- **GITHUB_TOKEN** - GitHub API token for authentication

```bash
export GITHUB_TOKEN=your_github_token
```

## Modular Architecture

The user story scripts have been refactored into a modular architecture:

```
/user-stories
  /modules
    config.js       - Configuration and constants
    fs-utils.js     - File system utilities
    github.js       - GitHub API interactions
    parsers.js      - Parsers for CSV and markdown files
    processor.js    - Main processor logic for domains
```

This modular approach makes the code more maintainable and easier to extend with new functionality in the future.
