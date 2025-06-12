# Narraitor Project Memory

## Project Overview
Narraitor is a Next.js-based web application using AI-driven narrative generation with a domain-driven architecture, strict TDD practices, and component-first development.

## Technical Foundation
- Next.js 15+ with App Router
- TypeScript for type safety
- Zustand for state management
- Storybook for component development
- Jest and React Testing Library for testing
- Google Gemini for AI integration (secure server-side implementation)
- IndexedDB for client-side persistence
- Tailwind CSS v4 for styling
- shadcn/ui for accessible component library

## Security Architecture
- **API Key Protection**: All API keys stored server-side only (`GEMINI_API_KEY`)
- **Secure Proxy Pattern**: Client-side requests route through Next.js API endpoints
- **Rate Limiting**: 50 requests per hour per IP to prevent abuse and control costs
- **Request Validation**: Input sanitization and content filtering on all API routes
- **No Client Exposure**: Zero sensitive data in browser or JavaScript bundles

## Development Workflow
- Always write tests first (TDD)
- Create flow diagrams before complex implementations
- Develop components in Storybook before integration
- Keep files under strict size limits (300 lines for components)
- Follow domain-driven design principles
- Use PR-based workflow only - no direct commits
- Follow KISS principle - simplest solution that works
- Document architectural decisions
- Write comprehensive tests for critical paths
- Review and refactor code regularly

## Claude Code Security & Directives
- Commands can include special directives at the top of the file:
  ```
  # AUTO-APPROVE: ALL
  # AUTO-ACCEPT-EDITS: ALL
  ```
- `AUTO-APPROVE: ALL` tells Claude Code to automatically approve all commands
- `AUTO-ACCEPT-EDITS: ALL` tells Claude Code to automatically accept all edits
- For truly automatic execution without prompts, select "Yes, and don't ask again this session" on the first prompt
- This session-level setting will apply to all subsequent operations in that session
- These directives must be at the very beginning of the file as comments
- Individual permissions are also configured in `.claude/settings.local.json`
- Helper scripts are pre-approved in the settings for additional security

## Helper Scripts for Claude Code
We've created several helper scripts to streamline Claude Code workflow:
- `./scripts/claude-branch.sh`: Manages git branches without permission prompts
- `./scripts/claude-github.sh`: Interacts with GitHub API without permission prompts
- `./scripts/claude-pr.sh`: Creates PRs with proper template and targeting develop branch
- `./scripts/fetch-github-issue.sh`: Fetches GitHub issues without permission prompts
- `./scripts/claude-edit.sh`: Edits files without permission prompts
- `./scripts/enable-auto-accept.sh`: Enables session-level auto-accept

These scripts are pre-approved in `.claude/settings.local.json` and can be used as alternatives to direct commands when you want to avoid permission prompts.

## Intelligent Branch Handling
- Helper script `./scripts/claude-branch.sh` manages branches to avoid permission prompts
- Script is pre-approved in `.claude/settings.local.json`
- Always pulls latest changes from the remote branch before creating new branches
- In interactive mode (`do-issue`), the script offers options:
  1. Use the existing branch (continue previous work)
  2. Delete and recreate the branch (clean start)
  3. Create a new branch with timestamp (avoid conflicts)
- In auto mode (`do-issue-auto`), the script automatically deletes and recreates existing branches
- Automatically falls back to `main` branch if `develop` branch doesn't exist

## Three-Stage Verification Framework
All implementations must go through the Three-Stage Verification process:

1. **Stage 1: Storybook Testing**
   - Component isolation testing
   - Visual appearance in all states
   - Interaction testing with controls
   - Responsive design verification
   - Accessibility verification

2. **Stage 2: Test Harness Verification**
   - Integration testing with parent components
   - Testing with realistic data
   - Edge case verification
   - Performance testing under load
   - Interactive feature testing

3. **Stage 3: System Integration**
   - Full application context testing
   - Real data verification
   - Cross-component interaction testing
   - Acceptance criteria verification
   - End-to-end flow verification

This verification process is MANDATORY - the workflow will not proceed until verification is complete.

## Testing Principles
- Focus on testing WHAT the feature does, not HOW it does it
- Test acceptance criteria and core functionality directly
- Avoid testing implementation details (styles, classes, etc.)
- Don't test edge cases beyond MVP requirements
- Write behavioral tests over structural tests
- Test the component's API and user interactions
- Verify rendering and interaction behavior, not the HTML structure
- Use React Testing Library's user-centric queries (getByRole, getByText) over testId's when possible

This example demonstrates proper testing approach:
```javascript
// GOOD: Tests functionality based on acceptance criteria
test('displays all required world information', () => {
  const mockWorld = { name: 'Test World', description: 'Description', theme: 'Fantasy' };
  render(<WorldCard world={mockWorld} />);
  
  // Tests presence of required information (what, not how)
  expect(screen.getByText('Test World')).toBeInTheDocument();
  expect(screen.getByText('Description')).toBeInTheDocument();
  expect(screen.getByText('Fantasy')).toBeInTheDocument();
});
```

## Project Structure
- `/src/app`: Next.js App Router pages
- `/src/components`: React components
- `/src/state`: Zustand stores
- `/src/lib`: Shared utilities
- `/src/stories`: Storybook stories
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions

## Code Standards
- Max 300 lines per file
- Single responsibility for components and functions
- Domain boundaries must be respected
- Type safety is mandatory - no any types
- Error handling must include recovery mechanisms
- State updates must be atomic and predictable
- Performance considerations must be documented
- Accessibility must be built-in, not added later

## GitHub Workflow
- Always link commits to issues
- Use semantic commit messages
- PR descriptions should reference issues
- All tests must pass before merge
- Feature branches are created from and merged back to the `develop` branch
- Always use PR template from `.github/PULL_REQUEST_TEMPLATE.md`
- Always target the `develop` branch in PRs, NEVER target `main`

### GitHub Token Configuration and API Access
- Use `./scripts/setup-github-token.sh` to configure GitHub access tokens:
  - Automatically checks for existing tokens in multiple locations
  - Validates the token against GitHub API
  - Provides guided setup for creating new tokens
  - Stores token in multiple locations for fallback access
  - Handles token expiration and renewal

- Token discovery order:
  1. Environment variable (`GITHUB_TOKEN`)
  2. `.env.local` file (for Claude Code access)
  3. `.claude/.github_token` file (backup location)
  4. GitHub CLI (`gh auth token`)

- Use `./scripts/claude-github.sh` for pre-authenticated GitHub API commands:
  - `./scripts/claude-github.sh issue 123` - Get issue details
  - `./scripts/claude-github.sh close-issue 123 "Implementation complete"` - Close issue with comment
  - `./scripts/claude-github.sh create-pr "Fix #123" "PR body" "branch-name" "develop"` - Create PR
  - `./scripts/claude-github.sh repo` - Get repository details
  - `./scripts/claude-github.sh prs` - List open pull requests

- Authentication fallback mechanism:
  - All scripts attempt multiple methods to find a valid token
  - Auto-refreshes invalid/expired tokens when possible
  - Provides clear error messages when authentication fails

### MCP GitHub Tools Usage
Use the MCP GitHub tool for all GitHub operations:

```javascript
// Fetch issue details
const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
  owner: "jerseycheese",
  repo: "Narraitor",
  issueNumber: 123
});

// Create a pull request using the repository's PR template
const fs = require('fs');
const prTemplatePath = '.github/PULL_REQUEST_TEMPLATE.md';
let prBody = fs.readFileSync(prTemplatePath, 'utf8');
prBody = prBody.replace('Closes #', `Closes #123`);

const pullRequest = await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
  owner: "jerseycheese",
  repo: "Narraitor",
  title: "Fix #123: Implement feature X",
  body: prBody,
  head: "feature/issue-123",
  base: "develop"  // ALWAYS use develop, NEVER use main
});
```

### PR Creation Helper Script
Alternatively, use the `claude-pr.sh` helper script for PR creation:

```bash
# Create PR with template (via claude-pr.sh)
./scripts/claude-pr.sh 123 feature/issue-123 "Implement feature X"
```

This script will:
1. Read the PR template from `.github/PULL_REQUEST_TEMPLATE.md`
2. Replace placeholders with actual issue info
3. Generate JavaScript code for creating the PR with the MCP GitHub tool
4. Always target the `develop` branch

See the MCP GitHub tool documentation for complete usage details.

## Domain Boundaries
- World: World configuration, templates, attributes
- Character: Character creation, sheets, progression
- Inventory: Item management, effects, equipment
- Narrative: AI integration, prompt templates, choice system
- Journal: Entry tracking, categorization, filtering

## Common CLI Commands
- `npm run dev`: Start development server
- `npm run dev:turbo`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run test`: Run all Jest tests
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:e2e:critical`: Run critical end-to-end tests
- `npm run test:prompt-templates`: Test prompt template manager
- `npm run storybook`: Launch Storybook for component development
- `npm run build-storybook`: Build Storybook for deployment
- `npm run lint`: Run ESLint

## Security Testing Commands
- `./demo-secure-api.sh`: Quick verification of secure API implementation
- `./test-secure-api.sh`: Comprehensive security testing (requires dev server)
- See `SECURITY_TESTING_GUIDE.md` for manual browser testing instructions

## Environment Configuration
```bash
# .env.local (Development)
GEMINI_API_KEY=your-api-key  # Server-side only, never use NEXT_PUBLIC_*
NEXT_PUBLIC_DEBUG_LOGGING=true
GITHUB_TOKEN=your-github-token

# .env.production (Production - set in deployment platform)
GEMINI_API_KEY=your-api-key  # Server-side only
NEXT_PUBLIC_DEBUG_LOGGING=false
```

**Security Note**: Always use `GEMINI_API_KEY` (server-side) never `NEXT_PUBLIC_GEMINI_API_KEY` (client-exposed)

## State Management Architecture
Each domain has its own Zustand store following consistent patterns:
```typescript
interface StoreInterface {
  // State
  entities: Record<EntityID, Entity>;
  currentEntityId: EntityID | null;
  error: string | null;
  loading: boolean;
  
  // Actions (CRUD operations)
  createEntity: (data: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateEntity: (id: EntityID, updates: Partial<Entity>) => void;
  deleteEntity: (id: EntityID) => void;
  setCurrentEntity: (id: EntityID) => void;
}
```

Stores include: `worldStore`, `characterStore`, `narrativeStore`, `journalStore`, `inventoryStore`, `sessionStore`, `aiContextStore`

## UI Component System (shadcn/ui)
The project uses shadcn/ui for accessible, themeable components:
- **Foundation**: Tailwind CSS v4 with CSS variables for theming
- **Components**: Located in `/src/components/ui/` directory
- **Utilities**: `cn()` helper in `/src/lib/utils/cn.ts` for className merging
- **Storybook**: All UI components follow `Narraitor/UI/[Component]` naming
- **Documentation**: See `/docs/ui/shadcn-integration-guide.md` for setup details
- **Test Page**: Visit `/dev/shadcn-test` to see component showcase

### Using shadcn/ui Components
```tsx
import { Button } from '@/components/ui/button'

// Available variants: default, secondary, destructive, outline, ghost, link
// Available sizes: default, sm, lg, icon
<Button variant="outline" size="lg">Click me</Button>
```

## Claude Code Commands
We've created several custom Claude Code slash commands:
- `/project:do-issue [issue-number]`: Complete workflow for implementing an issue
- `/project:do-issue-auto [issue-number]`: Complete workflow automatically without review stops
- `/project:analyze-issue [issue-number]`: Analyze GitHub issue and create technical spec
- `/project:tdd-implement [feature-name]`: Implement a feature using TDD
- `/project:create-docs [component/feature]`: Create comprehensive documentation
- `/project:create-pr [feature-description]`: Create a pull request
- `/project:transition [context]`: Transition between Claude App and Claude Code

## Working with Claude App and Claude Code
For smoothly transitioning between planning in Claude App and implementation in Claude Code:

1. **Planning in Claude App**:
   - Analyze the issue and create technical specs
   - Define test approach and acceptance criteria
   - Plan architecture and component structure

2. **Implementation in Claude Code**:
   - Use `/project:do-issue [issue-number]` for guided implementation
   - Follow the Three-Stage Verification framework
   - Use helper scripts to avoid permission prompts

3. **Simple Workflow**:
   - Pick an issue from GitHub
   - Plan in Claude App to create technical spec
   - Implement in Claude Code using `/project:do-issue [issue-number]`
   - Verify and complete following the guided process

Use the custom Claude Code commands for guided development workflows.

## Development Test Harnesses
Available at `/dev/*` routes:
- `/dev` - Development test harness index
- `/dev/world-creation-wizard` - World Creation Wizard testing
- `/dev/devtools-test` - DevTools panel testing
- `/dev/template-selector` - Template selector testing
- `/dev/game-session` - Game session testing