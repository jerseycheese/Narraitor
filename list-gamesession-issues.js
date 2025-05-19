#!/usr/bin/env node

import { env } from 'process';

const GITHUB_API_URL = 'https://api.github.com';

async function findGameSessionIssues() {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  try {
    // Search for issues mentioning GameSession
    const searchQuery = encodeURIComponent('repo:jerseycheese/Narraitor GameSession state:open');
    const response = await fetch(`${GITHUB_API_URL}/search/issues?q=${searchQuery}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }

    const data = await response.json();
    console.log(`Found ${data.total_count} open issues mentioning GameSession:\n`);
    
    data.items.forEach((issue, index) => {
      const labels = issue.labels.map(l => l.name).join(', ');
      console.log(`${index + 1}. #${issue.number}: ${issue.title}`);
      console.log(`   State: ${issue.state}`);
      if (labels) {
        console.log(`   Labels: ${labels}`);
      }
      console.log(`   URL: ${issue.html_url}`);
      console.log('');
    });

    // Also search for game session (two words)
    const searchQuery2 = encodeURIComponent('repo:jerseycheese/Narraitor "game session" state:open');
    const response2 = await fetch(`${GITHUB_API_URL}/search/issues?q=${searchQuery2}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`\nFound ${data2.total_count} open issues mentioning "game session":\n`);
      
      data2.items.forEach((issue, index) => {
        // Skip if already showed in first search
        if (!data.items.find(i => i.number === issue.number)) {
          const labels = issue.labels.map(l => l.name).join(', ');
          console.log(`${index + 1}. #${issue.number}: ${issue.title}`);
          console.log(`   State: ${issue.state}`);
          if (labels) {
            console.log(`   Labels: ${labels}`);
          }
          console.log(`   URL: ${issue.html_url}`);
          console.log('');
        }
      });
    }
  } catch (error) {
    console.error('Error searching issues:', error.message);
    process.exit(1);
  }
}

findGameSessionIssues();