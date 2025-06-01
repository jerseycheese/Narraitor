# Claude Code Best Practices Guide for Narraitor

## Overview
This guide outlines the best practices for using Claude Code in the Narraitor project, focusing on how to leverage Claude Code alongside Claude App to create an optimal development workflow.

## When to Use Claude Code vs. Claude App

### Use Claude Code For:
- **Code Implementation**: Writing, modifying, and refactoring code directly in your codebase
- **Test Writing & Fixing**: Creating and debugging test files
- **Build Error Resolution**: Fixing build errors and resolving compiler issues
- **File Navigation**: Exploring and understanding the codebase structure
- **Running Commands**: Executing tests, build processes, and other CLI commands
- **Git Operations**: Creating commits, managing PRs, resolving merge conflicts
- **Rapid Iteration**: Quick back-and-forth on implementation details
- **File-Specific Tasks**: When focused on specific files or directories

### Use Claude App For:
- **High-Level Planning**: Feature planning, architecture decisions, workflow development
- **Technical Specifications**: Developing detailed specs before implementation
- **Design Decisions**: Making high-level design choices
- **Research**: Research on best practices or technical approaches
- **Documentation Creation**: Writing documentation, guides, and explanations
- **Complex Problem Analysis**: Breaking down complex problems into steps
- **Visual Design**: UI/UX planning with diagrams or mockups
- **Cross-Reference Research**: When you need to reference multiple external resources

## Claude Code Commands

### Basic Commands
- `claude`: Start interactive session in current directory
- `claude "how do I implement this feature?"`: Start with initial query
- `claude -p "fix this build error"`: Run one-shot command (non-interactive)
- `claude -c`: Continue most recent conversation
- `claude config`: Configure settings
- `claude update`: Update to latest version

### Slash Commands (In Session)
- `/bug`: Report bugs to Anthropic
- `/clear`: Clear conversation history
- `/config`: View/modify configuration
- `/cost`: Show token usage statistics
- `/help`: Get usage help
- `/init`: Initialize project with CLAUDE.md guide
- `/memory`: Edit CLAUDE.md memory files
- `/terminal-setup`: Configure terminal for better experience

## Project Context Management

### Using CLAUDE.md Files
- **Project Memory** (./CLAUDE.md): Team-shared conventions and knowledge
- **Local Project Memory** (./CLAUDE.local.md): Personal project preferences
- **User Memory** (~/.claude/CLAUDE.md): Global personal preferences

### Quick Memory Addition
- Start input with `#` to quickly add to memory
- Example: `# Components should follow the Three-Stage Component Testing approach`

## Using MCP GitHub Tools

### Overview
Claude Code should use the MCP GitHub tools for all GitHub operations instead of the `gh` CLI commands. This approach provides several advantages:
- No permission prompts that interrupt the workflow
- Better error handling with clear fallback mechanisms
- More consistent behavior across different environments

### MCP GitHub Tool Examples
```javascript
// Fetching an issue
const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123
});

// Creating a PR
const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
  owner: "jerseycheese",
  repo: "narraitor",
  title: "Fix #123: Implement feature X",
  body: "PR description...",
  head: "feature/issue-123",
  base: "develop"
});

// Closing an issue
await mcp__modelcontextprotocol_server_github__server_github.updateIssue({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123,
  state: "closed"
});

// Adding a comment to an issue
await mcp__modelcontextprotocol_server_github__server_github.addIssueComment({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123,
  body: "Issue implementation completed!"
});
```

### Helper Scripts for GitHub Operations
The project provides helper scripts for GitHub operations:
- `scripts/claude-github.sh`: For flexible GitHub API operations
- `scripts/fetch-github-issue.sh`: For fetching issue details

When the MCP GitHub tool is not available, Claude Code should use these helper scripts instead of direct `gh` CLI commands.

## Workflow Integration Strategies

### 1. Planning Phase in Claude App
1. Use Claude App to develop high-level technical specifications
2. Create a detailed implementation plan with test specifications
3. Export this plan as a markdown file
4. Reference this file in Claude Code to guide implementation

### 2. Implementation Phase in Claude Code
1. Start Claude Code in the project directory
2. Reference the implementation plan: `claude "implement the feature described in docs/plans/feature-xyz.md"`
3. Let Claude Code explore the codebase and suggest an implementation approach
4. Review and approve file changes

### 3. Testing Phase in Claude Code
1. Guide Claude to run tests: `Run the tests for the component I just modified`
2. Fix any test failures: `Fix the failing test in src/components/x/y.test.tsx`
3. Verify both unit tests and Storybook stories work

### 4. Documentation Phase in Claude App
1. Return to Claude App for documentation updates
2. Provide summary of implementation done in Claude Code
3. Generate updated documentation artifacts

## Managing Rate Limits
- **Shared Limits**: Remember that Claude App and Claude Code share the same rate limits
- **Monitor Usage**: Use `/cost` command in Claude Code to monitor token usage
- **Strategic Allocation**: Use Claude Code for implementation tasks (which require more iterations) and Claude App for planning and documentation
- **Batch Processing**: Group similar tasks together to minimize context switching costs

## Security Best Practices
- **Permission Rules**: Configure specific permissions in .claude/settings.json
- **Tool Restrictions**: Limit which tools Claude Code can use without prompting
- **Review Changes**: Always review changes before committing them
- **Sensitive Data**: Avoid exposing sensitive credentials or personal data

## Three-Stage Component Testing Workflow
Always follow our Three-Stage Component Testing approach:
1. **Storybook Testing**: Isolated component testing with various states
2. **Test Harness**: Integration testing in `/dev/[component-name]` routes
3. **System Integration**: Testing in actual application context

## Common Workflows

### TDD Workflow with Claude Code
1. Define test requirements in Claude App
2. Ask Claude Code to implement the test file
3. Verify test fails initially (true TDD)
4. Ask Claude Code to implement the component to make tests pass
5. Iterate until all tests pass
6. Request Storybook story implementation

### Build Error Resolution
1. Run the build process: `npm run build`
2. If errors occur, ask Claude Code: `Fix the build errors shown in the output`
3. Claude Code will analyze errors, make changes, and rerun the build
4. Continue until the build succeeds

### GitHub Issue Implementation
1. Use the custom command `/project:do-issue [issue-number]` to implement a GitHub issue
2. Claude Code will:
   - Fetch issue details using MCP GitHub tools
   - Create a feature branch
   - Analyze the issue requirements
   - Implement tests and features following TDD principles
   - Include mandatory verification steps
   - Create a PR using MCP GitHub tools

### Storybook Component Development
1. Plan component in Claude App, defining states and behaviors
2. Ask Claude Code to scaffold the component and its story file
3. Request implementation of the component following the Three-Stage Testing approach
4. Have Claude Code run Storybook to verify the component appears correctly

## Transitioning Between Claude App and Claude Code
- Share decision points and rationale in CLAUDE.md
- Create a summary file in Claude App before switching to Claude Code
- Reference specific file paths and issues when switching contexts
- Use claude.local.md for task-specific context

## Using Memory for Task Continuity
- Add important context as memories using `/memory` or the `#` shortcut
- Document decisions in CLAUDE.md as you make them
- Keep memories focused and specific
- Organize memories under clear headings

## Additional Resources
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [CLI Usage Guide](https://docs.anthropic.com/en/docs/claude-code/cli-usage)
- [Managing Memory](https://docs.anthropic.com/en/docs/claude-code/memory)
- [Configuration Settings](https://docs.anthropic.com/en/docs/claude-code/settings)
