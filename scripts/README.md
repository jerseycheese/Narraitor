# Narraitor Scripts

This directory contains various scripts for maintaining and managing the Narraitor project.

## Directory Structure

The scripts have been organized into the following directories:

- **github/** - Scripts for managing GitHub repositories, issues, and labels
- **user-stories/** - Scripts for managing user stories and requirements
  - **modules/** - Modular components used by the user story scripts
- **testing/** - Scripts for testing and validating other scripts

## GitHub Issue & CSV Synchronization

The following scripts handle synchronization between GitHub issues and user story CSV files:

### Main Script

- **update-user-stories.js** - The primary script that updates GitHub issues from CSV data, ensuring consistency between requirements in CSV files and GitHub issues.

```bash
# Basic usage
node scripts/update-user-stories.js

# Dry run (no changes made)
node scripts/update-user-stories.js --dry-run

# Process only a specific issue
node scripts/update-user-stories.js --issue=123

# Limit processing to N issues
node scripts/update-user-stories.js --limit 10

# Validate consistency without updating
node scripts/update-user-stories.js --validate

# Bypass label verification
node scripts/update-user-stories.js --force
```

### Support Scripts

- **find-duplicates.js** - Identifies duplicate GitHub issues and CSV inconsistencies
- **cleanup-duplicates.js** - Closes duplicate GitHub issues and updates references
- **fix-csv-mismatches.js** - Updates CSV rows with consistent references to GitHub issues
- **fix-remaining-issues.js** - Validates fixes and identifies any remaining issues
- **final-csv-fixes.js** - Resolves specific edge cases in CSV files

### Workflow

The GitHub issue and CSV synchronization process follows this sequence:

1. Run `find-duplicates.js` to identify inconsistencies:
   ```bash
   node scripts/find-duplicates.js
   ```

2. Clean up duplicates (close duplicate issues and update references):
   ```bash
   # Dry run first
   node scripts/cleanup-duplicates.js --dry-run --fix-all
   
   # Then apply changes
   node scripts/cleanup-duplicates.js --fix-all
   ```

3. Fix CSV mismatches (update CSV references):
   ```bash
   # Dry run first
   node scripts/fix-csv-mismatches.js --dry-run --fix-all
   
   # Then apply changes
   node scripts/fix-csv-mismatches.js --fix-all
   ```

4. Validate the remaining issues:
   ```bash
   node scripts/fix-remaining-issues.js
   ```

5. Apply any final specific fixes:
   ```bash
   node scripts/final-csv-fixes.js
   ```

6. Run the main update script to complete synchronization:
   ```bash
   # Validate first
   node scripts/update-user-stories.js --validate
   
   # Then update
   node scripts/update-user-stories.js
   ```

## Other Available Scripts

### GitHub Management

- **github-issue-utils.js** - Utility functions for working with GitHub issues
- **github-label-creator.js** - Create and manage GitHub labels
- **setup-github-labels.js** - Set up standard labels for the repository

### User Story Management

- **annotate-requirements-docs.js** - Update requirements documents with standard annotations
- **process-issues.js** - Process GitHub issues to update formatting
- **story-validation-utils.js** - Utilities for validating story format
- **validate-user-stories.js** - Validate consistency between requirements and issues

### Testing

- **test-update-stories.sh** - Test scripts for user story updates

## Architecture

### Modular Structure

The user story scripts have been refactored into a modular architecture:

```
/user-stories
  /modules
    config.js       - Configuration and constants
    csv-utils.js    - CSV file utilities
    github-api.js   - GitHub API interactions
    parsers.js      - Parsers for CSV and markdown files
```

### Synchronization Flow

The synchronization process follows this flow:

1. **Identification Phase**
   - Find duplicate issues (same title)
   - Find inconsistent references (different titles for same issue)
   - Detect missing or invalid references

2. **Cleanup Phase**
   - Close duplicate issues
   - Update CSV references to point to primary issues
   - Fix corrupted or missing links

3. **Validation Phase**
   - Verify all issues are consistently referenced
   - Check for CSV rows without valid issues
   - Validate complexity and priority settings

4. **Update Phase**
   - Update GitHub issues from CSV data
   - Ensure documentation links are correct
   - Add implementation notes
   - Update complexity and priority markers

## Environment Variables

These scripts require environment variables to be set:

- **GITHUB_TOKEN** - GitHub API token for authentication

```bash
export GITHUB_TOKEN=your_github_token
```

## Scope & Limitations

The GitHub Issue & CSV Synchronization scripts are designed to:

- Update GitHub issues based on CSV data
- Close duplicate GitHub issues
- Ensure all CSV rows link to valid GitHub issues
- Create missing GitHub issues for CSV rows with invalid links
- Resolve GitHub authentication token issues

They are NOT designed to:

- Implement GitHub-to-CSV synchronization (reverse direction)
- Standardize titles across different domain CSV files for the same issue
- Create new CSV files or migrate issues not in existing CSVs
- Modify the GitHub issue template structure
- Enhance the issue creation process beyond current requirements

## Error Handling

The scripts include robust error handling for common issues:

- GitHub API rate limiting
- Network connectivity problems
- Malformed CSV files
- Invalid GitHub issue references
- Missing required configuration

## For Developers

When extending these scripts, follow these guidelines:

1. Use the modular architecture in `/user-stories/modules`
2. Handle rate limiting for GitHub API calls
3. Implement proper error handling
4. Use dry-run functionality for testing
5. Document new features in this README
6. Follow TDD principles and keep components under 300 lines
