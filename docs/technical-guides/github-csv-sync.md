# GitHub Issue & CSV Synchronization

This document provides technical details on the synchronization process between GitHub issues and user story CSV files in the Narraitor project.

## Overview

The Narraitor project maintains user stories in both GitHub issues and CSV files. GitHub issues serve as the system of record for development tracking, while CSV files provide domain-specific views of the requirements. The synchronization process ensures that:

1. Each user story in the CSV files has a corresponding GitHub issue
2. GitHub issues accurately reflect the complexity and priority defined in CSV files
3. Implementation notes and documentation links are properly maintained
4. Duplicate issues are eliminated

## System Components

### Core Scripts

- **update-user-stories.js** - Primary synchronization script
- **find-duplicates.js** - Identifies inconsistencies
- **cleanup-duplicates.js** - Resolves duplicate issues
- **fix-csv-mismatches.js** - Fixes CSV references
- **fix-remaining-issues.js** - Validates remaining issues
- **final-csv-fixes.js** - Applies specific fixes

### Support Modules

- **config.js** - Centralized configuration
- **github-api.js** - GitHub API utilities
- **csv-utils.js** - CSV file utilities
- **parsers.js** - Parsers for CSV and markdown files

## Data Flow

```
+---------------+      +-----------------+      +------------------+
| CSV Files     |----->| Synchronization |----->| GitHub Issues    |
| (Requirements)|      | Scripts         |      | (Implementation) |
+---------------+      +-----------------+      +------------------+
                              ^
                              |
                      +-------+-------+
                      | Issue Template |
                      +---------------+
```

## Integration Points

### CSV Files

CSV files in `docs/requirements/*/` follow this standard structure:
- **titleSummary** - Title of the user story
- **userStory** - The user story text
- **acceptanceCriteriaRaw** - Acceptance criteria
- **complexity** - Estimated complexity (Small, Medium, Large)
- **priority** - Priority level (High, Medium, Low, Post-MVP)
- **gitHubIssueLink** - Link to the GitHub issue

### GitHub Issues

GitHub issues use the template in `.github/ISSUE_TEMPLATE/user-story.md` with these sections:
- **User Story** - The user story text
- **Acceptance Criteria** - Acceptance criteria
- **Technical Requirements** - Technical implementation details
- **Implementation Notes** - Generated implementation guidance
- **Estimated Complexity** - Complexity level with checkboxes
- **Priority** - Priority level with checkboxes
- **Related Documentation** - Links to requirements documents
- **Related Issues/Stories** - Links to related issues

## Process Details

### Stage 1: Analysis

1. **find-duplicates.js**
   - Scans all user story GitHub issues
   - Identifies issues with identical titles
   - Finds CSV rows referencing the same issue
   - Detects CSV rows without valid GitHub issue links

Output: `duplicate-analysis.json` containing:
- `duplicateIssues` - Issues with identical titles
- `multiReferencedIssues` - Issues referenced by multiple CSV rows
- `rowsWithoutIssues` - CSV rows without valid GitHub issues

### Stage 2: Cleanup

1. **cleanup-duplicates.js**
   - Closes duplicate GitHub issues
   - Comments on closed issues referencing the primary issue
   - Updates CSV files to reference the primary issues
   - Fixes corrupted GitHub issue links in CSV files

2. **fix-csv-mismatches.js**
   - Updates CSV rows with mismatched titles
   - Creates GitHub issues for CSV rows with invalid links
   - Updates CSV rows to reference the newly created issues

### Stage 3: Validation

1. **fix-remaining-issues.js**
   - Verifies that all issues have consistent references
   - Identifies any remaining CSV rows without valid GitHub issues
   - Reports inconsistencies for manual review

2. **final-csv-fixes.js**
   - Applies specific fixes for edge cases
   - Updates CSV titles to match GitHub issues
   - Creates GitHub issues for special cases

### Stage 4: Synchronization

1. **update-user-stories.js**
   - Verifies required GitHub labels exist
   - Reads the GitHub issue template
   - Loads all CSV user story data
   - For each GitHub issue:
     - Finds matching CSV row
     - Updates implementation notes
     - Updates complexity and priority markers
     - Fixes documentation links

## Error Handling

The scripts handle these common error scenarios:

1. **GitHub API Rate Limiting**
   - Tracks the remaining rate limit
   - Pauses execution when approaching the limit
   - Resumes after the rate limit reset time

2. **Network Issues**
   - Retries failed API calls
   - Records partial progress
   - Provides detailed error messages

3. **CSV Parsing Errors**
   - Validates CSV structure
   - Handles various CSV encodings
   - Reports malformed CSV files

4. **Missing Configuration**
   - Checks for required environment variables
   - Validates GitHub repository settings
   - Verifies required labels exist

## Command Line Options

Most scripts support these common options:

- `--dry-run` - Test run without making changes
- `--limit N` - Limit processing to N items
- `--force` - Bypass validation checks
- `--validate` - Run in validation mode without making changes
- `--issue=N` - Process only a specific issue number

## GitHub API Usage

The scripts interact with these GitHub API endpoints:

- `GET /repos/:owner/:repo/issues` - List issues
- `GET /repos/:owner/:repo/issues/:number` - Get specific issue
- `POST /repos/:owner/:repo/issues` - Create issue
- `PATCH /repos/:owner/:repo/issues/:number` - Update issue
- `POST /repos/:owner/:repo/issues/:number/comments` - Add comment
- `GET /repos/:owner/:repo/labels` - List labels

## Performance Considerations

1. **Pagination**
   - Handles large repositories by paginating API requests
   - Processes GitHub issues in manageable batches

2. **Caching**
   - Minimizes redundant API calls
   - Stores analysis results for reuse

3. **Parallel Processing**
   - Processes independent items concurrently
   - Respects API rate limits

## Security Considerations

1. **Token Handling**
   - Uses environment variables for GitHub token
   - Never logs or exposes the token

2. **Data Validation**
   - Sanitizes input from CSV files
   - Validates URLs before processing

3. **Changes Safety**
   - Implements dry-run mode for verification
   - Backs up data before making changes
   - Logs all actions for review

## Troubleshooting

### Common Issues

1. **GitHub Token Issues**
   ```
   GitHub token not found. Set GITHUB_TOKEN environment variable.
   ```
   
   Solution: Export the GitHub token as an environment variable:
   ```bash
   export GITHUB_TOKEN=your_github_token
   ```

2. **Missing Labels**
   ```
   Required labels are missing: complexity:small, priority:high, ...
   ```
   
   Solution: Run the label creation script:
   ```bash
   node scripts/github-label-creator.js
   ```
   
   Or bypass label verification:
   ```bash
   node scripts/update-user-stories.js --force
   ```

3. **Rate Limiting**
   ```
   GitHub API rate limit exceeded. Resets at [time]
   ```
   
   Solution: Wait until the rate limit resets or use a token with higher limits.

4. **CSV Parsing Errors**
   ```
   Error parsing CSV [file]: [message]
   ```
   
   Solution: 
   - Check CSV format with a text editor
   - Ensure proper encoding (UTF-8)
   - Fix line endings (CRLF issues)

### Debugging Techniques

1. **Verbose Output**
   - Set DEBUG_MODE to true in config.js
   - Prints detailed information about each step

2. **Step-by-Step Processing**
   - Use the `--limit 1` option to process one item at a time
   - Process specific issues with `--issue=N`

3. **Dry Run Mode**
   - Use `--dry-run` to see planned changes without applying them
   - Check logs for potential issues

4. **Validation Mode**
   - Use `--validate` to check consistency without making changes
   - Identify issues before attempting fixes

## Best Practices

1. **Regular Synchronization**
   - Run the synchronization process after significant changes to CSV files
   - Schedule regular runs to maintain consistency

2. **Version Control**
   - Commit CSV changes before running synchronization
   - Log synchronization runs for tracking

3. **Incremental Processing**
   - Process small batches of issues for large repositories
   - Use `--limit` to control batch size

4. **Testing Changes**
   - Always use `--dry-run` before applying changes
   - Test on non-production repositories first

5. **Documentation**
   - Document any manual interventions
   - Keep notes on edge cases and solutions

## Extending the System

When extending the GitHub issue and CSV synchronization system, follow these guidelines:

1. **Use Existing Modules**
   - Leverage utilities in the modules directory
   - Follow established patterns for API calls and error handling

2. **Maintain Dry Run Mode**
   - Ensure all new functionality supports dry run mode
   - Provide clear logging of planned changes

3. **Document Changes**
   - Update this document with new functionality
   - Add comments to explain complex logic

4. **Error Handling**
   - Handle all potential errors gracefully
   - Provide actionable error messages

5. **TDD Approach**
   - Write tests first
   - Keep components under 300 lines
   - Use existing utilities where possible

## Related Documentation

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [CSV File Format](docs/requirements/csv-format.md)
- [Issue Template Guide](docs/workflows/issue-template-guide.md)
- [GitHub Labels Guide](docs/technical-guides/github-labels.md)

## Conclusion

The GitHub issue and CSV synchronization system provides a robust way to maintain consistency between requirements documentation in CSV files and implementation tracking in GitHub issues. By following the process outlined in this document, developers can ensure that all user stories are properly tracked, prioritized, and documented.
