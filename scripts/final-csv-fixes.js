// final-csv-fixes.js
// This script fixes the remaining CSV issues

import path from 'path';
import { OWNER, REPO } from './user-stories/modules/config.js';
import { 
  readCsvFile, 
  writeCsvFile,
  parseCSVLine,
  updateCsvTitle,
  updateCsvIssueLink
} from './user-stories/modules/csv-utils.js';
import {
  createIssue
} from './user-stories/modules/github-api.js';

// Get GitHub token from environment variables
const TOKEN = process.env.GITHUB_TOKEN;

// Process a CSV file with specific operations
function processCsvFile(filePath, operations) {
  try {
    // Read the file
    let content = readCsvFile(filePath);
    let modified = false;
    
    // Apply operations
    for (const op of operations) {
      if (op.type === 'updateTitle') {
        const updated = updateCsvTitle(filePath, { titleSummary: op.oldTitle }, op.newTitle, false);
        if (updated) {
          modified = true;
          console.log(`✓ Updated title "${op.oldTitle}" to "${op.newTitle}"`);
        }
      } else if (op.type === 'updateLink') {
        const updated = updateCsvIssueLink(filePath, { titleSummary: op.title }, op.newLink, false);
        if (updated) {
          modified = true;
          console.log(`✓ Updated GitHub issue link for "${op.title}" to ${op.newLink}`);
        }
      }
    }
    
    if (modified) {
      console.log(`✅ Updated file: ${path.basename(filePath)}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  // Check for GitHub token
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  console.log('Fixing remaining CSV inconsistencies...');
  
  // Define the files and operations to perform
  const fileOperations = [
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/core/character-system-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Write character backstory', newTitle: 'Enter character details' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/core/inventory-system-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Auto-categorize items', newTitle: 'Respect tone settings' },
        { type: 'updateTitle', oldTitle: 'Reflect equipped items', newTitle: 'Present decision points' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/core/journal-system-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Record narrative events', newTitle: 'View formatted content' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/core/narrative-engine-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Personalize for character', newTitle: 'Distinguish narrative elements' },
        { type: 'updateTitle', oldTitle: 'Provide meaningful choices', newTitle: 'Save game manually' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/core/player-decision-system-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Create usable interface', newTitle: 'Handle storage failures gracefully' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/integrations/ai-service-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Restart generation', newTitle: 'Retry after errors' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/ui/game-session-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Resume game session', newTitle: 'Return to game session' },
        { type: 'updateTitle', oldTitle: 'Access screen reader support', newTitle: 'View chronological entries' },
        { type: 'updateTitle', oldTitle: 'View high-contrast interface', newTitle: 'Access journal during play' },
        { type: 'updateTitle', oldTitle: 'Use touch-friendly controls', newTitle: 'See formatted entries' }
      ]
    },
    {
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/ui/journal-interface-user-stories.csv',
      operations: [
        { type: 'updateTitle', oldTitle: 'Experience themed journal', newTitle: 'Create new world' }
      ]
    }
  ];
  
  // Create issue for "Clean" row
  console.log('\nCreating GitHub issue for "Clean" row...');
  
  try {
    const issueBody = `## User Story
As a user, I want a clean interface for the application

## Acceptance Criteria
- The interface is visually clean and uncluttered
- Design follows modern UI principles
- Elements are properly spaced and aligned
- Visual hierarchy is clear and intuitive

## Technical Requirements
- Implement responsive design principles
- Use consistent spacing and alignment
- Follow design system guidelines
- Ensure visual hierarchy aligns with user goals

## Implementation Notes
- Use standard implementation approach for this feature
- Consider data persistence and state management requirements
- Write tests first following TDD approach

## Estimated Complexity
- [x] Small (1-2 days)
- [ ] Medium (3-5 days)
- [ ] Large (1+ week)

## Priority
- [ ] High (MVP)
- [x] Medium (MVP Enhancement)
- [ ] Low (Nice to Have)
- [ ] Post-MVP

## Related Documentation
- docs/requirements/ui/interface-guidelines.md

## Related Issues/Stories
- #206
- #260
`;
    
    const newIssue = await createIssue(
      OWNER, 
      REPO, 
      'Clean interface design', 
      issueBody, 
      ['user-story', 'priority:medium', 'complexity:small'],
      TOKEN
    );
    
    console.log(`✅ Created new issue #${newIssue.number}: ${newIssue.html_url}`);
    
    // Add operation to update the "Clean" row
    fileOperations.push({
      file: '/Users/jackhaas/Projects/narraitor/docs/requirements/core/narrative-engine-user-stories.csv',
      operations: [
        { 
          type: 'updateLink', 
          title: 'Clean', 
          newLink: newIssue.html_url
        }
      ]
    });
  } catch (error) {
    console.error(`❌ Failed to create issue for "Clean" row: ${error.message}`);
  }
  
  // Process all file operations
  console.log('\nUpdating CSV files...');
  
  let filesUpdated = 0;
  for (const { file, operations } of fileOperations) {
    console.log(`\nProcessing ${path.basename(file)}...`);
    const modified = processCsvFile(file, operations);
    if (modified) {
      filesUpdated++;
    }
  }
  
  console.log(`\nCompleted! Updated ${filesUpdated} files.`);
}

// Execute the main function
main();
