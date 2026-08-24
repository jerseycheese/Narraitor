---
title: GitHub Integration Guide
tags: [github, sync, automation, workflow]
created: 2025-06-26
updated: 2026-07-21
---

# GitHub Integration Guide

This is the automation that keeps GitHub issues and project documentation in sync. The goal was to cut the manual work involved in managing user stories and project tracking.

## Getting Started

**GitHub Token Setup** - First thing you'll need is a GitHub token with repo access:

```bash
# Set up access
export GITHUB_TOKEN=your_github_token

# Check it works
gh auth status
```

**Main Commands** - These handle the common sync workflows you'll actually use:

```bash
# Sync CSV user stories to GitHub issues
node scripts/update-user-stories.js

# Check everything matches up
node scripts/validate-user-stories.js

# Re-process issue bodies (labels, priorities, links)
node scripts/process-issues.js
```

## Core Scripts

### User Story Synchronization
```bash
# scripts/update-user-stories.js
node scripts/update-user-stories.js

# What it does:
# - Reads CSV files from scripts/user-stories/
# - Creates GitHub issues for new user stories
# - Updates existing issues with CSV data
# - Makes sure complexity and priority stay in sync
```

### Issue Validation
```bash
# scripts/validate-user-stories.js
node scripts/validate-user-stories.js

# Checks:
# - CSV stories have corresponding GitHub issues
# - Issue data actually matches CSV data
# - No duplicate issues exist (this happens more than you'd think)
# - Implementation links are valid
```

## Workflow Integration

### CSV to GitHub Issues
1. **Update CSV files** in `scripts/user-stories/`
2. **Run sync script** to create/update issues
3. **Validate** that synchronization actually worked
4. **Commit changes** to both CSV and any generated files

### GitHub Issues to Documentation
1. **Update issues** in the GitHub interface
2. **Export issue data** if you need it for documentation
3. **Update CSV files** to reflect the changes
4. **Re-sync** to make sure everything stays consistent

## Configuration

### Script Configuration
```javascript
// scripts/user-stories/modules/config.js
export const OWNER = 'jerseycheese';
export const REPO = 'narraitor';
export const API_BASE_URL = 'https://api.github.com';
export const PER_PAGE = 100;
```

### CSV File Format
```csv
Domain,Title,Description,Complexity,Priority,GitHub Issue
Character,Create Character,As a player I want to create a character,5,High,#123
World,World Setup,As a player I want to set up a world,8,High,#124
```

## Issue Management

### Issue Templates
GitHub issues use templates from `.github/ISSUE_TEMPLATE/`:
- **Feature Request** - For new functionality
- **Bug Report** - For issues and fixes
- **User Story** - Auto-generated from CSV synchronization

### Labels and Organization
- **Domain labels**: `character`, `world`, `narrative`, `journal` (keeps things organized)
- **Priority labels**: `priority/high`, `priority/medium`, `priority/low` (synced from CSV)
- **Type labels**: `feature`, `bug`, `enhancement`, `documentation` (helps with filtering)

### Project Boards
Issues get automatically organized into project boards:
- **Backlog** - Planned but not started yet
- **In Progress** - Currently being worked on
- **Review** - Ready for review
- **Done** - Completed (the satisfying column)

## Automation

There is no automated GitHub Actions or webhook sync wired up in this repo yet. Run the scripts manually when you need to sync.

## Data Flow

### CSV to GitHub Issues
1. Script reads CSV files
2. Matches existing issues by title or ID
3. Creates new issues for missing stories
4. Updates existing issues with CSV data
5. Applies appropriate labels and milestones

### GitHub Issues to CSV
1. Export issues via GitHub API
2. Match issues to CSV entries
3. Update CSV with current issue status
4. Sync priority and complexity changes
5. Generate reports on discrepancies

## Common Tasks

### Adding New User Stories
1. Add row to appropriate CSV file
2. Run `node scripts/update-user-stories.js` (use `--dry-run` first to preview)
3. Verify issue was created in GitHub
4. Commit CSV changes

### Bulk Issue Updates
```bash
# Update related-issue links
node scripts/github/update-related-issues.js

# Analyze issues that can be safely closed
./scripts/github/analyze-closable-issues.sh

# Close a specific issue
node scripts/github/simple-close-issue.js 123
```

### Reporting
```bash
# List issues for a repo
node scripts/github/list-issues.js

# Fetch a single issue
./scripts/fetch-github-issue.sh 123
```

## Error Handling

### Common Issues
- **Rate limiting**: The script includes automatic retry with backoff because GitHub gets cranky
- **Authentication**: Make sure your GitHub token actually has the right permissions
- **Duplicate issues**: The validation script catches these and reports them (they happen more than you'd expect)

### Troubleshooting
```bash
# Debug mode - shows you what's happening
DEBUG=true node scripts/update-user-stories.js

# Check API rate limits - helpful when things slow down
gh api rate_limit

# Validate GitHub token - make sure it's working
gh auth token
```

## Best Practices

### CSV Management
- Keep CSV files focused by domain (don't mix character and world stuff)
- Use consistent naming conventions (future you will thank you)
- Include clear descriptions and acceptance criteria
- Regularly validate against GitHub issues (things drift apart)

### Issue Management
- Use descriptive titles that actually match CSV entries
- Apply consistent labeling (the automation depends on it)
- Link related issues and documentation
- Keep issue descriptions up to date (stale info is worse than no info)

### Synchronization
- Run sync after CSV changes (don't forget this step)
- Validate after sync operations (trust but verify)
- Commit changes together (CSV + generated files)
- Monitor for sync failures in automation (they happen)

## Related
- `scripts/user-stories/` - CSV files
- `scripts/update-user-stories.js` - Main sync script
- `.github/ISSUE_TEMPLATE/` - Issue templates
- GitHub Project Boards
