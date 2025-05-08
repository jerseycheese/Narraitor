// github-issue-utils.js
// API utilities for interacting with GitHub issues
import https from 'https';

const OWNER = 'jerseycheese';
const REPO = 'narraitor';
const TOKEN = process.env.GITHUB_TOKEN;

// Enhanced updateIssue function with case-insensitive label comparison
export async function updateIssue(issue, updatedBody, complexityLabel, priorityLabel, updatedTitle = null) {
  return new Promise((resolve, reject) => {
    // First update the body
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
            newLabels.push(complexityLabel);
            newLabels.push(priorityLabel);

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
                  reject(new Error(`Failed to update issue labels: ${labelResponseData}`));
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
          reject(new Error(`Failed to update issue: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}