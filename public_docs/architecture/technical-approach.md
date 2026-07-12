---
title: Technical Approach
tags: [architecture, technology, stack]
created: 2025-04-28
updated: 2026-05-22
---

# Technical Approach

The tech stack prioritizes maintainability and developer experience over being cutting-edge.
The aim was to pick technologies that would still make sense in a year — good TypeScript
support, clear upgrade paths, nothing exotic.

## Technology Choices

**Next.js 15 (15.5.x) with App Router** - The App Router makes routing cleaner than the old
Pages Router, server components help performance, and nested layouts cut a lot of layout
duplication. Running React 19 underneath.

**TypeScript everywhere** - Static typing catches a lot early, especially with complex state
management and AI integrations. The IDE integration makes refactoring safer, and the types
double as documentation.

**Plain CSS with design tokens (no Tailwind)** - Styling is hand-written CSS driven by
design-token custom properties (`var(--color-surface)`, `var(--space-4)`, `var(--radius-md)`),
with `clsx` composing semantic class names. Tailwind isn't a dependency anymore — the
components started from shadcn/ui but were stripped of `cva` and Tailwind utilities in a "clean
slate" pass, keeping the Radix accessibility foundation while moving styling onto the token
system. That token approach is what let three structurally-different design systems (DS1/DS2/DS3)
restyle the same markup by swapping CSS variables; the app has since collapsed to one, DS3 (see
[ADR-013](./ADR-013-collapse-to-single-design-system-ds3.md)), but the same swap-the-variables
architecture is still how light/dark mode works today.

**Zustand for state management** - Replaced React Context early on once it got unwieldy.
Zustand is lightweight, has solid TypeScript support, and is easy to test since stores are just
functions. It persists to IndexedDB through the `persist` middleware.

**Testing stack** - Jest + React Testing Library for unit and integration tests, Playwright for
visual-regression specs (`tests/visual/`), and Storybook for component development. Stryker
mutation testing runs against the state, storage, and narrative layers to keep those tests
honest. RTL keeps tests focused on user behavior rather than implementation details, which fits
the TDD workflow.

**Data persistence** - IndexedDB for client-side storage because game sessions need to persist across browser sessions. It handles structured data well and has good performance for the narrative data structures.
- Transaction support for data integrity
- Offline capabilities
- Async API for performance

### AI Integration: Google Gemini
**Secure Implementation**:
- Server-side API key protection
- Rate limiting (50 requests/hour per IP in production) on the narrative generation routes
- Prompt template management
- Context-aware generation
- Error handling and fallbacks

## Development Practices

### Test-Driven Development (TDD)
1. Write tests to define expected behavior
2. Implement minimal code to pass tests
3. Refactor for clarity and maintainability
4. Create flow diagrams before complex implementation
5. Maintain high test coverage for critical paths

### KISS Principles
- Prefer simple solutions over complex ones
- Avoid premature optimization
- Maintain readability over cleverness
- Break complex problems into simple parts
- Focus on core functionality first

### Component-First Development
1. Define component API with props interface
2. Create Storybook stories for variants
3. Implement component in isolation
4. Write component tests
5. Integrate into application

### Code Quality Standards
- **File size limits**: 300 lines max for components
- **Function size**: Small, focused functions
- **Clear naming**: Descriptive, consistent naming conventions
- **Separation of concerns**: Single responsibility per file
- **Domain boundaries**: Clear separation between business domains

## Current Folder Structure

```
src/
├── app/                     # Next.js App Router pages + API routes
├── components/              # React components, grouped by domain
├── lib/                     # Domain logic, integrations, utilities
├── state/                   # Zustand stores by domain
├── services/                # Cross-cutting services
├── hooks/                   # Shared React hooks
├── types/                   # TypeScript type definitions
├── stories/                 # Storybook stories
├── styles/                  # Global + theme CSS
└── utils/                   # Helper functions
```

The [Repository Structure](repository-structure.md) doc has the full tree. The payoff of this
layout is that related code sits together: stores grouped by domain, components grouped by the
feature they serve, and types kept close to the domains they describe.

## Performance Optimizations

### State Management
- Domain-specific Zustand stores minimize re-renders
- IndexedDB persistence for large datasets
- Efficient state updates through Zustand patterns

### UI Performance
- React.memo for pure components
- Storybook for isolated component development
- Optimized loading states and error boundaries

### Data Handling
- Batch updates to minimize render cycles
- Efficient IndexedDB operations
- Context window management for AI prompts

## Security Architecture

**Client-Side Security**:
- Input validation and sanitization
- Content filtering for AI-generated content
- No sensitive data in client-side storage

**Server-Side Security**:
- API keys protected on server
- Rate limiting per IP address
- Request validation and error handling

## Accessibility Features

- Semantic HTML structure
- ARIA attributes for screen readers
- Keyboard navigation support
- Color contrast compliance
- Focus management throughout application
