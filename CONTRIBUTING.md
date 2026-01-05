# Contributing to Narraitor

Thanks for your interest in contributing! This guide covers the technical workflow and standards for working on the Narraitor codebase.

## Development Setup

```bash
# Clone and install
git clone https://github.com/jerseycheese/narraitor.git
cd narraitor
npm install

# Set up environment
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start development
npm run dev          # Development server
npm run storybook    # Component development
```

## Git Workflow

- **Base branch**: Create feature branches from `develop`, not `main`
- **PR target**: Always target `develop` branch
- **Commit messages**: Use semantic format (feat:, fix:, docs:, etc.)
- **Before merge**: All tests must pass

## Code Standards

### File Organization
- Maximum 300 lines per file
- One concern per component/function
- Domain-driven structure (group by feature, not by type)

### TypeScript
- Strict mode enabled
- No `any` types
- Full type coverage required

### Component Development
1. Build in Storybook isolation first
2. Test with React Testing Library
3. Test in dev harness (`/dev/*` routes)
4. Integrate into application

### UI Components
Always use shadcn/ui components instead of raw HTML:
- `Button` instead of `<button>`
- `Input` instead of `<input>`
- `Textarea` instead of `<textarea>`

## Architecture Rules

The codebase enforces domain boundaries via dependency-cruiser. These rules prevent architectural drift:

### Enforced Rules

- ❌ **State stores cannot import from `components/` or `app/`**
  - Stores are domain logic, not UI-aware
  
- ⚠️  **Stores should not directly depend on other stores**
  - Use pub-sub patterns or composition instead
  - Prevents initialization order issues
  
- ❌ **Utils must be pure (no imports from `state/`)**
  - Utils should have zero dependencies on application state
  
- ❌ **Type files cannot import implementation code**
  - Types should only contain `type`, `interface`, `enum`
  - Move type guards to `lib/utils/typeGuards.ts`
  - Move constants out of type files

### Validation Commands

```bash
# Check for architecture violations
npm run deps:validate

# Generate dependency diagrams (not committed to git)
npm run deps:diagram:all

# Both validate + generate
npm run analyze
```

### Viewing Diagrams

Diagrams are generated as `.mmd` (Mermaid) files in `public_docs/architecture/`:

**Option 1: VS Code**
```bash
# Install Mermaid extension
# Open any .mmd file
# Press Cmd+Shift+V to preview
```

**Option 2: Mermaid Live**
```bash
# Copy any diagram
cat public_docs/architecture/dependency-graph-domains.mmd | pbcopy

# Paste at https://mermaid.live
```

### Understanding Violations

See `public_docs/architecture/dependency-analysis.md` for:
- Detailed explanation of all violations
- Why each rule exists
- How to fix common issues
- Examples of proper patterns

Current known issues tracked in:
- [#978: Fix type files importing implementation code](https://github.com/jerseycheese/Narraitor/issues/978) (HIGH priority)
- [#977: Fix circular dependencies between stores](https://github.com/jerseycheese/Narraitor/issues/977) (MEDIUM priority)

## Testing

### Unit Tests
```bash
npm run test                    # Run all Jest tests
npm run test:coverage           # With coverage report
npm test src/state/__tests__/worldStore.test.ts  # Specific file
```

### Visual Tests
```bash
npm run test:visual             # Run Playwright tests
npm run test:visual:update      # Update baselines
```

### Test Philosophy
- Write tests first (TDD approach)
- Test behavior, not implementation
- Focus on WHAT the feature does, not HOW
- Use MVP-level tests with KISS approach
- Avoid testing CSS classes or internal state

## Design System

### Color Tokens
Use only design tokens from the 23-color palette. Never use hardcoded hex colors, rgb(), or hsl().

```bash
# Check for violations
npm run lint:css

# Auto-fix violations
npm run lint:css:fix
```

### Component Library
All UI components live in Storybook:

```bash
npm run storybook               # Local development
npm run build-storybook         # Build for deployment
```

## Common Commands

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run start                   # Start production server

# Testing
npm run test                    # Jest tests
npm run test:prompt-templates   # AI prompt validation
npm run test:visual             # Playwright visual tests

# Code Quality
npm run lint                    # ESLint
npm run lint:css                # Design token violations
npm run type-check              # TypeScript errors

# Architecture
npm run deps:validate           # Check architecture rules
npm run deps:diagram:all        # Generate dependency diagrams
npm run analyze                 # Validate + generate

# Component Development
npm run storybook               # Launch Storybook
```

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes following code standards
3. Run `npm run deps:validate` to check architecture
4. Run tests: `npm run test` and `npm run test:visual`
5. Run linting: `npm run lint` and `npm run lint:css`
6. Push and create PR targeting `develop`
7. Fill out PR template with context and testing notes
8. Wait for CI checks to pass
9. Address review feedback

## Questions?

- Check `public_docs/` for detailed documentation
- Open an issue for bugs or feature requests
- Tag architecture questions with `domain:state-management`
