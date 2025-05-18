I'll help you create a high-quality pull request for the changes we've made for $ARGUMENTS.

Let me:
1. First summarize and organize the changes we've made
2. Prepare a detailed PR description
3. Handle git operations and create the PR

Let me check the diff first:
```bash
git diff
```

Now I'll prepare a comprehensive PR with:

# Pull Request: $ARGUMENTS

## Summary
[Brief summary of changes]

## Changes Made
- [Change 1]
- [Change 2]
- [Change 3]

## Testing Done
- [Test 1]
- [Test 2]
- [Test 3]

## Screenshots / GIFs
[If applicable]

## Implementation Notes
[Any special implementation considerations]

## Breaking Changes
[List any breaking changes]

## Related Issues
Closes #[issue number]

## Reviewers
[Suggested reviewers if any]

I'll create a feature branch and commit the changes:
```bash
git checkout -b feature/$ARGUMENTS
git add .
git commit -m "Fix: $ARGUMENTS"
git push origin feature/$ARGUMENTS
```

Then I'll create the PR using the MCP GitHub tool:

```javascript
```javascript
// Create PR using MCP GitHub tool
try {
  // Read the PR template and customize it
  const templateContent = `# Pull Request Template

## Description
${$ARGUMENTS}

## Related Issue
<!-- Link to the issue this PR addresses (if applicable) -->
Closes # <!-- Add issue number if applicable -->

## Type of Change
<!-- Check the relevant option(s) -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvements without changing functionality)
- [ ] Documentation update
- [ ] Test addition or improvement

## TDD Compliance
- [x] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

## User Stories Addressed
<!-- List the user stories this PR addresses -->

## Implementation Notes
<!-- Any important details about the implementation others should know -->

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed`;

  const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
    owner: "jerseycheese",
    repo: "narraitor",
    title: `Fix: ${$ARGUMENTS}`,
    body: templateContent,
    head: `feature/${$ARGUMENTS}`,
    base: "develop"
  });
  
  console.log(`Successfully created PR: ${pullRequest.html_url}`);
} catch (error) {
  console.error("Error creating PR with MCP GitHub tool:", error);
  
  // Provide URL for manual PR creation
  console.log("Please create the PR manually using this URL:");
  console.log(`https://github.com/jerseycheese/narraitor/compare/develop...feature/${$ARGUMENTS}`);
}
```

Note: I'll follow our semantic commit message conventions and make sure to link to any issues it resolves.
