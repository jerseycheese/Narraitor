---
title: Technical Approach
tags: [architecture, technology, stack]
created: 2025-04-28
updated: 2025-06-26
---

# Technical Approach

This the tech stack here prioritizes maintainability and developer experience over being cutting-edge. The goal was to choose technologies that would still make sense in a year, with good TypeScript support and clear upgrade paths.

## Technology Choices

**Next.js 15.5.6 with App Router** - Went with the latest stable version for better performance with server components and built-in optimizations. The App Router makes routing much cleaner than the old Pages Router, and nested layouts eliminate a lot of layout duplication. (Updated 2025-10-27.)

**TypeScript everywhere** - Static typing catches so many issues early, especially with complex state management and AI integrations. The IDE integration makes refactoring much safer, and types serve as documentation.

**Tailwind CSS v3 + shadcn/ui** - Utility-first CSS for rapid development, but shadcn/ui provides consistent component patterns. Sticking with v3 for now since Storybook compatibility matters more than having the latest Tailwind features. The combination gives you speed without sacrificing design consistency, and the theming approach works well for world-specific styling.

**Zustand for state management** - Replaced React Context early on because it was getting unwieldy. Zustand is lightweight, has excellent TypeScript support, and makes testing much easier since stores are just functions. The IndexedDB persistence integration works smoothly.

**Testing stack** - Jest + React Testing Library for the core testing, with Storybook for component development. The TDD workflow really helps with component APIs, and React Testing Library keeps tests focused on user behavior rather than implementation details.

**Data persistence** - IndexedDB for client-side storage because game sessions need to persist across browser sessions. It handles structured data well and has good performance for the narrative data structures.
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
