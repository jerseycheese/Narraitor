// GitHub API utility functions
// Provides standardized API calls with error handling and rate limiting protection

import https from 'https';
import { 
  API_BASE_URL, 
  RATE_LIMIT_PAUSE, 
  RATE_LIMIT_THRESHOLD,
  DEBUG_MODE
} from './config.js';

// Track rate limiting
let rateLimitRemaining = 5000; // GitHub default
let rateLimitReset = 0;

/**
 * Make a request to the GitHub API with rate limit protection
 * @param {string} method - HTTP method (GET, POST, PATCH, etc.)
 * @param {string} endpoint - API endpoint path (e.g., /repos/:owner/:repo/issues)
 * @param {Object|null} data - Optional data to send in the request body
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} - Parsed response data
 */
export async function githubRequest(method, endpoint, data = null, token) {
  // Check if we're approaching rate limit and need to slow down
  if (rateLimitRemaining < RATE_LIMIT_THRESHOLD) {
    const now = Math.floor(Date.now() / 1000);
    if (rateLimitReset > now) {
      const waitTime = Math.min((rateLimitReset - now) * 1000 + 100, RATE_LIMIT_PAUSE);
      if (DEBUG_MODE) {
        console.log(`Rate limit protection: waiting ${waitTime}ms (${rateLimitRemaining} requests remaining)`);
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'User-Agent': 'Narraitor-GitHub-Sync',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        // Update rate limit info from headers
        if (res.headers['x-ratelimit-remaining']) {
          rateLimitRemaining = parseInt(res.headers['x-ratelimit-remaining'], 10);
        }
        if (res.headers['x-ratelimit-reset']) {
          rateLimitReset = parseInt(res.headers['x-ratelimit-reset'], 10);
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(responseData ? JSON.parse(responseData) : {});
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        } else {
          // Specific handling for rate limiting
          if (res.statusCode === 403 && res.headers['x-ratelimit-remaining'] === '0') {
            reject(new Error(`GitHub API rate limit exceeded. Resets at ${new Date(rateLimitReset * 1000).toLocaleString()}`));
          } else {
            reject(new Error(`GitHub API request failed (${res.statusCode}): ${responseData}`));
          }
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Fetch all GitHub issues with pagination handling
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string[]} labels - Optional array of labels to filter by
 * @param {string} state - Issue state (open, closed, all)
 * @param {string} token - GitHub API token
 * @returns {Promise<Array>} - Array of issues
 */
export async function fetchAllIssues(owner, repo, labels = [], state = 'all', token) {
  let allIssues = [];
  let page = 1;
  let hasMore = true;

  const labelParam = labels.length > 0 ? `&labels=${labels.join(',')}` : '';
  
  while (hasMore) {
    try {
      const response = await githubRequest(
        'GET',
        `/repos/${owner}/${repo}/issues?state=${state}${labelParam}&per_page=100&page=${page}`,
        null,
        token
      );
      
      // Filter out pull requests
      const issues = response.filter(item => !item.pull_request);
      
      if (issues.length === 0) {
        hasMore = false;
      } else {
        allIssues = allIssues.concat(issues);
        page++;
      }
      
    } catch (error) {
      // Don't throw but log and return what we have so far
      console.error(`Error fetching issues page ${page}: ${error.message}`);
      hasMore = false;
    }
  }

  return allIssues;
}

/**
 * Fetch a single issue by number
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} - Issue object
 */
export async function fetchIssueByNumber(owner, repo, issueNumber, token) {
  return githubRequest('GET', `/repos/${owner}/${repo}/issues/${issueNumber}`, null, token);
}

/**
 * Create a new GitHub issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} title - Issue title
 * @param {string} body - Issue body
 * @param {string[]} labels - Array of label names
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} - Created issue
 */
export async function createIssue(owner, repo, title, body, labels = [], token) {
  return githubRequest(
    'POST',
    `/repos/${owner}/${repo}/issues`,
    { title, body, labels },
    token
  );
}

/**
 * Update an existing GitHub issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Object} updates - Fields to update (title, body, state, labels)
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} - Updated issue
 */
export async function updateIssue(owner, repo, issueNumber, updates, token) {
  return githubRequest(
    'PATCH',
    `/repos/${owner}/${repo}/issues/${issueNumber}`,
    updates,
    token
  );
}

/**
 * Add a comment to a GitHub issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} body - Comment body
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} - Created comment
 */
export async function addIssueComment(owner, repo, issueNumber, body, token) {
  return githubRequest(
    'POST',
    `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    { body },
    token
  );
}

/**
 * Verify that required labels exist in the repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string[]} requiredLabels - Array of required label names
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} - Object with exists (boolean) and missing (array)
 */
export async function verifyLabels(owner, repo, requiredLabels, token) {
  try {
    const labels = await githubRequest(
      'GET',
      `/repos/${owner}/${repo}/labels?per_page=100`,
      null,
      token
    );
    
    // Normalize label names for more reliable comparison (lowercase, trim)
    const normalizedLabels = labels.map(l => ({ 
      ...l, 
      normalizedName: l.name.toLowerCase().trim() 
    }));
    
    // Find missing labels with case-insensitive comparison
    const missingLabels = requiredLabels.filter(
      requiredLabel => !normalizedLabels.some(
        l => l.normalizedName === requiredLabel.toLowerCase().trim()
      )
    );
    
    return {
      exists: missingLabels.length === 0,
      missing: missingLabels
    };
  } catch (err) {
    console.warn(`Warning: Could not verify labels: ${err.message}`);
    return {
      exists: false,
      missing: requiredLabels,
      error: err.message
    };
  }
}
