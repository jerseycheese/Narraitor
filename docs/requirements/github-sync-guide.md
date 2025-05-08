# GitHub Issue Synchronization Guide

This document outlines the process for maintaining synchronization between requirements documents and GitHub issues for the Narraitor project.

## Overview

The Narraitor project maintains two related sources of truth:

1. **Requirements Documents**: CSV files in the `/docs/requirements/` directories that define user stories, acceptance criteria, and technical requirements.
2. **GitHub Issues**: Tracking tickets that implement these requirements.

The synchronization process ensures consistency between these two sources, particularly for:
- User story text
- Complexity ratings (Small/Medium/Large)
- Priority levels (High/Medium/Low/Post-MVP)
- Acceptance criteria format
- Domain categorization

## Prerequisites

1. Ensure you have the necessary environment variables set:
   ```
   export GITHUB_TOKEN=your_github_token
   ```

2. Verify that all required scripts are available in the `/scripts/user-stories/` directory:
   - `migrate-user-stories.js` - Main script for migrating user stories from CSV to GitHub issues
   - `annotate-requirements-docs.js` - Updates complexity/priority annotations in docs
   - `update-user-stories.js` - Synchronizes GitHub issues with requirements
   - `validate-user-stories.js` - Validates consistency between docs and issues
   - `test-update-stories.sh` - Tests updates without making changes

## Step-by-Step Synchronization Process

### 1. Update Requirements Documents

When creating or modifying requirements:

1. Follow the format specified in the requirements CSV files:
   - User Story Title Summary
   - User Story
   - Priority (High/Medium/Low/Post-MVP)
   - Estimated Complexity (Small/Medium/Large)
   - Acceptance Criteria (separated by \n for new lines)
   - GitHub Issue Link

2. Format acceptance criteria as separate items with newline separators in CSV:
   ```
   Criterion 1\nCriterion 2\nCriterion 3
   ```

### 2. Standardize Requirements Format

Run the annotation script to ensure all requirements have standardized complexity and priority indicators:

```bash
node scripts/user-stories/annotate-requirements-docs.js
```

This script will:
- Update complexity/priority markers in the CSV files
- Standardize formatting across all documents
- Validate acceptance criteria format

### 3. Test GitHub Issue Migration

Before updating real issues, run the test script to validate requirements processing:

```bash
node scripts/testing/test-update-stories.sh
```

Review the output for:
- Parsing errors in requirements documents
- Mismatches between document complexity/priority and the mapping file
- Format inconsistencies

### 4. Validate GitHub Issues

Run the validation script to check for inconsistencies between requirements and GitHub issues:

```bash
node scripts/user-stories/validate-user-stories.js
```

This comprehensive check will identify:
- Format issues in requirements documents
- Format issues in GitHub issues
- Mismatches in complexity/priority between requirements and issues
- Unmatched requirements (requirements without corresponding issues)
- Unmatched issues (issues without corresponding requirements)

For more detailed output, add the `--verbose` flag:

```bash
node scripts/user-stories/validate-user-stories.js --verbose
```

To focus on a specific domain:

```bash
node scripts/user-stories/validate-user-stories.js --domain=character-system
```

### 5. Update GitHub Issues

Once validation is complete, update GitHub issues to match requirements:

First, perform a dry run to see what would change:

```bash
node scripts/user-stories/update-user-stories.js --dry-run
```

Review the output, and if everything looks correct, run the update:

```bash
node scripts/user-stories/update-user-stories.js
```

This script will:
- Update issue bodies with correct user story text
- Update acceptance criteria formatting
- Update complexity and priority settings
- Update GitHub labels to match complexity, priority, and domain
- Fix documentation links
- Add implementation notes

For a specific issue:

```bash
node scripts/user-stories/update-user-stories.js --issue=123
```

### 6. Post-Synchronization Verification

After updating, verify synchronization again:

```bash
node scripts/user-stories/validate-user-stories.js
```

Confirm that all inconsistencies have been resolved.

## Maintaining Ongoing Synchronization

### When Updating Requirements

1. Make changes to requirements CSV files following the standard format
2. Run `node scripts/user-stories/annotate-requirements-docs.js` to standardize format
3. Run `node scripts/user-stories/validate-user-stories.js` to check for inconsistencies
4. Run `node scripts/user-stories/update-user-stories.js` to update GitHub issues

### When Creating New Requirements

1. Add new rows to the appropriate CSV files following the standard format
2. Run `node scripts/user-stories/annotate-requirements-docs.js` to validate format
3. Either:
   - Create GitHub issues manually following the template, or
   - Use `node scripts/user-stories/migrate-user-stories.js` to automatically create issues from CSV

To see available options for the migration script:

```bash
node scripts/user-stories/migrate-user-stories.js --help
```

To list all available domains:

```bash
node scripts/user-stories/migrate-user-stories.js --list-domains
```

To migrate stories from a specific domain:

```bash
node scripts/user-stories/migrate-user-stories.js --domain=character-system
```

To migrate stories from all domains:

```bash
node scripts/user-stories/migrate-user-stories.js --all-domains
```

To do a dry run without creating issues:

```bash
node scripts/user-stories/migrate-user-stories.js --domain=character-system --dry-run
```

### When Updating GitHub Issues

1. If you need to change complexity or priority, update the CSV requirements first
2. Run the synchronization process to propagate changes to GitHub
3. For implementation details, you can update GitHub issues directly
4. Always maintain the standard format for user stories and acceptance criteria

## Template Structure

### CSV Format

The CSV files use the following columns:
- `User Story Title Summary`: Brief title for the user story
- `User Story`: Complete user story in "As a [role], I want [goal] so that [benefit]" format
- `Priority`: High (MVP), Medium (MVP Enhancement), Low (Nice to Have), or Post-MVP
- `Estimated Complexity`: Small (1-2 days), Medium (3-5 days), or Large (1+ week)
- `Acceptance Criteria`: Newline-separated list of criteria
- `GitHub Issue Link`: URL to the corresponding GitHub issue

### GitHub Issue Template

GitHub issues follow a structured template that includes:
- User Story: The full user story text
- Acceptance Criteria: List of criteria for completion
- Technical Requirements: Implementation details
- Implementation Notes: Guidance for developers
- Related Documentation: Links to requirement documents
- Estimated Complexity: Small, Medium, or Large with day estimates
- Priority: High, Medium, Low, or Post-MVP
- Domain: The functional area of the application
- Definition of Done: Standard completion criteria

## Troubleshooting

### Common Issues

1. **Complexity/Priority Mismatch**:
   - Check the `scripts/user-stories/story-complexity-mapping.js` file for the standard mappings
   - Update requirements to match the standard options
   - Run validation scripts to identify discrepancies

2. **Unmatched Requirements/Issues**:
   - Verify the GitHub issue links in the CSV files
   - Check if the domain is correctly assigned in GitHub issues
   - Create missing issues if needed or update links in CSV

3. **Format Issues**:
   - Follow the standard CSV format for requirements
   - Use the GitHub issue template for new issues
   - Run validation scripts to identify specific problems

### When to Ask for Help

If you encounter issues with:
- GitHub API rate limits or authentication
- Script errors or unexpected behavior
- Conflicts between requirements and implementation

Contact the requirements management team for assistance.

## Script Organization

The user story scripts are organized into a modular structure:

```
/scripts
  /github
    github-issue-utils.js
    github-label-creator.js
    setup-github-labels.js
  /user-stories
    annotate-requirements-docs.js
    migrate-user-stories.js
    process-issues.js
    story-complexity-mapping.js
    story-validation-utils.js
    update-user-stories.js
    validate-user-stories.js
    /modules
      config.js
      fs-utils.js
      github.js
      parsers.js
      processor.js
  /testing
    test-update-stories.sh
```

This modular organization makes maintenance easier and separates concerns into logical components.

## Best Practices

1. **Always Start with Requirements**: CSV files should be the primary source of truth
2. **Validate Before Updating**: Always run validation before making changes
3. **Dry Run First**: Use the `--dry-run` flag before executing updates
4. **Regular Synchronization**: Run the sync process weekly to catch drift
5. **Consistent Formatting**: Follow the standard format for all documents
6. **Document Changes**: Add notes about significant requirement changes

Remember that the goal is to maintain clear, consistent, and traceable requirements that align with implementation tracking in GitHub.

## GitHub Label Management

To set up or update GitHub labels for complexity, priority, and domains:

```bash
node scripts/github/setup-github-labels.js
```

This script uses the `github-label-creator.js` utility to create a consistent set of labels for all issue types.

## Resources

- [User Story Template](/docs/workflows/user-story-template.md)
- [GitHub Issue Templates](/.github/ISSUE_TEMPLATE/)
- [Requirements CSV Files](/docs/requirements/)
- [Story Complexity Mapping](/scripts/user-stories/story-complexity-mapping.js)