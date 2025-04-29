# NarrAItor GitHub Setup Scripts

This directory contains scripts to help set up and manage the GitHub project for NarrAItor.

## Available Scripts

1. **github-label-creator.js** - Creates and updates GitHub issue labels
2. **migrate-user-stories.js** - Migrates user stories from docs/user-stories.md to GitHub Issues

## Prerequisites

- Node.js installed on your system
- GitHub Personal Access Token with repo scope permissions
- Owner/Repo information updated in the scripts (if different from default)

## Setup Instructions

Before running these scripts, make sure to:

1. Install Node.js if you don't already have it
2. Generate a GitHub Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Generate a new token with "repo" scope permissions
   - Copy the token for use with the scripts

## Running the Scripts

### 1. First, create the GitHub labels:

```bash
# Set your GitHub token as an environment variable
export GITHUB_TOKEN=your_github_token_here

# Run the label creator script
node github-label-creator.js
```

The script will:
- Read labels defined in `/.github/labels.md`
- Create and update labels in your GitHub repository
- Display a summary of changes made

### 2. Then, migrate user stories to GitHub Issues (optional):

```bash
# Make sure your GitHub token is still set
export GITHUB_TOKEN=your_github_token_here

# Run the user story migration script
node migrate-user-stories.js
```

The script will:
- Parse user stories from `/docs/user-stories.md`
- Show a preview of the first story
- Ask for confirmation before proceeding
- Create GitHub issues for each user story with appropriate labels
- Display a summary of the migration

## Troubleshooting

Common issues:

1. **Authentication Error**: Make sure your GitHub token is valid and has the necessary permissions
2. **File Not Found**: Ensure the paths to labels.md and user-stories.md are correct
3. **Rate Limiting**: GitHub API has rate limits - the scripts add delays, but you might hit limits if creating many issues

## Notes

- The labels script will only update labels that have changed, so it's safe to run multiple times
- The migration script will create new issues for all user stories in the markdown file, potentially creating duplicates if run multiple times
- You can modify the scripts to change the repository owner/name or to customize the issue format

## GitHub Project Board

After running these scripts, you'll need to manually create a GitHub Project Board:

1. Go to the repository → Projects tab → New project
2. Select "Classic project board" and use the "Kanban" template
3. Name it "NarrAItor Development"
4. Configure columns: Backlog, Ready, In Progress, In Review, Done
5. Set up automation rules for the columns
