// Test only the user story update for issue #308

import { parseCsvRows } from '../user-stories/modules/parsers.js';
import { updateUserStory } from '../utils/issue-body-utils.js';
import path from 'path';

// Load CSV data
const csvPath = path.resolve(process.cwd(), 'docs/requirements/core/narrative-engine-user-stories.csv');
const rows = parseCsvRows(csvPath);
const issue308Data = rows.find(row => row.gitHubIssueLink && row.gitHubIssueLink.includes('/308'));

// Exact body from GitHub issue #308
const currentBody = `## Plain Language Summary
Presents player choices in a visually clear way that's easy to understand and interact with

## User Story
Clean, readable interface for decisions

## Acceptance Criteria`;

console.log('User Story Update Test for Issue #308');
console.log('====================================\n');

console.log('1. CSV Data:');
console.log('   Title Summary:', JSON.stringify(issue308Data.titleSummary));
console.log('   User Story:', JSON.stringify(issue308Data.userStory));

console.log('\n2. Current Body User Story:');
const usRegex = /## User Story\s*\n([^\n#]*)/;
const usMatch = currentBody.match(usRegex);
console.log('   Extracted:', JSON.stringify(usMatch?.[1]));

console.log('\n3. Calling updateUserStory...');
const updatedBody = updateUserStory(currentBody, issue308Data);

console.log('\n4. Result:');
const updatedMatch = updatedBody.match(usRegex);
console.log('   Updated User Story:', JSON.stringify(updatedMatch?.[1]));

console.log('\n5. Full section before and after:');
console.log('   Before:');
console.log(currentBody.split('## Acceptance Criteria')[0]);
console.log('   After:');
console.log(updatedBody.split('## Acceptance Criteria')[0]);

console.log('\n6. Did it update correctly?');
console.log('   Expected:', JSON.stringify(issue308Data.userStory));
console.log('   Got:', JSON.stringify(updatedMatch?.[1]));
console.log('   Matches:', updatedMatch?.[1] === issue308Data.userStory);
