// github-issue-utils.js
// API utilities for interacting with GitHub issues
import https from 'https';

const OWNER = 'jerseycheese';
const REPO = 'narraitor';
const TOKEN = process.env.GITHUB_TOKEN;

// Enhanced updateIssue function with case-insensitive label comparison
export async function updateIssue(issue, updatedBody, complexityLabel, priorityLabel, updatedTitle = null) {
  return new Promise((resolve, reject) => {
    const updateData = { body: updatedBody };
    if (updatedTitle !== null) {
      updateData.title = updatedTitle;
    }

    const data = JSON.stringify(updateData);

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues/${issue.number}`,
      method: 'PATCH',
      headers: {
        'User-Agent': 'User-Story-Update-Script',
        'Authorization': `token ${TOKEN}`,
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
            // Now update labels if needed
            const currentLabels = issue.labels || [];
            const newLabels = [];

            // Keep all non-complexity/non-priority labels (case-insensitive check)
            for (const label of currentLabels) {
              const labelName = typeof label === 'object' ? label.name : label;
              const lowerLabelName = labelName.toLowerCase();

              // Only keep labels that aren't complexity or priority labels
              if (!lowerLabelName.startsWith('complexity:') && !lowerLabelName.startsWith('priority:')) {
                newLabels.push(labelName);
              }
            }

            // Add the new labels
            if (complexityLabel) newLabels.push(complexityLabel);
            if (priorityLabel) newLabels.push(priorityLabel);

            // Update labels
            const labelData = JSON.stringify({ labels: newLabels });
            const labelOptions = {
              hostname: 'api.github.com',
              path: `/repos/${OWNER}/${REPO}/issues/${issue.number}`,
              method: 'PATCH',
              headers: {
                'User-Agent': 'User-Story-Update-Script',
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Content-Length': labelData.length
              }
            };

            const labelReq = https.request(labelOptions, labelRes => {
              let labelResponseData = '';
              labelRes.on('data', chunk => (labelResponseData += chunk));
              labelRes.on('end', () => {
                if (labelRes.statusCode >= 200 && labelRes.statusCode < 300) {
                  try {
                    resolve(JSON.parse(labelResponseData));
                  } catch (err) {
                    reject(new Error(`Failed to parse label response: ${err.message}`));
                  }
                } else {
                  reject(new Error(`Failed to update issue labels: ${labelRes.statusCode} - ${labelResponseData}`));
                }
              });
            });

            labelReq.on('error', reject);
            labelReq.write(labelData);
            labelReq.end();
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
        'Authorization': `token ${TOKEN}`,
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