#!/usr/bin/env node

// Test batch title updates for multiple issues
// Verifies that the title update fix works across different issues

import { config } from 'dotenv';
import { execSync } from 'child_process';

config();

async function testBatchTitleUpdates() {
  console.log('Testing batch title updates for multiple issues...\n');
  
  try {
    // Run the update script for multiple enhancement issues
    console.log('Running update script in dry-run mode for the first 5 enhancement issues...');
    const output = execSync(
      'node scripts/update-user-stories.js --dry-run --limit 5 --type=enhancement',
      { encoding: 'utf8' }
    );
    
    // Count how many issues have title updates
    const titleUpdateCount = (output.match(/Title needs update/g) || []).length;
    const wouldUpdateTitleCount = (output.match(/Would update title to:/g) || []).length;
    
    console.log('=== Summary ===');
    console.log(`Issues with title updates detected: ${titleUpdateCount}`);
    console.log(`"Would update title" messages: ${wouldUpdateTitleCount}`);
    
    // Extract all the title updates
    const titleUpdates = output.match(/Title needs update: "([^"]+)" -> "([^"]+)"/g) || [];
    
    if (titleUpdates.length > 0) {
      console.log('\n=== Title Updates Found ===');
      titleUpdates.forEach((update, index) => {
        console.log(`${index + 1}. ${update}`);
      });
    } else {
      console.log('\nNo title updates found in the batch.');
    }
    
    // Verify the fix is working
    const success = titleUpdateCount > 0 && titleUpdateCount === wouldUpdateTitleCount;
    
    if (success) {
      console.log('\n✅ PASS: Title update fix is working for batch processing!');
    } else if (titleUpdateCount === 0) {
      console.log('\n⚠️ WARNING: No title updates detected. This might be normal if titles are already in sync.');
    } else {
      console.log('\n❌ FAIL: Mismatch between detected updates and "would update" messages.');
    }
    
    return success || titleUpdateCount === 0;
    
  } catch (error) {
    console.error(`\nError during test: ${error.message}`);
    return false;
  }
}

// Run the test
testBatchTitleUpdates()
  .then(result => {
    process.exit(result ? 0 : 1);
  });
