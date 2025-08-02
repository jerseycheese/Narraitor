# Narraitor Project Memory

## Project Overview
So this is an AI-powered storytelling app built with Next.js that lets you play RPG narratives in any fictional universe. The key differentiator is that it's not just generic fantasy - you define your world's rules and tone, and the AI adapts its storytelling to match. Uses domain-driven architecture with strict TDD because keeping things organized matters when you're dealing with complex state management and AI integration.

## Technical Foundation
- Next.js 15+ with App Router
- TypeScript for type safety
- Zustand for state management
- Storybook for component development
- Jest and React Testing Library for testing
- Google Gemini for AI integration (secure server-side implementation)
- IndexedDB for client-side persistence with resilient storage middleware
- **Tailwind CSS v3**: Required for Storybook compatibility

## Security Architecture
- **API Key Protection**: All API keys stored server-side only (`GEMINI_API_KEY`)
- **Secure Proxy Pattern**: Client-side requests route through Next.js API endpoints
- **Rate Limiting**: 50 requests per hour per IP to prevent abuse and control costs
- **Request Validation**: Input sanitization and content filtering on all API routes
- **No Client Exposure**: Zero sensitive data in browser or JavaScript bundles

## Development Workflow
The approach here is pretty systematic. Always write tests first (TDD) because it forces you to think about the API before implementation. Build components in Storybook isolation before integrating them - this catches UI issues early and makes debugging much easier.

Key practices:
- **File size limits**: 300 lines max for components. If it's bigger, break it down.
- **Domain boundaries**: Related functionality stays together. No mixing World logic with Character logic.
- **PR-based workflow**: No direct commits to main branches. Every change gets reviewed.
- **KISS principle**: Simple solutions over clever ones. The codebase should be readable six months later.
- **Package stability**: Don't change versions unless explicitly needed - dependency changes break things in unexpected ways.

## Automation Workflow System
Built some pretty sophisticated automation for handling repetitive development tasks. The goal was to reduce friction for common workflows while maintaining safety guardrails:

### Automation Modes
- **Standard Mode**: `claude > /project:do-issue-auto 501` - Automated with verification via tests
- **YOLO Mode**: `./scripts/yolo-mode.sh launch 501` - Containerized, network-isolated automation

### Worktree System
- **Parallel Development**: Work on multiple issues simultaneously using git worktrees
- **Isolation**: Each issue gets its own working directory and branch
- **Management**: `./scripts/worktree-helper.sh` for creating, managing, and cleaning up worktrees

### Safety Features
- **Container Isolation**: YOLO mode runs in Docker containers with `--network none`
- **Permission Management**: Explicit permission handling for automated operations
- **Resource Limits**: CPU, memory, and disk usage constraints
- **Audit Trail**: Complete logging of all automation activities

### Quick Start Automation
```bash
# Check status
./scripts/automation-status.sh

# Create worktree and launch YOLO mode
./scripts/worktree-helper.sh create 501 feature-description
./scripts/yolo-mode.sh launch 501

# Batch processing
./scripts/yolo-mode.sh batch 501,502,503
```

### Documentation
Comprehensive automation guides available in personal docs:
- [Automation Workflow Overview](https://github.com/jerseycheese/Docs/blob/main/narraitor/docs/development/workflows/automation-workflow-improvements.md)
- [YOLO Mode Complete Guide](https://github.com/jerseycheese/Docs/blob/main/narraitor/docs/development/workflows/yolo-mode-complete-guide.md)
- [Worktree System Guide](https://github.com/jerseycheese/Docs/blob/main/narraitor/docs/development/workflows/worktree-system-guide.md)
- [Safety and Security Practices](https://github.com/jerseycheese/Docs/blob/main/narraitor/docs/development/workflows/automation-safety-guide.md)

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

## AI Consistency Validation System (Issue #184)
Comprehensive debugging tools for AI consistency validation integrated into DevTools:

### Components
- **ConsistencyValidationSection**: Main debugging interface for lore analysis
- **DevToolsSection**: Reusable UI component eliminating code duplication across DevTools
- **Enhanced DevToolsPanel**: Updated with consistent styling patterns

### Features
- **Live Lore Analysis**: Real-time preview of lore context building from facts
- **Instruction Generation**: Generated consistency instructions preview
- **Categorization Viewer**: Visual breakdown of lore into categories (characters, locations, world rules, historical events)
- **Importance Ranking**: Validation of lore fact importance rankings
- **Statistics Dashboard**: Overview metrics for lore fact analysis

### Usage
Access via DevTools → AI Tools & Validation → Consistency Validation section. Select a world with lore facts to begin analysis.

### Documentation
- `docs/features/ai-consistency-validation.md`: Complete feature documentation
- `docs/devtools/extending-devtools.md`: Updated with new components and patterns
- Storybook stories: `DevToolsSection.stories.tsx` for component documentation

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
The testing approach focuses on behavior over implementation. Test what users actually experience, not how the code works internally.

**Core guidelines**:
- Test WHAT the feature does for users, not HOW the code implements it
- Focus on acceptance criteria and core functionality
- Avoid testing implementation details like CSS classes or internal state
- Don't over-test edge cases beyond MVP needs
- Use user-centric queries (`getByRole`, `getByText`) over test IDs when possible

Here's the pattern that works well:
```javascript
// Good approach - tests user-visible behavior
test('displays all required world information', () => {
  const mockWorld = { name: 'Test World', description: 'Description', theme: 'Fantasy' };
  render(<WorldCard world={mockWorld} />);
  
  // Verify what users see, not how it's rendered
  expect(screen.getByText('Test World')).toBeInTheDocument();
  expect(screen.getByText('Description')).toBeInTheDocument();
  expect(screen.getByText('Fantasy')).toBeInTheDocument();
});
```

This approach makes tests more resilient to refactoring and actually validates the user experience.

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
- **UI Components**: Always use shadcn/ui components instead of raw HTML elements:
  - Use `Button` instead of `<button>`
  - Use `Input` instead of `<input>`
  - Use `Textarea` instead of `<textarea>`
  - Use `Select` instead of `<select>`
  - Use `RadioGroup`/`RadioGroupItem` instead of radio inputs
  - Use `Checkbox` instead of checkbox inputs
  - Import from `@/components/ui/[component]`

## Documentation Standards
Documentation should sound like explaining something to a colleague, not writing for a corporate wiki.

### Writing Style
- **Context first**: Start with why this exists, then what it does
- **Conversational tone**: Write like you're talking to someone, not performing for them
- **Skip corporate language**: No "comprehensive solutions" or "leveraging synergies"
- **Active voice**: "Configure the API" not "The API should be configured"  
- **Natural flow**: Use connectors like "So," "basically," "which means"

### Content Organization
- **Keep it practical**: Focus on implementation over theory
- **Reasonable length**: 150 lines target, 300 max - if it's longer, split it up
- **Clear headings**: Make it scannable for both humans and AI
- **Delete outdated stuff**: Remove completed implementation plans (git preserves them)
- **Consistent naming**: `[feature]-[type].md` pattern

The goal is documentation that's actually useful for development work, not impressive-sounding but hard to parse.

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

## Parallel Work Analysis Commands

### Unified Tool (Recommended)
- `./scripts/parallel-work-planner.sh analyze [issues]`: Comprehensive issue analysis for parallel work safety
- `./scripts/parallel-work-planner.sh recommend [count]`: Get recommended safe issue combinations
- `./scripts/parallel-work-planner.sh setup [issues]`: Set up complete parallel work environment
- `./scripts/parallel-work-planner.sh monitor`: Monitor active parallel work across all tools
- `./scripts/parallel-work-planner.sh guide`: Access comprehensive planning documentation

### Individual Tools
- `./scripts/analyze-issue-dependencies.sh [issue-number]`: Analyze single issue dependencies
- `./scripts/analyze-issue-dependencies.sh --compare [issue1] [issue2]`: Compare two issues for conflicts
- `./scripts/analyze-issue-dependencies.sh --batch [issue1,issue2,issue3]`: Batch analyze multiple issues
- `./scripts/check-related-issues.sh [issue-number]`: Find cross-referenced issues
- `./scripts/parallel-claude-setup.sh setup`: Set up multiple worktrees for parallel development
- `./scripts/worktree-helper.sh status`: Monitor all active worktrees

### Quick Start
```bash
# Analyze issues for parallel work safety
./scripts/parallel-work-planner.sh analyze 504,220

# Get recommended safe combinations
./scripts/parallel-work-planner.sh recommend

# Set up parallel work environment
./scripts/parallel-work-planner.sh setup 504,220
```

### Project-Specific Implementation
The tools above are specifically designed for Narraitor's domain structure (World, Character, Narrative, Journal, Inventory) and integrate with Narraitor's development workflow.

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

### Storage Resilience
All stores use resilient IndexedDB persistence with:
- **Automatic Retry**: Exponential backoff for transient failures
- **Memory Fallback**: Seamless operation when storage fails
- **Recovery Detection**: Automatic sync when storage becomes available
- **Health Monitoring**: Periodic checks with user notifications
- **Error Handling**: Graceful degradation for all error types

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
All Claude Code commands are now provided by the Development Framework with project-specific configuration:

### Command Usage
```bash
# Set Narraitor configuration
export PROJECT_CONFIG="./narraitor-config.json"

# Use configurable framework commands
claude [framework-command-template] [arguments]
```

### Available Commands
- **`do-issue.template.md [issue-number]`**: Complete guided workflow for implementing an issue
- **`do-issue-auto.template.md [issue-number]`**: Fully automated workflow without review stops
- **`analyze-issue.template.md [issue-number]`**: Analyze GitHub issue and create technical spec
- **`tdd-implement.template.md [feature-name]`**: Implement a feature using TDD
- **`create-docs.template.md [component/feature]`**: Create comprehensive documentation
- **`create-pr.template.md [feature-description]`**: Create a pull request
- **`transition.template.md [context]`**: Transition between Claude App and Claude Code
- **`do-continuous-issues.template.md [issue-list]`**: Batch process multiple issues
- **`complete-workflow.template.md [target]`**: End-to-end development workflow
- **`test.template.md [target]`**: Comprehensive testing using Narraitor patterns

### Quick Examples
```bash
# Set configuration for all commands
export PROJECT_CONFIG="./narraitor-config.json"

# Implement an issue with guided workflow
claude do-issue.template.md 123

# Batch process multiple issues automatically  
claude do-continuous-issues.template.md 101,102,103

# Generate documentation following Narraitor patterns
claude create-docs.template.md "WorldCard"
```

## Working with Claude App and Claude Code
For smoothly transitioning between planning in Claude App and implementation in Claude Code:

1. **Planning in Claude App**:
   - Analyze the issue and create technical specs
   - Define test approach and acceptance criteria
   - Plan architecture and component structure

2. **Implementation in Claude Code**:
   - Set up configuration: `export PROJECT_CONFIG="./narraitor-config.json"`
   - Use Development Framework commands for guided implementation
   - Follow the Three-Stage Verification framework
   - All commands automatically use Narraitor's domain structure and patterns

3. **Simple Workflow**:
   - Pick an issue from GitHub
   - Plan in Claude App to create technical spec
   - Implement using Development Framework commands with project configuration
   - Verify and complete following the guided process

### Benefits of Framework Integration
- **Consistent Commands**: Same commands work across all your projects
- **Narraitor Patterns**: Automatically uses Narraitor's domain structure, testing patterns, and conventions
- **Zero Maintenance**: No need to maintain project-specific commands
- **Cross-Project Learning**: Improvements to the framework benefit all projects

## Development Test Harnesses
Available at `/dev/*` routes:
- `/dev` - Development test harness index
- `/dev/world-creation-wizard` - World Creation Wizard testing
- `/dev/devtools-test` - DevTools panel testing
- `/dev/template-selector` - Template selector testing
- `/dev/game-session` - Game session testing

## Development Framework Integration
The project now integrates with a broader development framework for configurable development tools:

### Generic Development Tools
- **Issue Analysis Framework**: Project-agnostic issue dependency analysis with domain configuration
- **Claude Code Commands**: Configurable command templates that work with any project structure
- **GitHub Tools**: Reusable GitHub API wrappers for consistent automation
- **Automation Tools**: Cross-project automation utilities for development workflows

### Configuration-Driven Development
The development workflow now uses project-specific configuration files:
- **Narraitor Config**: `./narraitor-config.json` - Defines Narraitor's domain structure, GitHub settings, and conflict rules
- **Template Config**: Generic project configuration template for other projects

This architecture allows:
- **Reusable Tools**: Same automation scripts work across different projects
- **Domain Configuration**: Each project defines its own domain structure and patterns
- **Consistent Workflows**: Standardized development processes while maintaining project-specific customization