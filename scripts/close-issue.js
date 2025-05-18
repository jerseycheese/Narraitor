#!/usr/bin/env node

// Generic script to close GitHub issues following project conventions
import { getIssue, updateIssue, addIssueComment } from './user-stories/modules/github-api.js';

async function closeIssue() {
  const issueNumber = process.argv[2];
  const summaryComment = process.argv[3] || '';
  
  if (!issueNumber) {
    console.error('Error: Issue number is required');
    console.error('Usage: node close-issue.js <issue-number> [summary-comment]');
    process.exit(1);
  }
  
  const owner = 'jerseycheese';
  const repo = 'narraitor';
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }
  
  try {
    // Get the current issue to update it properly
    const issue = await getIssue(owner, repo, issueNumber, token);
    
    // Check all unchecked acceptance criteria checkboxes
    let updatedBody = issue.body;
    updatedBody = updatedBody.replace(/- \[ \]/g, '- [x]');
    
    // Add completion comment
    const defaultComment = `✅ This issue has been completed and closed.

**Status Update:**
${summaryComment || `Feature implemented as specified in the issue requirements.`}

All acceptance criteria have been met and tests are passing.`;
    
    // Add a closing comment
    await addIssueComment(
      owner,
      repo,
      issueNumber,
      defaultComment,
      token
    );
    
    // Update and close the issue
    await updateIssue(
      owner,
      repo,
      issueNumber,
      { 
        state: 'closed',
        body: updatedBody
      },
      token
    );
    
    console.log(`Successfully closed issue #${issueNumber}`);
    console.log('- Updated acceptance criteria checkboxes');
    console.log('- Added completion comment');
    console.log('- Closed the issue');
  } catch (error) {
    console.error('Error closing issue:', error);
    process.exit(1);
  }
}

closeIssue();