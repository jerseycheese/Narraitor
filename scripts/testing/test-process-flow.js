// Test the complete process flow for issue #308

import { processIssues } from '../process-issues.js';
import { parseCsvRows } from '../user-stories/modules/parsers.js';
import path from 'path';

// Mock issue #308
const mockIssue = {
  number: 308,
  title: 'Clean, readable interface for decisions',
  html_url: 'https://github.com/jerseycheese/Narraitor/issues/308',
  labels: [
    { name: 'complexity:medium' },
    { name: 'domain:narrative-engine' },
    { name: 'priority:medium' },
    { name: 'user-story' }
  ],
  body: `## Plain Language Summary
Presents player choices in a visually clear way that's easy to understand and interact with

## User Story
Clean, readable interface for decisions

## Acceptance Criteria
- [ ] Decision interface components with:
- [ ] Clear visual distinction between options
- [ ] Responsive design for all screen sizes
- [ ] Seamless integration with narrative flow
- [ ] Accessible interaction controls

## Technical Requirements
<!-- List specific technical implementation details -->
- Decision interface components with:
- Clear visual distinction between options
- Responsive design for all screen sizes
- Seamless integration with narrative flow
- Accessible interaction controls

## Related Issues/Stories
<!-- Link to any related issues or stories - Each issue number should be prefixed with # to create a link -->
- #220\\n#217\\n#234\\n#248\\n#280\\n#211\\n#206`
};

// Load CSV data
const csvPath = path.resolve(process.cwd(), 'docs/requirements/core/narrative-engine-user-stories.csv');
const rows = parseCsvRows(csvPath);
const loadedCsvData = new Map();

// Find and load issue #308 data
const issue308Data = rows.find(row => row.gitHubIssueLink && row.gitHubIssueLink.includes('/308'));
if (issue308Data) {
  const normalizedUrl = issue308Data.gitHubIssueLink.trim().replace(/\/$/, '');
  issue308Data._domain = 'narrative-engine';
  issue308Data._csvPath = csvPath;
  loadedCsvData.set(normalizedUrl, issue308Data);
  
  // Also add by the issue URL
  loadedCsvData.set(mockIssue.html_url, issue308Data);
}

console.log('Testing Process Flow for Issue #308');
console.log('===================================\n');

console.log('CSV Data loaded:');
console.log('- User Story:', issue308Data?.userStory);
console.log('- Title Summary:', issue308Data?.titleSummary);

// Mock issue template content (not used for updates when CSV data exists)
const mockTemplate = '';

console.log('\nRunning processIssues in dry-run mode...\n');

// Process the issue
await processIssues([mockIssue], loadedCsvData, mockTemplate, true);
