---
title: Technical Approach
tags: [architecture, technology, stack]
created: 2025-04-28
updated: 2025-06-26
---

# Technical Approach

Technical stack and development practices for Narraitor, focused on maintainable code and modern web technologies.

## Core Technologies

### Framework: Next.js 15+
- App Router with server and client components
- Built-in routing with nested layouts
- Server-side rendering capabilities
- Strong TypeScript integration
- Efficient client-side navigation

### Language: TypeScript
- Static type checking for reliability
- Better developer experience with IDE integration
- Self-documenting code through types
- Easier refactoring and maintenance

### UI: Tailwind CSS v4 + shadcn/ui
- Utility-first approach for rapid development
- Consistent design system with shadcn/ui components
- World-specific theme customization
- Small bundle size with optimization

### State Management: Zustand
**Current Implementation** (replaced React Context):
- Domain-specific stores (World, Character, Narrative, etc.)
- Simple, lightweight state management
- Strong TypeScript integration
- Easy testing with pure store functions
- IndexedDB persistence integration

### Testing: Jest + React Testing Library + Storybook
- Unit testing for functions and hooks
- Component testing with React Testing Library
- Visual testing with Storybook stories
- TDD workflow support
- Test harnesses for complex components

### Data Persistence: IndexedDB
- Client-side storage for game state
- Structured data with efficient queries
- Transaction support for data integrity
- Offline capabilities
- Async API for performance

### AI Integration: Google Gemini
**Secure Implementation**:
- Server-side API key protection
- Rate limiting (50 requests/hour per IP)
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
├── app/                     # Next.js App Router pages
├── components/              # Shared UI components
├── lib/                     # Shared utilities and services
├── state/                   # Zustand stores by domain
├── types/                   # TypeScript type definitions
└── utils/                   # Helper functions
```

**Key Benefits**:
- Clear organization by function
- Zustand stores grouped by domain
- Shared components for reusability
- Centralized utilities and types

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
