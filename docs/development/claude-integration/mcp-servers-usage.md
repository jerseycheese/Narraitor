# MCP Servers Usage Guide for Narraitor Project

## Overview
Model Context Protocol (MCP) servers enhance Claude Code's capabilities by providing additional tools and data sources. This document outlines the MCP servers configured for the Narraitor project and how to use them effectively.

## Available MCP Servers

### GitHub Integration
Access GitHub issues, PRs, and repositories directly from Claude Code.

```javascript
// Fetch issue details
const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
  owner: "jerseycheese",
  repo: "narraitor",
  issueNumber: 123
});

// Create a PR
const pr = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
  owner: "jerseycheese",
  repo: "narraitor",
  title: "Fix issue #123",
  body: "Implementation details...",
  head: "feature/issue-123",
  base: "develop"
});
```

### Brave Search
Search the web directly from Claude Code sessions.

```javascript
// Search for information
const results = await mcp__brave_search.search({
  query: "Next.js app router migration",
  count: 5
});

// Get detailed information on a specific topic
const info = await mcp__brave_search.search({
  query: "typescript zustand state management best practices",
  count: 3
});
```

### Context7
Provides vector storage and retrieval for semantic search across project documentation.

```javascript
// Store important information
await mcp__Context7.store({
  collection: "narraitor_docs",
  document: {
    content: "Implementation details for the World Creation Wizard...",
    metadata: {
      title: "World Creation Implementation",
      category: "documentation",
      path: "/docs/core-systems/world-creation-wizard.md"
    }
  }
});

// Search for relevant documentation
const results = await mcp__Context7.search({
  collection: "narraitor_docs",
  query: "how does the narrative generator work?",
  limit: 5
});
```

### Filesystem
Enhanced filesystem operations beyond standard tools.

```javascript
// List files matching a pattern
const tsxFiles = await mcp__filesystem.listFiles({
  directory: "/src/components/WorldCreationWizard",
  pattern: "**/*.tsx"
});

// Read multiple files at once
const fileContents = await mcp__filesystem.readFiles({
  paths: [
    "/src/components/WorldCreationWizard/index.ts",
    "/src/components/WorldCreationWizard/WorldCreationWizard.tsx",
    "/src/components/WorldCreationWizard/WizardState.ts"
  ]
});
```

### Sequential Thinking
Enables step-by-step reasoning for complex problems.

```javascript
// Break down a complex implementation task
const solution = await mcp__sequential_thinking.solve({
  problem: "How should we implement the narrative generation system for dynamic character interactions?",
  steps: [
    "Identify key components needed",
    "Design data flow between components",
    "Determine state management approach",
    "Plan testing strategy"
  ]
});
```

### Memory
Store and retrieve information across Claude Code sessions.

```javascript
// Store important project context
await mcp__memory.store({
  key: "current_implementation_focus",
  value: "Implementing the attribute range editor component"
});

// Retrieve previously stored context
const focus = await mcp__memory.retrieve({
  key: "current_implementation_focus"
});
```

## Best Practices

1. **Keep Sensitive Information Protected**
   - Avoid storing sensitive tokens or credentials in MCP calls
   - Use environment variables for API keys

2. **Use Appropriate Server for Each Task**
   - GitHub integration for source control operations
   - Brave Search for external information
   - Filesystem for advanced file operations
   - Sequential Thinking for complex planning
   - Memory for cross-session context

3. **Combine MCP Servers for Complex Workflows**
   ```javascript
   // Example workflow: Research, plan, and implement
   // 1. Research with Brave Search
   const research = await mcp__brave_search.search({
     query: "best practices for implementing range sliders in React"
   });
   
   // 2. Plan implementation with Sequential Thinking
   const plan = await mcp__sequential_thinking.solve({
     problem: "Implement attribute range editor component",
     context: research.snippets.join("\n"),
     steps: ["Component design", "State management", "Testing approach"]
   });
   
   // 3. Store implementation plan in Memory
   await mcp__memory.store({
     key: "attribute_range_editor_plan",
     value: plan.solution
   });
   
   // 4. Create GitHub issue for tracking
   await mcp__modelcontextprotocol_server_github__server_github.createIssue({
     owner: "jerseycheese",
     repo: "narraitor",
     title: "Implement Attribute Range Editor Component",
     body: plan.solution
   });
   ```

4. **Error Handling**
   Always include proper error handling in MCP calls:
   
   ```javascript
   try {
     const results = await mcp__brave_search.search({
       query: "React component testing best practices"
     });
     // Process results
   } catch (error) {
     console.error("Search failed:", error.message);
     // Fallback strategy
   }
   ```

## Adding New MCP Servers

To add a new MCP server:

1. Install the required package:
   ```bash
   npm install -g @modelcontextprotocol/server-name
   ```

2. Add the configuration to `.claude/mcp_servers.json`:
   ```json
   "server-name": {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-name"]
   }
   ```

3. Restart your Claude Code session