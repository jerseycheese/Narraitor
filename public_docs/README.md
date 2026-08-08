# Narraitor Documentation

Complete documentation for the Narraitor AI-powered storytelling application.

## Quick Start

- [Project Overview](./project-overview.md) - What Narraitor is and how it works
- [Development Setup](./development/testing-guide.md) - Getting started with development
- [Testing Guide](./development/testing-guide.md) - Testing strategies and best practices

## Architecture

Core architectural decisions and design patterns:

- [Architecture Decisions](./architecture/architecture-decisions.md) - Index of all ADRs
- [Technical Approach](./architecture/technical-approach.md) - High-level technical overview
- [Repository Structure](./architecture/repository-structure.md) - How the codebase is organized
- [State Management Guide](./architecture/state-management-guide.md) - Zustand patterns and domain stores
- [Domain Integration Protocols](./architecture/domain-integration-protocols.md) - Cross-domain communication

### Architecture Decision Records (ADRs)

Full index in [architecture-decisions.md](./architecture/architecture-decisions.md). ADRs 001-008 were backfilled from the inception-era foundation.

- [ADR-001: Next.js App Router + TypeScript](./architecture/ADR-001-nextjs-app-router-typescript.md)
- [ADR-002: Client-side-only architecture](./architecture/ADR-002-client-side-only-architecture.md)
- [ADR-003: Zustand domain stores](./architecture/ADR-003-zustand-state-management.md)
- [ADR-004: IndexedDB persistence](./architecture/ADR-004-indexeddb-persistence.md)
- [ADR-005: Domain-driven structure](./architecture/ADR-005-domain-driven-structure.md)
- [ADR-006: Gemini behind server-side API routes](./architecture/ADR-006-gemini-server-side-api.md)
- [ADR-007: Tailwind + shadcn/ui styling (superseded by ADR-011)](./architecture/ADR-007-tailwind-shadcn-styling.md)
- [ADR-008: Testing & verification strategy](./architecture/ADR-008-testing-and-verification-strategy.md)
- [ADR-009: Guided Onboarding System](./architecture/ADR-009-guided-onboarding-system.md)
- [ADR-010: Decision Relevance Simplification](./architecture/ADR-010-decision-relevance-simplification.md)
- [ADR-011: Three Design Systems (DS1/DS2/DS3) (superseded by ADR-013)](./architecture/ADR-011-three-design-systems.md)
- [ADR-013: Collapse to a single design system (DS3)](./architecture/ADR-013-collapse-to-single-design-system-ds3.md)
- [Mock Components for Storybook (superseded)](./architecture/mock-components-for-storybook.md)

## Systems

Deep dives into major system components:

- [Narrative Generation](./systems/narrative-generation.md) - AI storytelling engine
- [World Creation Wizard](./systems/world-creation-wizard.md) - World building system
- [MVP Type Simplification](./systems/mvp-type-simplification.md) - Type system design

## Features

Feature documentation and user-facing functionality:

- [AI Systems](./features/ai-systems.md) - AI integration overview
- [AI Consistency Validation](./features/ai-consistency-validation.md) - Lore consistency checking
- [Portrait Generation Guide](./features/portrait-generation-guide.md) - Character portrait system
- [Custom Player Input](./features/custom-player-input.md) - Player interaction system
- [Game Mechanics](./features/game-mechanics.md) - Core gameplay rules
- [Narrative Consistency Tracking](./features/narrative-consistency-tracking.md) - Story coherence
- [Personalized Narrative System](./features/personalized-narrative-system.md) - Adaptive storytelling
- [Story Checkpoints](./features/story-checkpoints.md) - Save/load system
- [World Management](./features/world-management.md) - World CRUD operations

## Development

Guides for developers working on Narraitor:

### Workflows

- [Development Workflows Index](./development/workflows/index.md)
- [PR Creation & Testing](./development/workflows/pr-and-testing-workflow.md)
- [Storybook Workflow](./development/workflows/storybook-workflow-streamlined.md)
- [Visual Testing Workflow](./development/workflows/visual-testing-workflow.md)
- [User Story Workflow](./development/workflows/user-story-workflow.md)
- [YOLO Mode Safe Issues](./development/workflows/yolo-safe-issues.md) - Autonomous vs manual work

### Testing

- [Testing Guide](./development/testing-guide.md) - Testing strategy
- [Visual Regression Testing](./development/visual-regression-testing.md) - Playwright visual tests
- [Visual Testing Best Practices](./development/visual-testing-best-practices.md)
- [Visual Test Examples](./development/visual-test-examples.md)

### Project Management

- [GitHub Sync Guide](./development/github-sync-guide.md) - Issue/story synchronization
- [MVP Roadmap](./development/mvp-roadmap.md) - Release planning

> **Note**: Release tracking is managed through GitHub Releases and Milestones, not static markdown files.

### Best Practices

- [React Best Practices](./development/react-best-practices.md)
- [UI/UX Guidelines](./development/ui-ux-guidelines.md)

## Design System

Visual design and component guidelines:

- [Design Tokens](./design-system/design-tokens.md) - three-tier token system (colors, spacing, typography, elevation)
- [Global Styles](./design-system/global-styles.md) - CSS architecture
- [Icon Usage Guide](./design-system/icon-usage-guide.md) - Icon system
- [shadcn/ui Integration (historical)](./design-system/shadcn-integration-guide.md) - Component foundation; Tailwind/cva since removed

## Technical Guides

Implementation details and patterns:

### State & Data

- [State Management Usage](./technical-guides/state-management-usage.md)
- [State Stores](./technical-guides/state-stores.md)
- [Lore Tracking System](./technical-guides/lore-tracking-system.md)
- [Goal System Integration](./technical-guides/goal-system-integration.md)
- [Goal Tracking Usage](./technical-guides/goal-tracking-usage.md)

### Component Patterns

- [Character Creation Auto-Save](./technical-guides/character-creation-auto-save.md)
- [Navigation Loading System](./technical-guides/navigation-loading-system.md)
- [Navigation Persistence Guide](./technical-guides/navigation-persistence-guide.md)
- [Shared Wizard System](./technical-guides/components/shared-wizard-system.md)
- [Recovery Notification](./technical-guides/components/recovery-notification.md)

### AI & Prompts

- [Prompt Context API](./technical-guides/prompt-context-api.md)

### Error Handling & Resilience

- [Error Handling](./technical-guides/error-handling.md)
- [Storage Resilience Guide](./technical-guides/storage-resilience-guide.md)

### Configuration & Utilities

- [Coding & Naming Conventions](./technical-guides/coding-naming-conventions.md)
- [Type Guards Usage Guide](./technical-guides/type-guards-usage-guide.md)
- [Response Extractor Utility](./technical-guides/response-extractor.md)
- [Extending DevTools](./technical-guides/extending-devtools.md)

## API Reference

- [Types Reference](./api/types-reference.md) - TypeScript type definitions
- [Character Creation Auto-Save API](./api/character-creation-auto-save-api.md)
- [Goal System API](./api/goal-system-api.md)
- [Playwright Visual API](./api/playwright-visual-api.md)

## Security

- [Security README](./security/README.md) - Security overview
- [Security Testing Guide](./security/SECURITY_TESTING_GUIDE.md)
- [Demo Secure API](./security/demo-secure-api.sh) - Example scripts
- [Test Secure API](./security/test-secure-api.sh)

## Templates

Reusable templates for creating new documentation:

- [Architecture Decision Template](./templates/architecture-decision-template.md)
- [Feature Implementation Template](./templates/feature-implementation-template.md)
- [Technical Guide Template](./templates/technical-guide-template.md)
- [PR Content Template](./templates/pr-content.md)

## Contributing

When adding documentation:

1. **Public docs**: Place in `public_docs/` (committed to repo)
2. **Private notes**: Use `docs/` directory (gitignored)
3. **Style**: Conversational tone, context-first, no corporate speak
4. **Length**: Target 150 lines, max 300 lines
5. **Format**: Use templates from `templates/` directory

## Documentation Standards

- **Conversational tone**: Write like you're explaining to a colleague
- **Context first**: Start with why, then what, then how
- **Practical focus**: Implementation over theory
- **Reasonable length**: Split long docs into multiple files
- **Cross-reference**: Link to related docs liberally

---

Last updated: 2026-05-22
