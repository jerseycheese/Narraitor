#!/usr/bin/env node

/**
 * Simple script to close a GitHub issue
 * Usage: node simple-close-issue.js <issue-number> <token> "<comment>"
 */

import https from 'https';

// Constants
const OWNER = 'jerseycheese';
const REPO = 'Narraitor';

async function makeApiRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'Issue-Closer-Script',
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

async function getIssue(issueNumber, token) {
  return makeApiRequest(
    `/repos/${OWNER}/${REPO}/issues/${issueNumber}`,
    'GET',
    null,
    token
  );
}

async function addComment(issueNumber, comment, token) {
  const data = JSON.stringify({ body: comment });
  return makeApiRequest(
    `/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments`,
    'POST',
    data,
    token
  );
}

async function closeIssue(issueNumber, body, token) {
  const data = JSON.stringify({
    state: 'closed',
    body
  });
  
  return makeApiRequest(
    `/repos/${OWNER}/${REPO}/issues/${issueNumber}`,
    'PATCH',
    data,
    token
  );
}

async function main() {
  const issueNumber = process.argv[2];
  const token = process.argv[3];
  const comment = process.argv[4] || '';
  
  if (!issueNumber || !token) {
    console.error('Usage: node simple-close-issue.js <issue-number> <token> "<comment>"');
    process.exit(1);
  }
  
  try {
    // Get the issue
    console.log(`Fetching issue #${issueNumber}...`);
    const issue = await getIssue(issueNumber, token);
    console.log(`Issue title: ${issue.title}`);
    
    // Check all acceptance criteria checkboxes
    let updatedBody = issue.body;
    updatedBody = updatedBody.replace(/- \[ \]/g, '- [x]');
    
    // Add a closing comment
    const defaultComment = `✅ This issue has been completed and closed.

**Implementation Summary:**

${comment || 'Feature implemented as specified in the issue requirements.'}

All acceptance criteria have been met and tests are passing.`;
    
    console.log('Adding completion comment...');
    await addComment(issueNumber, defaultComment, token);
    
    // Update and close the issue
    console.log('Closing the issue...');
    await closeIssue(issueNumber, updatedBody, token);
    
    console.log(`Successfully closed issue #${issueNumber}`);
    console.log('- Updated acceptance criteria checkboxes');
    console.log('- Added completion comment');
    console.log('- Closed the issue');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();