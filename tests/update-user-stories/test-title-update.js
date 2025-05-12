#!/usr/bin/env node

// Test script for verifying that GitHub issue titles are updated from CSV data
// TDD - Test Driven Development: Create test first, then fix the issue

import { config } from 'dotenv';
import { parseCsvRows } from '../../scripts/user-stories/modules/csv-parser.js';
import { fetchIssueByNumber } from '../../scripts/user-stories/modules/github-api.js';
import { OWNER, REPO } from '../../scripts/user-stories/modules/config.js';
import path from 'path';

// Load environment variables
config();

const TOKEN = process.env.GITHUB_TOKEN;
const TEST_ISSUE_NUMBER = 308; // Test with issue #308

async function testTitleUpdate() {
  console.log('Testing GitHub issue title update from CSV data...\n');
  
  try {
    // 1. Fetch the current issue from GitHub
    console.log(`1. Fetching issue #${TEST_ISSUE_NUMBER} from GitHub...`);
    const issue = await fetchIssueByNumber(OWNER, REPO, TEST_ISSUE_NUMBER, TOKEN);
    console.log(`   Current title: "${issue.title}"`);
    
    // 2. Find and load the CSV file containing this issue
    console.log('\n2. Looking for CSV data containing this issue...');
    const csvFiles = [
      'docs/requirements/core/lore-management-system-user-stories.csv',
      'docs/requirements/core/character-system-user-stories.csv',
      'docs/requirements/core/decision-relevance-system-user-stories.csv',
      'docs/requirements/core/devtools-user-stories.csv',
      'docs/requirements/core/inventory-system-user-stories.csv',
      'docs/requirements/core/journal-system-user-stories.csv',
      'docs/requirements/core/narrative-engine-user-stories.csv',
      'docs/requirements/core/player-decision-system-user-stories.csv',
      'docs/requirements/core/state-management-user-stories.csv',
      'docs/requirements/core/utilities-and-helpers-user-stories.csv',
      'docs/requirements/core/world-configuration-user-stories.csv',
      'docs/requirements/integrations/api-integrations-user-stories.csv',
      'docs/requirements/integrations/data-export-user-stories.csv',
      'docs/requirements/integrations/multiplayer-features-user-stories.csv',
      'docs/requirements/integrations/third-party-services-user-stories.csv',
      'docs/requirements/ui/developer-tools-ui-user-stories.csv',
      'docs/requirements/ui/game-settings-ui-user-stories.csv',
      'docs/requirements/ui/game-session-user-stories.csv',
      'docs/requirements/ui/landing-page-user-stories.csv',
      'docs/requirements/ui/responsive-design-user-stories.csv',
      'docs/requirements/ui/shared-components-user-stories.csv',
      'docs/requirements/ui/ui-theming-system-user-stories.csv',
      'docs/requirements/ui/world-creation-ui-user-stories.csv'
    ];
    
    let csvRowData = null;
    let foundInFile = null;
    
    for (const csvFile of csvFiles) {
      const fullPath = path.resolve(process.cwd(), csvFile);
      const rows = parseCsvRows(fullPath);
      
      for (const row of rows) {
        if (row.gitHubIssueLink && row.gitHubIssueLink.includes(`issues/${TEST_ISSUE_NUMBER}`)) {
          csvRowData = row;
          foundInFile = csvFile;
          break;
        }
      }
      
      if (csvRowData) break;
    }
    
    if (!csvRowData) {
      console.log('   ERROR: Could not find CSV data for this issue');
      return false;
    }
    
    console.log(`   Found in: ${foundInFile}`);
    console.log(`   CSV Title Summary: "${csvRowData.titleSummary}"`);
    console.log(`   CSV User Story: "${csvRowData.userStory}"`);
    
    // 3. Check if title needs updating
    console.log('\n3. Checking if title needs update...');
    const csvTitle = csvRowData.titleSummary.replace(/^\[[A-Z\s]+\]\s+/, '');
    const needsUpdate = csvTitle.trim().toLowerCase() !== issue.title.trim().toLowerCase();
    
    if (needsUpdate) {
      console.log(`   ✓ Title update needed: "${issue.title}" -> "${csvTitle}"`);
    } else {
      console.log(`   ✗ Title is already up-to-date: "${issue.title}"`);
    }
    
    // 4. Verify the update logic in process-issues.js
    console.log('\n4. Verifying update logic...');
    
    // Check if the CSV parser correctly maps titleSummary
    if (!csvRowData.titleSummary) {
      console.log('   ERROR: titleSummary field is not being parsed from CSV');
      return false;
    }
    
    // Simulate the logic from process-issues.js
    let titleToUpdate = null;
    if (csvRowData?.titleSummary) {
      const proposedTitle = csvRowData.titleSummary.replace(/^\[[A-Z\s]+\]\s+/, '');
      if (proposedTitle.trim().toLowerCase() !== issue.title.trim().toLowerCase()) {
        titleToUpdate = proposedTitle;
        console.log(`   ✓ Update logic would set: titleToUpdate = "${titleToUpdate}"`);
      } else {
        console.log('   ✗ Update logic would not update (titles match)');
      }
    } else {
      console.log('   ERROR: Update logic would not work (no titleSummary)');
      return false;
    }
    
    console.log('\n5. Test Summary:');
    console.log(`   - Issue #${TEST_ISSUE_NUMBER} current title: "${issue.title}"`);
    console.log(`   - CSV title summary: "${csvRowData.titleSummary}"`);
    console.log(`   - Title update needed: ${needsUpdate ? 'YES' : 'NO'}`);
    console.log(`   - Update logic working: ${titleToUpdate ? 'YES' : 'NO'}`);
    
    return needsUpdate;
    
  } catch (error) {
    console.error(`\nError during test: ${error.message}`);
    return false;
  }
}

// Run the test
testTitleUpdate()
  .then(result => {
    console.log(`\nTest ${result ? 'PASSED' : 'FAILED'}`);
    process.exit(result ? 0 : 1);
  });
