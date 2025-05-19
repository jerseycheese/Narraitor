#!/usr/bin/env node

import { env } from 'process';

const GITHUB_API_URL = 'https://api.github.com';

async function addComment() {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  const commentBody = `📝 **Update**: The GameSession component that was implemented as part of this issue has been refactored in #361 to meet the project's file size constraints. The component was split from 445 lines to 230 lines using the Container/Presenter pattern, creating focused sub-components while maintaining all existing functionality.`;
  
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/jerseycheese/Narraitor/issues/344/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: commentBody
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }

    const comment = await response.json();
    console.log(`Comment added to issue #344: ${comment.html_url}`);
  } catch (error) {
    console.error('Error adding comment:', error.message);
    process.exit(1);
  }
}

addComment();