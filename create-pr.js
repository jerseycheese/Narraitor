// Create PR for issue #363 - Implement standardized debug logging utility

try {
  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: "Fix #363: Implement standardized debug logging utility",
    body: `# Pull Request Template

## Description
Implemented a standardized debug logging utility for the application with severity levels, environment-based toggling, and formatted console output. The logger provides a consistent interface for debugging throughout the application while ensuring zero performance impact in production.

## Related Issue
Closes #363

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvements without changing functionality)
- [x] Documentation update
- [x] Test addition or improvement

## TDD Compliance
- [x] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

Created comprehensive test suite first covering all logger functionality including severity levels, environment toggling, timestamp formatting, and production suppression. All tests pass with 100% coverage.

## User Stories Addressed
As a developer, I want a standardized debug logging utility to help with debugging and diagnostics during development.

## Flow Diagrams
N/A - This is a utility function implementation

## Component Development
- [x] Storybook stories created/updated
- [x] Components developed in isolation first
- [x] Visual consistency verified

Created interactive Storybook story (Narraitor/Utilities/Logger) for testing the logger with:
- Toggle button for enabling/disabling logging
- Test buttons for each severity level
- Mock console output display
- Component name customization

## Implementation Notes
- Created Logger class at \`/src/lib/utils/logger.ts\` with severity levels (debug, info, warn, error)
- Environment-based toggling via \`NEXT_PUBLIC_DEBUG_LOGGING\` environment variable
- Automatic suppression in production builds (\`NODE_ENV === 'production'\`)
- Timestamp formatting with millisecond precision (\`HH:MM:SS.mmm\`)
- Context tracking for component/module identification
- Color-coded console output for different severity levels
- Refactored GameSession and SessionStore to use the logger instead of console.log
- Fixed CSS inheritance issues affecting text visibility in test harness
- Added "no inline styles" guideline to design system documentation
- Made \`isEnabled\` property public for testing purposes

## Screenshots
The logger provides color-coded console output:
- DEBUG: Gray text
- INFO: Blue text
- WARN: Orange text (bold)
- ERROR: Red text (bold)

Example output:
\`[11:43:40.535] INFO  [GameSessionTestHarness] Session started\`
\`[11:43:41.528] DEBUG [GameSession] Component rendering with worldId: world-1\`

## Testing Instructions
1. Run logger unit tests:
   \`\`\`bash
   npm test -- src/lib/utils/__tests__/logger.test.ts
   \`\`\`

2. Test with logging enabled in development:
   \`\`\`bash
   NEXT_PUBLIC_DEBUG_LOGGING=true npm run dev
   \`\`\`
   - Navigate to \`http://localhost:3000/dev/game-session\`
   - Click buttons to see logs in browser console

3. Test Storybook story:
   \`\`\`bash
   npm run storybook
   \`\`\`
   - Navigate to Narraitor > Utilities > Logger
   - Use toggle button and test severity levels

4. Verify production suppression:
   \`\`\`bash
   npm run build && npm run start
   \`\`\`
   - No logs should appear in production

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`,
    head: "feature/issue-363",
    base: "develop"
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  
  // Fallback: Provide URL for manual PR creation
  console.log("Please create the PR manually using this URL:");
  console.log("https://github.com/jerseycheese/narraitor/compare/develop...feature/issue-363");
}