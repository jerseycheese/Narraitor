#!/usr/bin/env node

import { env } from 'process';
import { readFileSync } from 'fs';

const GITHUB_API_URL = 'https://api.github.com';

async function createPullRequest() {
  const token = env.GITHUB_TOKEN || env.GITHUB_API_KEY;
  if (!token) {
    console.error('Error: GITHUB_TOKEN or GITHUB_API_KEY environment variable is not set');
    process.exit(1);
  }

  const prBody = readFileSync('/Users/jackhaas/Projects/narraitor/pr-content-361.md', 'utf8');
  
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/jerseycheese/Narraitor/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Fix #361: Refactor GameSession component to meet file size constraints',
        head: 'feature/issue-361',
        base: 'develop',
        body: prBody
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }

    const pullRequest = await response.json();
    console.log(`Pull request created: ${pullRequest.html_url}`);
  } catch (error) {
    console.error('Error creating pull request:', error.message);
    process.exit(1);
  }
}

createPullRequest();