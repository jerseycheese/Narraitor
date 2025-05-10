// github-issue-utils.js
// API utilities for interacting with GitHub issues
import https from 'https';

const OWNER = 'jerseycheese';
const REPO = 'narraitor';
// Using the environment variable directly rather than a constant

// Enhanced updateIssue function matching how it's called in process-issues.js
export async function updateIssue(owner, repo, issueNumber, updateData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(updateData);

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues/${issueNumber}`,
      method: 'PATCH',
      headers: {
        'User-Agent': 'User-Story-Update-Script',
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        } else {
          reject(new Error(`Failed to update issue: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Function to list issues with pagination
export async function listIssues(page = 1, perPage = 100) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues?state=open&per_page=${perPage}&page=${page}`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Update-Script',
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (err) {
            reject(new Error(`Failed to parse issue list response: ${err.message}`));
          }
        } else {
          reject(new Error(`Failed to list issues: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}