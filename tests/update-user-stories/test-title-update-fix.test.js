#!/usr/bin/env node

// Test script to verify that the fix for GitHub issue title updates is working
// This tests issue #308 specifically

import { execSync } from 'child_process';

async function testTitleUpdateFix() {
  console.log('Testing GitHub issue title update fix for issue #308...\n');
  
  try {
    // Run the update script in dry-run mode for issue 308
    console.log('Running update script in dry-run mode...');
    const output = execSync(
      'node scripts/update-user-stories.js --dry-run --issue 308 --type=enhancement',
      { encoding: 'utf8' }
    );
    
    console.log('=== Script Output ===');
    console.log(output);
    console.log('=== End Output ===\n');
    
    // Check if title update is mentioned in the output
    const containsTitleUpdate = output.includes('Title needs update');
    const containsDesignClean = output.includes('Design clean visual interface');
    const containsWouldUpdateTitle = output.includes('Would update title to:');
    
    console.log('Test Results:');
    console.log(`- Title update detected: ${containsTitleUpdate ? 'YES' : 'NO'}`);
    console.log(`- Contains new title text: ${containsDesignClean ? 'YES' : 'NO'}`);
    console.log(`- Would update title message: ${containsWouldUpdateTitle ? 'YES' : 'NO'}`);
    
    // Extract the proposed title if shown
    const titleMatch = output.match(/Would update title to: "([^"]+)"/);
    if (titleMatch) {
      console.log(`- Proposed title: "${titleMatch[1]}"`);
    }
    
    const success = containsTitleUpdate && containsWouldUpdateTitle;
    
    if (success) {
      console.log('\n✅ PASS: Title update fix is working correctly!');
      console.log('The script detects that issue #308 needs a title update.');
    } else {
      console.log('\n❌ FAIL: Title update fix is not working as expected.');
      console.log('The script should detect that issue #308 needs a title update.');
    }
    
    return success;
    
  } catch (error) {
    console.error(`\nError during test: ${error.message}`);
    return false;
  }
}

// Run the test
testTitleUpdateFix()
  .then(result => {
    process.exit(result ? 0 : 1);
  });
