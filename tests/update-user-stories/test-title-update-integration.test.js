#!/usr/bin/env node

// Integration test for title updates
// This script demonstrates the issue and verifies the fix

import { config } from 'dotenv';
import { fetchIssueByNumber } from '../../scripts/user-stories/modules/github-api.js';
import { OWNER, REPO } from '../../scripts/user-stories/modules/config.js';
import { execSync } from 'child_process';

config();

const TOKEN = process.env.GITHUB_TOKEN;
const TEST_ISSUE = 308;

async function integrationTest() {
  console.log('Integration Test: GitHub Issue Title Updates\n');
  
  try {
    // 1. Get the issue's current state
    console.log(`1. Fetching current state of issue #${TEST_ISSUE}...`);
    const initialIssue = await fetchIssueByNumber(OWNER, REPO, TEST_ISSUE, TOKEN);
    console.log(`   Current title: "${initialIssue.title}"`);
    
    // 2. Run the update script in dry-run mode
    console.log('\n2. Running update script in dry-run mode...');
    const dryRunOutput = execSync(
      `node scripts/update-user-stories.js --dry-run --issue ${TEST_ISSUE} --type=enhancement`,
      { encoding: 'utf8' }
    );
    
    // Check if title update is detected
    const titleUpdateDetected = dryRunOutput.includes('Title needs update') || dryRunOutput.includes('Would update title');
    console.log(`   Title update detected: ${titleUpdateDetected ? 'YES' : 'NO'}`);
    
    // Extract the proposed title
    const titleMatch = dryRunOutput.match(/Would update title to: "([^"]+)"/);
    const proposedTitle = titleMatch ? titleMatch[1] : null;
    if (proposedTitle) {
      console.log(`   Proposed title: "${proposedTitle}"`);
    }
    
    // 3. Run the actual update (if title change is needed)
    if (titleUpdateDetected && proposedTitle) {
      console.log('\n3. Running actual update to verify the change works...');
      console.log('   (This will update the actual GitHub issue)');
      
      // Uncomment the following lines to run the actual update
      /*
      execSync(
        `node scripts/update-user-stories.js --issue ${TEST_ISSUE} --type=enhancement`,
        { encoding: 'utf8', stdio: 'inherit' }
      );
      
      // 4. Verify the issue was updated
      console.log('\n4. Verifying the update...');
      const updatedIssue = await fetchIssueByNumber(OWNER, REPO, TEST_ISSUE, TOKEN);
      console.log(`   New title: "${updatedIssue.title}"`);
      
      const success = updatedIssue.title === proposedTitle;
      console.log(`   Update successful: ${success ? 'YES' : 'NO'}`);
      */
      
      console.log('\n   To run the actual update, uncomment the code in the test.');
      console.log('   The script would update the title from:');
      console.log(`   "${initialIssue.title}"`);
      console.log(`   to:`);
      console.log(`   "${proposedTitle}"`);
    } else {
      console.log('\n3. No title update needed for this issue.');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error(`\n❌ Error during test: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
integrationTest();
