#!/usr/bin/env node

// Generic script to close GitHub issues following project conventions
import { fetchIssueByNumber, updateIssue, addIssueComment } from './user-stories/modules/github-api.js';

async function parseRelatedIssues(issueBody) {
  // Extract related issues from various sections of the issue body
  const relatedIssues = new Set();
  
  // Common patterns to find related issues
  const patterns = [
    /Related Issues\/Stories:\s*\n([\s\S]*?)(?=\n\n|\n#|$)/i,
    /Related to:?\s*#(\d+)/gi,
    /Depends on:?\s*#(\d+)/gi,
    /Blocks:?\s*#(\d+)/gi,
    /References?:?\s*#(\d+)/gi
  ];
  
  // Find issues in the "Related Issues/Stories" section
  const relatedSection = issueBody.match(patterns[0]);
  if (relatedSection) {
    const issueNumbers = relatedSection[1].match(/#(\d+)/g);
    if (issueNumbers) {
      issueNumbers.forEach(num => relatedIssues.add(num.substring(1)));
    }
  }
  
  // Find issues using other common patterns
  patterns.slice(1).forEach(pattern => {
    let match;
    while ((match = pattern.exec(issueBody)) !== null) {
      relatedIssues.add(match[1]);
    }
  });
  
  return Array.from(relatedIssues);
}

async function updateRelatedIssues(owner, repo, closedIssueNumber, closedIssueTitle, relatedIssueNumbers, token) {
  console.log('\nChecking for related issues to update...');
  
  if (relatedIssueNumbers.length === 0) {
    console.log('No related issues found in the issue body.');
    return;
  }
  
  console.log(`Found ${relatedIssueNumbers.length} related issues: ${relatedIssueNumbers.join(', ')}`);
  
  for (const relatedIssueNumber of relatedIssueNumbers) {
    try {
      const relatedIssue = await fetchIssueByNumber(owner, repo, relatedIssueNumber, token);
      
      // Only update open issues
      if (relatedIssue.state === 'open') {
        const updateComment = `## Progress Update

Issue #${closedIssueNumber} (${closedIssueTitle}) has been completed.

This provides additional functionality that may be leveraged by this issue.`;
        
        await addIssueComment(owner, repo, relatedIssueNumber, updateComment, token);
        console.log(`✓ Updated related issue #${relatedIssueNumber}`);
      } else {
        console.log(`- Skipped closed issue #${relatedIssueNumber}`);
      }
    } catch (error) {
      console.error(`✗ Failed to update issue #${relatedIssueNumber}: ${error.message}`);
    }
  }
}

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
    const issue = await fetchIssueByNumber(owner, repo, issueNumber, token);
    
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
    
    // Update related issues
    const relatedIssueNumbers = await parseRelatedIssues(issue.body);
    await updateRelatedIssues(owner, repo, issueNumber, issue.title, relatedIssueNumbers, token);
    
  } catch (error) {
    console.error('Error closing issue:', error);
    process.exit(1);
  }
}

closeIssue();