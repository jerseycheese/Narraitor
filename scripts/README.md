# Narraitor Scripts

This directory contains utility scripts for managing and automating tasks in the Narraitor project.

## User Story Update Script

The `update-user-stories.js` script is used to update GitHub issues with user stories, ensuring they have:

- Correct documentation links
- Implementation notes
- Consistent complexity and priority values (from mapping)
- Appropriate labels

### Recent Changes

The script has been refactored to:

1. **Always use mapping values**: Complexity and priority values now always come from `getStoryComplexityAndPriority()` in the story-complexity-mapping.js file, overriding any values in issue bodies or labels.

2. **Improved label handling**: Now cleans up existing complexity and priority labels (case-insensitive) before adding new ones.

3. **Modular structure**: The code has been split into multiple files to maintain better organization and keep components under 300 lines:
   - `update-user-stories.js` - Main script and entry point
   - `story-validation-utils.js` - Utility functions for validating and extracting information
   - `github-issue-utils.js` - GitHub API utilities
   - `process-issues.js` - Core issue processing logic

4. **New validation mode**: Added a `--validate` flag to check for inconsistencies between GitHub issues and requirement docs without modifying any issues.

5. **Standalone validator**: New `validate-user-stories.js` script that can be run separately to identify inconsistencies.

### Usage

```bash
# Update all issues (interactive)
node scripts/update-user-stories.js

# Validate all issues without making changes
node scripts/update-user-stories.js --validate

# Dry run - show what would be updated without making changes
node scripts/update-user-stories.js --dry-run

# Process a specific issue
node scripts/update-user-stories.js --issue 123

# Limit the number of issues to process
node scripts/update-user-stories.js --limit 10

# Bypass label verification
node scripts/update-user-stories.js --force
```

### Standalone Validation

```bash
# Validate all issues
node scripts/validate-user-stories.js

# Validate a specific issue
node scripts/validate-user-stories.js --issue 123
```

### Testing

A test script is provided to verify the functionality:

```bash
# Make the script executable first
chmod +x scripts/test-update-stories.sh

# Run the tests
./scripts/test-update-stories.sh
```

## Requirements Annotation Script

The `annotate-requirements-docs.js` script annotates user stories in core requirement documents with their complexity and priority based on the mapping defined in the story-complexity-mapping.js file.

### Usage

```bash
# Annotate all requirement documents
node scripts/annotate-requirements-docs.js
```