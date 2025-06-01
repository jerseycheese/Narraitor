#!/usr/bin/env node

/**
 * Script to update related issues with progress notes
 * Usage: node update-related-issues.js <completed-issue-number> <token> [relation-depth]
 * 
 * This script finds issues related to the completed issue and adds a progress update
 * comment to each one. It uses the GitHub search API to find issues that mention
 * the completed issue number.
 * 
 * Parameters:
 * - completed-issue-number: The issue number that was just implemented
 * - token: GitHub personal access token with repo permissions
 * - relation-depth: (Optional) How many levels of relation to traverse (default: 1)
 */

import https from 'https';

// Constants
const OWNER = 'jerseycheese';
const REPO = 'Narraitor';

/**
 * Make a GitHub API request
 * @param {string} path - API endpoint path
 * @param {string} method - HTTP method
 * @param {string|null} data - Request body data
 * @param {string} token - GitHub token
 * @returns {Promise<object>} - Response data
 */
async function makeApiRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'Issue-Updater-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (err) {
            if (responseData.trim()) {
              resolve(responseData);
            } else {
              resolve({ status: 'success' });
            }
          }
        } else {
          reject(new Error(`API request failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Get issue details
 * @param {string} issueNumber - Issue number
 * @param {string} token - GitHub token
 * @returns {Promise<object>} - Issue details
 */
async function getIssue(issueNumber, token) {
  return makeApiRequest(
    `/repos/${OWNER}/${REPO}/issues/${issueNumber}`,
    'GET',
    null,
    token
  );
}

/**
 * Add a comment to an issue
 * @param {string} issueNumber - Issue number
 * @param {string} comment - Comment text
 * @param {string} token - GitHub token
 * @returns {Promise<object>} - Comment creation result
 */
async function addComment(issueNumber, comment, token) {
  const data = JSON.stringify({ body: comment });
  return makeApiRequest(
    `/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments`,
    'POST',
    data,
    token
  );
}

/**
 * Get PR details
 * @param {string} prNumber - PR number
 * @param {string} token - GitHub token
 * @returns {Promise<object>} - PR details
 */
async function getPR(prNumber, token) {
  return makeApiRequest(
    `/repos/${OWNER}/${REPO}/pulls/${prNumber}`,
    'GET',
    null,
    token
  );
}

/**
 * Extract a summary of changes from PR body or issue body
 * @param {string} body - PR or issue body
 * @returns {string[]} - Array of changes
 */
function extractChanges(body) {
  // Look for common patterns in PR and issue bodies that indicate changes
  const changes = [];
  
  // Match bullet points after specific headers
  const sections = [
    'Implementation Notes',
    'Changes',
    'What Changed',
    'Implemented Features',
    'Summary',
    'Description'
  ];
  
  for (const section of sections) {
    const regex = new RegExp(`## *${section}[\\s\\S]*?\\n((?:- [^\\n]+\\n)+)`, 'i');
    const match = body.match(regex);
    if (match && match[1]) {
      const bullets = match[1].split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.trim().substring(2).trim());
      changes.push(...bullets);
    }
  }
  
  // If nothing was found, extract general bullet points
  if (changes.length === 0) {
    const bulletPoints = body.match(/- [^\n]+/g);
    if (bulletPoints) {
      changes.push(...bulletPoints.map(bp => bp.substring(2).trim()));
    }
  }
  
  // Limit the number of changes to the most relevant ones
  if (changes.length > 5) {
    return changes.slice(0, 5);
  }
  
  return changes.length > 0 ? changes : ['Implementation of the required functionality'];
}

/**
 * Find related issues based on cross-references
 * @param {string} issueNumber - Issue number
 * @param {string} token - GitHub token
 * @returns {Promise<string[]>} - Array of related issue numbers
 */
async function findRelatedIssues(issueNumber, token) {
  try {
    // Search for issues that mention this issue
    const searchQuery = encodeURIComponent(`repo:${OWNER}/${REPO} is:issue is:open #${issueNumber} in:body OR in:comments -number:${issueNumber}`);
    const searchResults = await makeApiRequest(
      `/search/issues?q=${searchQuery}&per_page=100`,
      'GET',
      null,
      token
    );
    
    return searchResults.items?.map(item => item.number.toString()) || [];
  } catch (error) {
    console.error(`Error finding related issues: ${error.message}`);
    return [];
  }
}

/**
 * Get PR for the completed issue
 * @param {string} issueNumber - Issue number
 * @param {string} token - GitHub token
 * @returns {Promise<object|null>} - PR object or null
 */
async function findPRForIssue(issueNumber, token) {
  try {
    // Search for PRs that close this issue
    const searchQuery = encodeURIComponent(`repo:${OWNER}/${REPO} is:pr is:open OR is:closed "closes #${issueNumber}" OR "close #${issueNumber}" OR "fixes #${issueNumber}" OR "fix #${issueNumber}" OR "resolves #${issueNumber}" OR "resolve #${issueNumber}"`);
    const searchResults = await makeApiRequest(
      `/search/issues?q=${searchQuery}&per_page=10`,
      'GET',
      null,
      token
    );
    
    if (searchResults.items?.length > 0) {
      // Get the first PR (most relevant)
      const prNumber = searchResults.items[0].number;
      return await getPR(prNumber, token);
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding PR for issue: ${error.message}`);
    return null;
  }
}

/**
 * Update related issues with progress info
 * @param {string} completedIssueNumber - Completed issue number
 * @param {string} token - GitHub token
 * @param {number} relationDepth - How many levels of relation to traverse
 */
async function updateRelatedIssues(completedIssueNumber, token, relationDepth = 1) {
  try {
    // Get the completed issue details
    const completedIssue = await getIssue(completedIssueNumber, token);
    console.log(`Updating related issues for: #${completedIssueNumber} - ${completedIssue.title}`);
    
    // Find any associated PR
    const pr = await findPRForIssue(completedIssueNumber, token);
    
    // Extract changes from PR body or issue body
    let changes = [];
    if (pr) {
      console.log(`Found associated PR #${pr.number}: ${pr.title}`);
      changes = extractChanges(pr.body);
    } else {
      changes = extractChanges(completedIssue.body);
    }
    
    // If we couldn't extract detailed changes, use a generic message
    if (changes.length === 0) {
      changes = [
        'Implemented the required functionality',
        'Added tests to verify behavior',
        'Ensured code quality and maintainability'
      ];
    }
    
    // Find related issues
    const processedIssues = new Set();
    let relatedIssues = await findRelatedIssues(completedIssueNumber, token);
    let allRelatedIssues = [...relatedIssues];
    processedIssues.add(completedIssueNumber);
    
    // If relation depth > 1, find issues related to the related issues
    for (let depth = 1; depth < relationDepth; depth++) {
      const nextLevelIssues = [];
      for (const relIssue of relatedIssues) {
        if (!processedIssues.has(relIssue)) {
          const secondaryRelatedIssues = await findRelatedIssues(relIssue, token);
          nextLevelIssues.push(...secondaryRelatedIssues);
          processedIssues.add(relIssue);
        }
      }
      // Filter out already processed issues and update the related issues list
      const newIssues = nextLevelIssues.filter(issue => !processedIssues.has(issue));
      allRelatedIssues = [...allRelatedIssues, ...newIssues];
      relatedIssues = newIssues;
    }
    
    // Remove duplicates
    const uniqueRelatedIssues = [...new Set(allRelatedIssues)].filter(
      issue => issue !== completedIssueNumber
    );
    
    if (uniqueRelatedIssues.length === 0) {
      console.log('No related issues found. Nothing to update.');
      return;
    }
    
    console.log(`Found ${uniqueRelatedIssues.length} related issues:`);
    uniqueRelatedIssues.forEach(issue => console.log(`- #${issue}`));
    
    // Prepare the update comment
    const prLink = pr ? `PR #${pr.number} (${pr.html_url})` : 'Implementation PR';
    const updateComment = `## Progress Update

Issue #${completedIssueNumber} (${completedIssue.title}) has been completed.

The implementation includes:
${changes.map(change => `- ${change}`).join('\n')}

This provides additional functionality or context that may be relevant to this issue.

See ${prLink} for more details.`;
    
    // Update each related issue
    for (const relatedIssueNumber of uniqueRelatedIssues) {
      try {
        // Check if the related issue is still open
        const relatedIssue = await getIssue(relatedIssueNumber, token);
        
        if (relatedIssue.state === 'open') {
          console.log(`Adding comment to issue #${relatedIssueNumber}: ${relatedIssue.title}`);
          await addComment(relatedIssueNumber, updateComment, token);
          console.log(`✓ Updated related issue #${relatedIssueNumber}`);
        } else {
          console.log(`- Skipped closed issue #${relatedIssueNumber}`);
        }
      } catch (error) {
        console.error(`✗ Failed to update issue #${relatedIssueNumber}: ${error.message}`);
      }
      
      // Add a small delay to prevent rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('Finished updating related issues');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Main execution
const completedIssueNumber = process.argv[2];
const token = process.argv[3];
const relationDepth = process.argv[4] ? parseInt(process.argv[4]) : 1;

if (!completedIssueNumber || !token) {
  console.error('Usage: node update-related-issues.js <completed-issue-number> <token> [relation-depth]');
  process.exit(1);
}

updateRelatedIssues(completedIssueNumber, token, relationDepth);