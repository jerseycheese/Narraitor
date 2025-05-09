# User Stories Scripts

This directory contains scripts for managing user stories and GitHub issues in the Narraitor project.

## Modular Architecture

The user story scripts have been refactored into a modular architecture:

```
/modules
  config.js       - Configuration and constants
  fs-utils.js     - File system utilities
  github.js       - GitHub API interactions
  parsers.js      - Parsers for CSV and markdown files
  processor.js    - Main processor logic for domains
```

## Available Scripts

- **annotate-requirements-docs.js** - Update requirements documents with standard annotations
- **migrate-user-stories.js** - Migrate user stories from CSV to GitHub issues
- **process-issues.js** - Process GitHub issues to update formatting
- **story-complexity-mapping.js** - Mapping of story text to complexity and priority
- **story-validation-utils.js** - Utilities for validating story format
- **update-user-stories.js** - Update GitHub issues based on requirements
- **validate-user-stories.js** - Validate consistency between requirements and issues

## Usage

For detailed usage of each script, run it with the `--help` flag:

```bash
node scripts/user-stories/migrate-user-stories.js --help
```

### Migrating User Stories

```bash
# List available domains
node migrate-user-stories.js --list-domains

# Migrate stories from a specific domain
node migrate-user-stories.js --domain=character-system

# Migrate stories from all domains
node migrate-user-stories.js --all-domains

# Do a dry run without creating issues
node migrate-user-stories.js --domain=character-system --dry-run

# Limit the number of issues created
node migrate-user-stories.js --domain=character-system --limit 5

# Skip the first N issues
node migrate-user-stories.js --domain=character-system --skip 2
```

### Validating Stories

```bash
# Validate all stories
node validate-user-stories.js

# Validate stories for a specific domain
node validate-user-stories.js --domain=character-system

# Validate with verbose output
node validate-user-stories.js --verbose
```

### Updating Stories

```bash
# Update all stories
node update-user-stories.js

# Dry run to see changes without applying them
node update-user-stories.js --dry-run

# Update a specific issue
node update-user-stories.js --issue=123
```

For more comprehensive documentation on working with user stories and GitHub issues, see the [GitHub Sync Guide](/docs/requirements/github-sync-guide.md).
========

## Processing Issues

The `process-issues.js` script is used to process GitHub issues, fetching data from CSV files and applying updates (in non-dry run mode).

```bash
# Process issues with a dry run (no changes to GitHub)
node scripts/user-stories/process-issues.js --dry-run

# Process issues, skipping the first 100 and limiting to the next 50
node scripts/user-stories/process-issues.js --skip 100 --limit 50

# Process issues with help message
node scripts/user-stories/process-issues.js --help
```

For more comprehensive documentation on working with user stories and GitHub issues, see the [GitHub Sync Guide](/docs/requirements/github-sync-guide.md).
