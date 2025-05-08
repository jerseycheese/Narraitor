// GitHub API interaction module
import https from 'https';
import { graphql } from '@octokit/graphql';
import { OWNER, REPO, TOKEN, PROJECT_BOARD_URL } from './config.js';

// Initialize Octokit GraphQL client
const octokit = graphql.defaults({
  headers: {
    authorization: `token ${TOKEN}`
  }
});

// Verify labels in repository
export async function verifyLabels() {
  try {
    // Check for complexity labels
    console.log('Checking for complexity labels...');
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/labels`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Migration-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const labels = await new Promise((resolve, reject) => {
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
            reject(new Error(`Failed to get labels: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    // Check for complexity labels
    const complexityLabels = ['complexity:small', 'complexity:medium', 'complexity:large'];
    const missingLabels = complexityLabels.filter(
      label => !labels.some(l => l.name === label)
    );
    
    if (missingLabels.length > 0) {
      console.warn(`Warning: Missing complexity labels: ${missingLabels.join(', ')}`);
      console.warn('Run "node scripts/github/setup-github-labels.js" to create all required labels before proceeding.');
    } else {
      console.log('All complexity labels exist.');
    }
  } catch (err) {
    console.warn(`Warning: Could not verify labels: ${err.message}`);
    console.warn('Run "node scripts/github/setup-github-labels.js" to ensure all required labels exist.');
  }
}

// Check if a user story has already been migrated
export async function checkExistingStories(domain) {
  try {
    console.log(`Checking for existing stories in domain: ${domain}...`);
    const labels = [`domain:${domain}`, 'user-story'];
    const labelsParam = `labels=${labels.map(encodeURIComponent).join(',')}`;
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues?${labelsParam}&state=all&per_page=100`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Migration-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const existingIssues = await new Promise((resolve, reject) => {
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
            reject(new Error(`Failed to get issues: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log(`Found ${existingIssues.length} existing stories for domain: ${domain}`);
    return existingIssues.map(issue => issue.title);
  } catch (err) {
    console.warn(`Warning: Could not check existing stories: ${err.message}`);
    return [];
  }
}

// Create a GitHub issue
export function createIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ title: issue.title, body: issue.body, labels: issue.labels });
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues`,
      method: 'POST',
      headers: {
        'User-Agent': 'User-Story-Migration-Script',
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
            resolve(JSON.parse(responseData));
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        } else {
          reject(new Error(`Failed to create issue: ${responseData}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Filter user stories that already exist in GitHub
export async function filterExistingStories(userStories, domain) {
  try {
    const existingTitles = await checkExistingStories(domain);
    const filtered = userStories.filter(story => {
      const exists = existingTitles.includes(story.title);
      if (exists) {
        console.log(`Skipping existing story: ${story.title}`);
      }
      return !exists;
    });
    
    console.log(`Found ${userStories.length - filtered.length} existing stories that will be skipped.`);
    return filtered;
  } catch (error) {
    console.warn(`Error while filtering existing stories: ${error.message}`);
    return userStories;
  }
}

// Function to get the ProjectV2 ID from the URL
export async function getProjectId(projectUrl) {
  try {
    const urlParts = projectUrl.split('/');
    const owner = urlParts[urlParts.length - 3]; // 'users' or organization name
    const projectNumber = parseInt(urlParts[urlParts.length - 1], 10);

    if (isNaN(projectNumber)) {
      throw new Error(`Invalid project number in URL: ${projectUrl}`);
    }

    // Determine if it's a user or organization project
    const query = urlParts[urlParts.length - 4] === 'users'
      ? `
        query($login: String!, $number: Int!) {
          user(login: $login) {
            projectV2(number: $number) {
              id
            }
          }
        }
      `
      : `
        query($login: String!, $number: Int!) {
          organization(login: $login) {
            projectV2(number: $number) {
              id
            }
          }
        }
      `;

    const variables = {
      login: owner,
      number: projectNumber,
    };

    const result = await octokit(query, variables);

    if (urlParts[urlParts.length - 4] === 'users') {
      return result.user?.projectV2?.id;
    } else {
      return result.organization?.projectV2?.id;
    }

  } catch (error) {
    console.error(`Error fetching project ID for ${projectUrl}: ${error.message}`);
    return null;
  }
}

// Function to add an issue to a ProjectV2 board
export async function addIssueToProject(projectId, issueNodeId) {
  try {
    const mutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          item {
            id
          }
        }
      }
    `;

    const variables = {
      projectId: projectId,
      contentId: issueNodeId,
    };

    const result = await octokit(mutation, variables);
    console.log(`Added issue to project: ${result.addProjectV2ItemById.item.id}`);
    return true;
  } catch (error) {
    console.error(`Error adding issue to project: ${error.message}`);
    return false;
  }
}



// Create GitHub issues for user stories
/**
 * Creates GitHub issues for a given array of user story objects.
 * Prompts the user for confirmation before proceeding.
 * Attempts to add created issues to a configured project board.
 *
 * @param {Array<Object>} userStories - An array of user story objects, each expected to have `title`, `body`, and `labels`.
 * @returns {Promise<{created: number, errors: number, skipped: number}>} An object containing the counts of created issues, errors, and skipped stories (if operation is cancelled).
 */
export async function createIssuesForUserStories(userStories) {
  const count = userStories.length;
  if (count === 0) {
    console.log('No new user stories to create.');
    return { created: 0, errors: 0, skipped: 0 };
  }

  console.log(`Ready to create ${count} GitHub issues. Continue? (y/n)`);
  const proceed = await new Promise(resolve =>
    process.stdin.once('data', data => resolve(data.toString().trim().toLowerCase() === 'y'))
  );
  if (!proceed) {
    console.log('Operation cancelled');
    return { created: 0, errors: 0, skipped: count };
  }

  let created = 0, errors = 0;
  console.log('Creating GitHub issues...');

  // Fetch project ID once
  const projectId = await getProjectId(PROJECT_BOARD_URL);
  if (!projectId) {
    console.error('Could not retrieve project ID. Skipping project assignment.');
  }

  
  for (const [index, story] of userStories.entries()) {
    try {
      console.log(`Creating issue ${index + 1}/${count}: ${story.title}`);
      const issue = await createIssue(story);
      console.log(`Created issue #${issue.number}: ${issue.html_url}`);

      // Add issue to project board if project ID was fetched successfully
      if (projectId) {
        // The createIssue function using REST API doesn't return the Node ID directly.
        // We need to fetch the issue again using GraphQL to get the Node ID.
        const issueNodeId = await getIssueNodeId(issue.number);
        if (issueNodeId) {
          await addIssueToProject(projectId, issueNodeId);
        } else {
          console.warn(`Could not get Node ID for issue #${issue.number}. Skipping project assignment for this issue.`);
        }
      }

      created++;
      await new Promise(r => setTimeout(r, 1000)); // Add a delay to avoid hitting API rate limits
    } catch (err) {
      console.error(`Error creating issue: ${err.message}`);
      errors++;
    }
  }
  return { created, errors, skipped: 0 };
}

// Function to get the Node ID of an issue using GraphQL
export async function getIssueNodeId(issueNumber) {
  try {
    const query = `
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            id
          }
        }
      }
    `;

    const variables = {
      owner: OWNER,
      repo: REPO,
      issueNumber: issueNumber,
    };

    const result = await octokit(query, variables);
    return result.repository?.issue?.id;
  } catch (error) {
    console.error(`Error fetching Node ID for issue #${issueNumber}: ${error.message}`);
    return null;
  }
}
