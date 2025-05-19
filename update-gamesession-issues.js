#!/usr/bin/env node

import { env } from 'process';

const GITHUB_API_URL = 'https://api.github.com';

async function updateRelatedIssues() {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  const issuesToUpdate = [
    {
      number: 364,
      comment: `📝 **Update**: The GameSession component has been refactored in PR #376 (issue #361). Please ensure documentation is updated to reflect the new component structure:
- GameSession (container component, 230 lines)
- PlayerChoices (handles player choice UI)
- SessionControls (pause/resume/end controls)
- GameSessionLoading, GameSessionError, GameSessionActive (state components)
- useGameSessionState (state management hook)`
    },
    {
      number: 362,
      comment: `📝 **Update**: The GameSession component has been refactored in PR #376 (issue #361) and now has tests for all new components:
- 39 tests total, all passing
- Tests for PlayerChoices, SessionControls, GameSessionLoading, GameSessionError, GameSessionActive
- Tests for useGameSessionState hook
- Test coverage has been improved with the refactoring`
    }
  ];

  for (const issue of issuesToUpdate) {
    try {
      const response = await fetch(`${GITHUB_API_URL}/repos/jerseycheese/Narraitor/issues/${issue.number}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: issue.comment
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message}`);
      }

      const comment = await response.json();
      console.log(`Comment added to issue #${issue.number}: ${comment.html_url}`);
    } catch (error) {
      console.error(`Error adding comment to issue #${issue.number}:`, error.message);
    }
  }
}

updateRelatedIssues();