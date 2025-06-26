---
title: Architecture Decisions
tags: [architecture, decisions, adr]
created: 2025-04-28
updated: 2025-06-26
---

# Architecture Decisions

Key architectural decisions for the Narraitor project.

## Frontend Architecture

**Next.js 15+ App Router**: Modern React framework with server/client components, nested layouts, and optimized routing.

**Domain-Driven Design**: Code organized by business domains (World, Character, Narrative, etc.) rather than technical layers.

**Zustand State Management**: Lightweight state management with domain-specific stores replacing React Context pattern.

**TypeScript**: Full type safety with strict mode enabled.

## Data & Styling

**IndexedDB Persistence**: Client-side storage for complex data structures, offline support, and scalable capacity.

**Tailwind CSS v4**: Utility-first styling with theme support and performance optimization.

**shadcn/ui Components**: Accessible, themeable component library built on Radix UI primitives.

## Development Practices

**Storybook-First Development**: UI components developed in isolation with comprehensive stories and documentation.

**Test-Driven Development**: Jest and React Testing Library with focus on behavior testing over implementation details.

**Three-Stage Verification**: Storybook → Test Harness → System Integration for all features.

## Product Decisions

**Single Player Focus**: MVP designed for single-player experience to reduce complexity and focus on core narrative features.

**300-Line File Limit**: Strict limit enforces separation of concerns and maintainability.

**Google Gemini AI**: Secure server-side integration with rate limiting and request validation.

**Security-First API Design**: All API keys server-side only, request sanitization, and no client-side exposure of sensitive data.
