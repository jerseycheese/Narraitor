---
title: "GitHub CSV Synchronization Guide"
type: guide
category: development
tags: [github, csv, synchronization, workflow]
created: 2025-05-09
updated: 2025-06-08
---

# GitHub CSV Synchronization Guide

This guide provides step-by-step instructions for using the GitHub issue and CSV synchronization scripts for the Narraitor project.

## Prerequisites

Before using the synchronization scripts, ensure you have:

1. **GitHub API Token** - A personal access token with `repo` scope permissions
2. **Node.js** - Version 14 or higher
3. **Repository Access** - Write access to the Narraitor repository

## Setup

1. **Set up environment variables**

   ```bash
   export GITHUB_TOKEN=your_github_token
   ```

2. **Install dependencies**

   ```bash
   cd scripts
   npm install
   ```

## Synchronization Workflow

Follow this workflow to synchronize GitHub issues with CSV user stories:

### 1. Find Duplicates and Inconsistencies

Run the duplication finder to identify issues that need resolution:

```bash
node scripts/find-duplicates.js
```

This script will:
- Find GitHub issues with identical titles
- Identify CSV rows pointing to the same GitHub issue
- Detect CSV rows with missing or invalid GitHub issue links
- Output results to `duplicate-analysis.json`

Review the analysis output to understand the issues that need to be fixed.

### 2. Clean Up Duplicates

Close duplicate GitHub issues and update CSV references:

```bash
# Always run in dry-run mode first
node scripts/cleanup-duplicates.js --dry-run --fix-all

# Then apply the changes
node scripts/cleanup-duplicates.js --fix-all
```

This script will:
- Close duplicate GitHub issues and add comments referencing the primary issue
- Update CSV files to reference the primary issues
- Fix corrupted GitHub issue links in CSV files

### 3. Fix CSV Mismatches

Update CSV rows with consistent references:

```bash
# Always run in dry-run mode first
node scripts/fix-csv-mismatches.js --dry-run --fix-all

# Then apply the changes
node scripts/fix-csv-mismatches.js --fix-all
```

This script will:
- Update CSV rows with mismatched titles
- Create GitHub issues for CSV rows with invalid links
- Update CSV rows to reference the newly created issues

### 4. Verify Remaining Issues

Check for any remaining inconsistencies:

```bash
node scripts/fix-remaining-issues.js
```

This script will:
- Verify title consistency across multiple CSV references
- Check for empty GitHub issue links
- Report any remaining issues for manual review

### 5. Apply Final Fixes

Apply specific fixes for any remaining edge cases:

```bash
node scripts/final-csv-fixes.js
```

This script will:
- Create GitHub issues for specific CSV rows (like "Clean")
- Update titles in specific CSV files
- Fix other identified edge cases

### 6. Run the Main Synchronization

Finally, run the main synchronization script:

```bash
# First validate without making changes
node scripts/update-user-stories.js --validate

# Then run the actual update
node scripts/update-user-stories.js
```

This script will:
- Verify required GitHub labels exist
- Load all CSV user story data
- Update GitHub issues with:
  - Correct documentation links
  - Implementation notes
  - Complexity and priority settings from CSV data

## Common Use Cases

### Synchronizing a Single Issue

To process only a specific issue:

```bash
node scripts/update-user-stories.js --issue=123
```

### Limiting the Number of Issues Processed

To limit processing to a specific number of issues:

```bash
node scripts/update-user-stories.js --limit 10
```

### Bypassing Label Verification

To skip label verification (useful if you're sure labels are set up correctly):

```bash
node scripts/update-user-stories.js --force
```

### Testing Changes Without Applying Them

To see what changes would be made without actually applying them:

```bash
node scripts/update-user-stories.js --dry-run
```

### Validating Consistency

To check if issues are consistent with their CSV data without making changes:

```bash
node scripts/update-user-stories.js --validate
```

## Troubleshooting

### GitHub Token Issues

If you see an error about the GitHub token:

```
GitHub token not found. Set GITHUB_TOKEN environment variable.
```

Make sure you've set the GITHUB_TOKEN environment variable:

```bash
export GITHUB_TOKEN=your_github_token
```

### Missing Labels

If you see an error about missing labels:

```
Required labels are missing. Run "node scripts/github-label-creator.js" first.
```

Run the label creation script:

```bash
node scripts/github-label-creator.js
```

### Rate Limiting

If you hit GitHub API rate limits:

```
GitHub API rate limit exceeded. Resets at [time].
```

Wait until the rate limit resets or use a token with higher limits. The scripts automatically pause and resume when approaching rate limits.

### CSV Parsing Errors

If you encounter CSV parsing issues:

```
Error parsing CSV [file]: [message]
```

Check the CSV file:
- Ensure it has the correct structure
- Verify it's saved with UTF-8 encoding
- Fix any line ending issues

### Duplicate Issues Not Resolving

If duplicate issues aren't being properly resolved:

1. Run `find-duplicates.js` again to regenerate the analysis
2. Check the `duplicate-analysis.json` file for issues
3. Run `cleanup-duplicates.js` with the `--fix-issues` flag

## Best Practices

1. **Always run in dry-run mode first**

   Before applying changes, use the `--dry-run` flag to see what would happen.

2. **Commit CSV changes before synchronizing**

   Ensure all CSV changes are committed to version control before running synchronization.

3. **Synchronize regularly**

   Run synchronization after significant changes to keep GitHub and CSV files consistent.

4. **Process in batches**

   For large repositories, use the `--limit` option to process issues in manageable batches.

5. **Document manual interventions**

   Keep notes of any manual fixes applied outside the scripts.

## Advanced Usage

### Adding Custom Validations

The `validate-user-stories.js` script can be extended with custom validations:

```javascript
// Add a custom validation function
function validateCustomRequirement(issue, csvData) {
  // Validation logic
  return {
    isValid: true|false,
    message: "Validation message"
  };
}
```

### Creating New GitHub Issues from CSV

To create GitHub issues for new CSV rows:

```bash
node scripts/fix-csv-mismatches.js --fix-empty
```

This will find CSV rows without GitHub issue links and create new issues for them.

### Customizing Implementation Notes

To customize the implementation notes generated for issues, modify the `generateImplementationNotes` function in `update-user-stories.js`.

## Conclusion

Following this synchronization workflow ensures that GitHub issues accurately reflect user story requirements from CSV files. Regular synchronization keeps the development tracking system consistent with the requirements documentation.

For more detailed technical information, see the [GitHub CSV Synchronization Technical Guide](../technical-guides/github-csv-sync.md).
