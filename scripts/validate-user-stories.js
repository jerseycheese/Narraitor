// validate-user-stories.js
// This script checks for inconsistencies between GitHub issues and requirement docs
// Usage: node scripts/validate-user-stories.js [--issue 123] [--limit 10]

import { 
  validateIssuesAgainstDocs
} from './story-validation-utils.js';
import {
  fetchIssues,
  fetchIssueByNumber
} from './update-user-stories.js';

const TOKEN = process.env.GITHUB_TOKEN;

async function main() {
  // Check for GitHub token
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1], 10) : null;
  
  // Issue number to process
  const issueNumIndex = args.indexOf('--issue');
  const specificIssueNum = issueNumIndex !== -1 && args[issueNumIndex + 1] ? parseInt(args[issueNumIndex + 1], 10) : null;
  
  console.log(`User Story Validation Script`);
  console.log(`-------------------------------------`);
  
  try {
    // Process specific issue if requested
    if (specificIssueNum) {
      console.log(`\nFetching specific issue #${specificIssueNum}...`);
      const issue = await fetchIssueByNumber(specificIssueNum);
      console.log(`Processing single issue #${issue.number}`);
      
      await validateIssuesAgainstDocs([issue]);
      
      console.log(`\nCompleted validation of issue #${specificIssueNum}`);
      process.exit(0);
    }
    
    // Fetch user story issues
    console.log(`\nFetching user story issues...`);
    let issues = await fetchIssues(['user-story']);
    
    // Apply limit if specified
    if (limit && limit < issues.length) {
      console.log(`Limiting to first ${limit} issues.`);
      issues = issues.slice(0, limit);
    }
    
    // Run validation
    const inconsistencies = await validateIssuesAgainstDocs(issues);
    
    if (inconsistencies.length > 0) {
      console.log(`\nInconsistencies Found (${inconsistencies.length}):`);
      inconsistencies.forEach(issue => {
        console.log(`- Issue #${issue.issue}: ${issue.title}`);
        console.log(`  Domain: ${issue.domain}`);
        console.log(`  Story: ${issue.storyText}`);
        
        if (issue.currentComplexity !== issue.expectedComplexity) {
          console.log(`  Complexity: ${issue.currentComplexity} (expected: ${issue.expectedComplexity})`);
        }
        
        if (issue.currentPriority !== issue.expectedPriority) {
          console.log(`  Priority: ${issue.currentPriority} (expected: ${issue.expectedPriority})`);
        }
        
        console.log('');
      });
      
      console.log('Run "node scripts/update-user-stories.js" to fix these inconsistencies.');
    } else {
      console.log('\nAll issues are consistent with requirement docs!');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Start execution
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});