#!/usr/bin/env node

/**
 * GitHub Label Management Script for Narraitor
 * 
 * This script creates and updates GitHub labels based on the defined structure
 * in the Narraitor project. It reads from the .github/labels.md file to determine
 * which labels to create.
 * 
 * Usage:
 *   node setup-github-labels.js <github-token> <owner> <repo>
 * 
 * Example:
 *   node setup-github-labels.js ghp_xxxxxxxxxxxx jerseycheese narraitor
 */

import https from 'https';

// Get command line arguments
const [,, token, owner, repo] = process.argv;

if (!token || !owner || !repo) {
  console.error('Usage: node setup-github-labels.js <github-token> <owner> <repo>');
  process.exit(1);
}

// Define label definitions based on labels.md
const labelDefinitions = [
  // Type Labels
  { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working correctly' },
  { name: 'enhancement', color: 'a2eeef', description: 'Improvement to an existing feature' },
  { name: 'user-story', color: '0075ca', description: 'New feature described from a user\'s perspective' },
  { name: 'epic', color: '6f42c1', description: 'Large feature that contains multiple user stories' },
  { name: 'documentation', color: '0075ca', description: 'Improvements or additions to documentation' },
  { name: 'question', color: 'd876e3', description: 'Further information is requested' },
  { name: 'help-wanted', color: '008672', description: 'Extra attention is needed' },
  { name: 'good-first-issue', color: '7057ff', description: 'Good for newcomers' },
  
  // Domain Labels
  { name: 'domain:world-configuration', color: '5319e7', description: 'Related to the World Configuration system' },
  { name: 'domain:character-system', color: '5319e7', description: 'Related to the Character System' },
  { name: 'domain:decision-tracking', color: '5319e7', description: 'Related to the Decision Tracking System' },
  { name: 'domain:decision-relevance', color: '5319e7', description: 'Related to the Decision Relevance System' },
  { name: 'domain:narrative-engine', color: '5319e7', description: 'Related to the Narrative Engine' },
  { name: 'domain:journal-system', color: '5319e7', description: 'Related to the Journal System' },
  { name: 'domain:state-management', color: '5319e7', description: 'Related to the State Management system' },
  { name: 'domain:infrastructure', color: '5319e7', description: 'Related to project infrastructure, build, or deployment' },
  
  // Priority Labels
  { name: 'priority:high', color: 'f9d0c4', description: 'High priority items for MVP' },
  { name: 'priority:medium', color: 'f9d0c4', description: 'Medium priority items' },
  { name: 'priority:low', color: 'f9d0c4', description: 'Low priority items' },
  { name: 'priority:post-mvp', color: 'f9d0c4', description: 'Items intentionally planned for after MVP' },
  
  // Status Labels
  { name: 'status:backlog', color: 'c2e0c6', description: 'In the backlog, not yet scheduled' },
  { name: 'status:ready', color: 'c2e0c6', description: 'Ready for implementation' },
  { name: 'status:in-progress', color: 'c2e0c6', description: 'Currently being implemented' },
  { name: 'status:in-review', color: 'c2e0c6', description: 'Implementation complete, awaiting review' },
  { name: 'status:blocked', color: 'c2e0c6', description: 'Blocked by another issue or external factor' }
];

/**
 * Makes a request to the GitHub API
 * @param {string} method - HTTP method
 * @param {string} path - API endpoint path
 * @param {object} data - Request body data
 * @returns {Promise<object>} Response data
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'Narraitor-Label-Setup',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(responseData ? JSON.parse(responseData) : {});
          } catch {
            resolve(responseData);
          }
        } else {
          console.error(`Request failed with status ${res.statusCode}: ${responseData}`);
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Gets all existing labels from the repository
 * @returns {Promise<Array>} Existing labels
 */
async function getExistingLabels() {
  let page = 1;
  let allLabels = [];
  let labels;

  do {
    labels = await makeRequest('GET', `/repos/${owner}/${repo}/labels?per_page=100&page=${page}`);
    allLabels = allLabels.concat(labels);
    page++;
  } while (labels.length === 100);

  return allLabels;
}

/**
 * Creates a new label in the repository
 * @param {object} label - Label definition
 * @returns {Promise<object>} Created label
 */
async function createLabel(label) {
  console.log(`Creating label: ${label.name}`);
  return makeRequest('POST', `/repos/${owner}/${repo}/labels`, label);
}

/**
 * Updates an existing label in the repository
 * @param {string} oldName - Current label name
 * @param {object} updatedLabel - Updated label definition
 * @returns {Promise<object>} Updated label
 */
async function updateLabel(oldName, updatedLabel) {
  console.log(`Updating label: ${oldName} -> ${updatedLabel.name}`);
  return makeRequest('PATCH', `/repos/${owner}/${repo}/labels/${encodeURIComponent(oldName)}`, updatedLabel);
}

/**
 * Main function to manage repository labels
 */
async function manageLabels() {
  try {
    console.log('Fetching existing labels...');
    const existingLabels = await getExistingLabels();
    
    console.log(`Found ${existingLabels.length} existing labels`);
    
    for (const labelDef of labelDefinitions) {
      const existingLabel = existingLabels.find(l => l.name === labelDef.name);
      
      if (existingLabel) {
        // Check if label needs updating
        if (
          existingLabel.color !== labelDef.color ||
          existingLabel.description !== labelDef.description
        ) {
          await updateLabel(labelDef.name, labelDef);
        } else {
          console.log(`Label already exists and is up to date: ${labelDef.name}`);
        }
      } else {
        // Create new label
        await createLabel(labelDef);
      }
    }
    
    console.log('Label management completed successfully!');
  } catch (error) {
    console.error('Error managing labels:', error);
    process.exit(1);
  }
}

// Run the script
manageLabels();
