# Narraitor Project Memory

## Project Overview
AI-powered storytelling app built with Next.js that lets you play RPG narratives in any fictional universe. The key differentiator is that it's not just generic fantasy: you define your world's rules and tone, and the AI adapts its storytelling to match. Uses domain-driven architecture with strict TDD because keeping things organized matters when you're dealing with complex state management and AI integration.

## Technical Foundation
- Next.js 15+ with App Router
- TypeScript for type safety
- Zustand for state management
- Storybook for component development
- Jest and React Testing Library for testing
- Google Gemini for AI integration (secure server-side implementation)
- **Tailwind CSS v3**: Required for Storybook compatibility
- **Tailwind Typography Plugin**: `@tailwindcss/typography` for readable story content formatting

## Security Architecture
- **API Key Protection**: All API keys stored server-side only (`GEMINI_API_KEY`)
- **Secure Proxy Pattern**: Client-side requests route through Next.js API endpoints
- **Rate Limiting**: 50 requests per hour per IP to prevent abuse and control costs
- **No Client Exposure**: Zero sensitive data in browser or JavaScript bundles

## Development Workflow
Always write tests first (TDD) because it forces you to think about the API before implementation. Build components in Storybook isolation before integrating them: this catches UI issues early and makes debugging much easier.

Key practices:
- **File size limits**: 300 lines max for components. If it's bigger, break it down.
- **Domain boundaries**: Related functionality stays together. No mixing World logic with Character logic.
- **PR-based workflow**: No direct commits to main branches. Every change gets reviewed.
- **KISS principle**: Simple solutions over clever ones. The codebase should be readable six months later.

## Custom Agents
The project uses specialized Claude Code agents to maintain code quality and automate workflows. These agents should be invoked proactively when their conditions are met:

### issue-prioritizer
**When to use**: User asks what to work on next, or needs help deciding between multiple open issues.

Analyzes all open GitHub issues and provides prioritized recommendations based on age, user impact, technical debt, effort estimation, dependencies, and community interest. Gives specific reasoning for each recommendation.

Example triggers:
- "What should I work on next?"
- "I have 15 open issues and don't know where to start"
- "Help me prioritize the backlog"

### test-fixer
**When to use**: Test suite has failures, or user requests test cleanup.

Maintains test quality by fixing failing tests properly (never rigging them to pass), removing trivial tests that provide no value, and focusing on acceptance criteria. Follows KISS principle and tests WHAT features do for users, not HOW code implements them.

Example triggers:
- Test suite failures
- "fix failing tests"
- "remove trivial tests"
- "clean up test suite"

### design-system-cop
**When to use**: Proactively when implementing or reviewing UI components, styles, or accessibility features.

Enforces the 23-color design token system, WCAG 2 accessibility standards, and shadcn/ui component usage. Catches hardcoded colors, validates contrast ratios, checks semantic HTML, and ensures keyboard navigation support.

Example triggers:
- User creates/modifies UI components
- Style changes across multiple files
- Before starting new UI features
- User mentions styling, colors, or accessibility

### pr-closer
**When to use**: Automatically after a PR is merged.

Updates related GitHub issues by checking off acceptance criteria, posting a natural-sounding completion comment, and closing the issue. Uses conversational tone ("This is done. Merged in PR #45") rather than corporate language.

Example triggers:
- "I just merged PR #45"
- "Just finished merging the world creation wizard PR"
- Detecting PR merge events

### formatting-cop
**When to use**: Before commits, or when user requests code cleanup.

Enforces code formatting standards including 300-line file limit, removes console.log statements, validates shadcn/ui component usage, checks for unused imports, ensures no `any` types, and cleans up TODO/FIXME comments.

Example triggers:
- "check formatting" or "fix formatting"
- Before committing code
- "clean up code"
- File size violations detected

## Custom Skills
The project uses Claude Code skills that provide deep expertise for specific tasks. Skills are invoked with the Skill tool:

### narraitor-architecture
**When to use**: Automatically when implementing features, planning implementations, or refactoring within Narraitor.

Enforces Narraitor's domain-driven architecture, Zustand state patterns, and Next.js 15 conventions. Ensures code follows the five core domains (World, Character, Inventory, Narrative, Journal) and prevents domain boundary violations. Provides guidance on component organization, shadcn/ui usage, API route security, and the three-stage verification testing approach.

Key enforcement areas:
- Domain separation and boundaries
- Zustand store patterns (CRUD operations, consistent interface)
- Component architecture (max 300 lines, proper organization)
- Next.js 15 App Router patterns (server vs client components)
- Security patterns (server-side API keys, rate limiting)

### narraitor-pattern-alignment-skill
**When to use**: Automatically during code review to ensure consistency.

Comprehensive code review assistant that checks all changes against established patterns, existing utilities, design system, and WCAG 2.1 Level AA accessibility standards. Prevents reinventing existing utilities and ensures design token compliance.

Checks for:
- Component structure and naming (PascalCase, 300-line limit, single responsibility)
- Design token usage (no hardcoded colors, 23-color palette enforcement)
- Error handling patterns (using errorUtils, proper categorization)
- Import organization (React first, third-party, internal, types)
- Testing patterns (behavior over implementation, user-centric queries)
- Utility function reuse (checking src/lib/utils/ before creating new ones)
- WCAG 2.1 Level AA accessibility (contrast, semantic HTML, keyboard nav, ARIA)
- Type safety (no `any` types, proper interfaces)
- Zustand patterns (using createCrudStore, domain-specific stores)
- Domain boundaries (no mixing World logic with Character logic)

Provides structured feedback with specific file locations, existing utilities to use, and code examples for fixes.

## Three-Stage Verification Framework
All implementations must go through the Three-Stage Verification process:

1. **Stage 1: Storybook Testing**
   - Component isolation testing
   - Visual appearance in all states
   - Interaction testing with controls
   - Accessibility verification

2. **Stage 2: Test Harness Verification**
   - Integration testing with parent components
   - Testing with realistic data
   - Edge case verification

3. **Stage 3: System Integration**
   - Full application context testing
   - Real data verification
   - Acceptance criteria verification

## Testing Principles
The testing approach focuses on behavior over implementation. Test what users actually experience, not how the code works internally.

Core guidelines:
- Test WHAT the feature does for users, not HOW the code implements it
- Focus on acceptance criteria and core functionality
- Avoid testing implementation details like CSS classes or internal state
- Use user-centric queries (`getByRole`, `getByText`) over test IDs when possible

## Project Structure
- `/src/app`: Next.js App Router pages
- `/src/components`: React components
- `/src/state`: Zustand stores
- `/src/lib`: Shared utilities
- `/src/stories`: Storybook stories
- `/src/types`: TypeScript type definitions

## Code Standards
- Max 300 lines per file
- Single responsibility for components and functions
- Domain boundaries must be respected
- Type safety is mandatory: no any types
- **UI Components**: Always use shadcn/ui components instead of raw HTML elements:
  - Use `Button` instead of `<button>`
  - Use `Input` instead of `<input>`
  - Use `Textarea` instead of `<textarea>`
  - Import from `@/components/ui/[component]`

## Design Token Enforcement
The codebase enforces our 23-color design token system through automated linting:

- **Stylelint**: Catches hardcoded hex colors, rgb/hsl values, and non-token color names in CSS
- **Tailwind Config**: Restricts available colors to only our design token palette
- **Automatic Detection**: Violations are caught during development and in CI

To fix color violations:
```bash
npm run lint:css        # See what's wrong
npm run lint:css:fix    # Auto-fix simple issues
```

The linter will flag things like `color: #ff0000` or `background: rgb(255,0,0)` and point you toward using `theme('colors.red.700')` or Tailwind classes instead.

## Documentation Standards
Documentation should sound like explaining something to a colleague, not writing for a corporate wiki.

- **Context first**: Start with why this exists, then what it does
- **Conversational tone**: Write like you're talking to someone, not performing for them
- **Skip corporate language**: No "comprehensive solutions" or "leveraging synergies"
- **Keep it practical**: Focus on implementation over theory
- **Reasonable length**: 150 lines target, 300 max: if it's longer, split it up

## GitHub Workflow
- Always link commits to issues
- Use semantic commit messages
- PR descriptions should reference issues
- All tests must pass before merge
- Feature branches are created from and merged back to the `develop` branch
- Always use PR template from `.github/PULL_REQUEST_TEMPLATE.md`
- Always target the `develop` branch in PRs, NEVER target `main`

## Domain Boundaries
- World: World configuration, templates, attributes
- Character: Character creation, sheets, progression
- Inventory: Item management, effects, equipment
- Narrative: AI integration, prompt templates, choice system
- Journal: Entry tracking, categorization, filtering

## Common CLI Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run all Jest tests
- `npm run storybook`: Launch Storybook for component development
- `npm run lint`: Run ESLint
- `npm run lint:css`: Check CSS for design token violations
- `npm run lint:css:fix`: Auto-fix CSS violations where possible

## Environment Configuration
```bash
# .env.local (Development)
GEMINI_API_KEY=your-api-key  # Server-side only, never use NEXT_PUBLIC_*
NEXT_PUBLIC_DEBUG_LOGGING=true
GITHUB_TOKEN=your-github-token

# .env.production (Production: set in deployment platform)
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

## Development Test Harnesses
Available at `/dev/*` routes:
- `/dev` - Development test harness index
- `/dev/world-creation-wizard` - World Creation Wizard testing
- `/dev/devtools-test` - DevTools panel testing
- `/dev/game-session` - Game session testing

## MCP Servers
The project uses Model Context Protocol (MCP) servers to extend capabilities:

### GitHub MCP Server
Provides direct integration with GitHub for issue and PR operations. Used by the `pr-closer` and `issue-prioritizer` agents for automated workflow management.

### Brave Search
Web search capabilities for looking up documentation, APIs, and external resources.

### Context7 (Upstash)
Advanced context management and storage capabilities.

### Filesystem
Enhanced filesystem operations with MCP protocol.

### Sequential Thinking
Structured thinking and reasoning capabilities for complex problem-solving.

### Memory
Persistent memory across sessions for maintaining context and learnings.