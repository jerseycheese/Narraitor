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
- **Type safety is mandatory**: No `any` types in application code
  - **Exception**: Infrastructure utilities (`createCrudStore.ts`, `storeHelpers.ts`) use `any` types for dynamic property access patterns that TypeScript cannot verify at compile time
  - These exceptions are documented with inline comments explaining why they're necessary
  - The `any` types are isolated and do not leak into application code
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