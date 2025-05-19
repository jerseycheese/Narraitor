#!/usr/bin/env node

const { execSync } = require('child_process');

// GitHub API endpoint for issue comments
const owner = 'jerseycheese';
const repo = 'Narraitor';
const issueNumber = 106;
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;

// Comment content
const comment = `## Progress Update

Issue #363 (Implement standardized debug logging utility for the application) has been completed.

This provides the debug logging utility with severity levels that was requested in this issue. The implementation includes:
- Multiple severity levels (debug, info, warn, error)
- Environment-based toggling via NEXT_PUBLIC_DEBUG_LOGGING
- Automatic suppression in production builds
- Timestamp formatting and context tracking
- Color-coded console output for better readability

The logger is now available at \`/src/lib/utils/logger.ts\` and has been integrated into GameSession and SessionStore components.`;

// Prepare the JSON payload
const payload = JSON.stringify({ body: comment });

// Build the curl command
const curlCommand = `curl -X POST ${apiUrl} \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer \${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Content-Type: application/json" \
  -d '${payload.replace(/'/g, "'\"'\"'")}'`;

console.log('Adding comment to issue #106 about completion of issue #363...');
console.log('Executing curl command...\n');

try {
  // Execute the curl command
  const result = execSync(curlCommand, { encoding: 'utf8' });
  
  // Parse the response
  const response = JSON.parse(result);
  console.log('Success! Comment added to issue #106');
  console.log(`Comment URL: ${response.html_url}`);
} catch (error) {
  console.error('Error adding comment to issue:', error.message);
  process.exit(1);
}