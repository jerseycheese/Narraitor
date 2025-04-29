# GitHub Project Board Setup Guide

This guide provides step-by-step instructions for setting up the NarrAItor Development project board.

## Step 1: Create the Project Board

1. Go to the NarrAItor repository on GitHub
2. Click on the "Projects" tab
3. Click "New project"
4. Select "Classic project board"
5. Enter "NarrAItor Development" as the project name
6. Select "Kanban" as the template
7. Click "Create project"

## Step 2: Configure Project Columns

1. In your new project board, you should see three default columns: "To do", "In progress", and "Done"
2. Rename and add columns to match our workflow:
   - Rename "To do" to "Backlog"
   - Add a new column called "Ready" (after "Backlog")
   - Keep "In progress" but rename to "In Progress" 
   - Add a new column called "In Review" (before "Done")
   - Keep "Done"

## Step 3: Set Up Automation Rules

1. Click on the "..." (three dots) at the top right of each column
2. Select "Manage automation"
3. Configure the following rules:

### Backlog Column
- ✓ Move newly added issues here
- ✓ Move newly added pull requests here

### Ready Column
No automation needed - issues will be manually moved here when they're ready for implementation

### In Progress Column
- ✓ Move issues here when they're assigned to someone
- ✓ Move pull requests here when they're opened

### In Review Column  
- ✓ Move pull requests here when they're ready for review
- ✓ Move issues here when they're linked to a pull request that's ready for review

### Done Column
- ✓ Move issues here when they're closed
- ✓ Move pull requests here when they're merged
- ✓ Move issues here when the pull request linked to them is merged

## Step 4: Add Issues to the Project Board

1. Go to the "Issues" tab of your repository
2. Click on each issue you want to add to the project board
3. In the right sidebar, click "Projects" and select "NarrAItor Development"
4. Alternatively, use the migration script to automatically create issues from user-stories.md

## Step 5: Configure Project Settings

1. Click on the "..." (three dots) at the top right of the project board
2. Select "Settings"
3. Under "Options":
   - Enable "Track project progress"
   - Enable "Track issue progress" 
   - Set appropriate permissions for collaborators

## Step 6: Create Project Views (Optional)

1. From the project board, click "Views" at the top
2. Click "New view"
3. Create the following additional views:
   - "By Priority" - Filter by priority labels
   - "By Domain" - Filter by domain labels
   - "Current Sprint" - Custom filter for current work

## Common Workflows

### Adding a New User Story
1. Create a new issue using the User Story template
2. Add appropriate labels (domain, priority)
3. The issue will automatically appear in the "Backlog" column
4. When ready for implementation, move to the "Ready" column

### Starting Work on an Issue
1. Assign the issue to yourself
2. The issue will automatically move to "In Progress"
3. Create a branch for the issue (naming convention: feature/issue-number-short-description)
4. Work on the implementation following the TDD workflow

### Submitting a Pull Request
1. Create a PR that references the issue (e.g., "Fixes #123")
2. The PR will automatically move to "In Review"
3. The linked issue will also move to "In Review"
4. Request reviews from team members

### Completing Work
1. After the PR is approved and merged, it will automatically move to "Done"
2. The linked issue will also automatically move to "Done"
3. The issue will be automatically closed

## Tips for Effective Project Board Usage

1. **Regular Grooming**: Review the Backlog regularly to ensure items are properly prioritized
2. **WIP Limits**: Consider limiting the number of items in the "In Progress" column to maintain focus
3. **Labels**: Use labels consistently to enable effective filtering and organization
4. **Milestones**: Create milestones for important project deadlines or releases
5. **Linking**: Always link PRs to issues using "Fixes #issue-number" or "Resolves #issue-number" syntax
6. **Comments**: Use issue comments to document important decisions or blockers

## Updating Documentation

After setting up the project board, remember to update the user-story-workflow.md document in the /docs/workflows directory to reference this new process.
