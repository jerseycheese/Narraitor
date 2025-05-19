#!/usr/bin/env node

const github = require('@actions/github');
const fs = require('fs');

async function createPullRequest() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  const octokit = github.getOctokit(token);
  
  const prBody = fs.readFileSync('/Users/jackhaas/Projects/narraitor/pr-content-361.md', 'utf8');
  
  try {
    const { data: pullRequest } = await octokit.rest.pulls.create({
      owner: 'jerseycheese',
      repo: 'Narraitor',
      title: 'Fix #361: Refactor GameSession component to meet file size constraints',
      head: 'feature/issue-361',
      base: 'develop',
      body: prBody
    });
    
    console.log(`Pull request created: ${pullRequest.html_url}`);
  } catch (error) {
    console.error('Error creating pull request:', error.message);
    if (error.status === 422) {
      console.error('Possible reasons: branch does not exist, PR already exists, or invalid base/head branch');
    }
    process.exit(1);
  }
}

createPullRequest();