---
title: Narraitor Documentation
aliases: [Documentation Home, Docs Home]
tags: [narraitor, documentation, index]
created: 2025-04-28
updated: 2025-08-02
---

# Narraitor Documentation

This is the documentation hub for Narraitor: an AI-powered storytelling app that lets you play narrative RPGs in any fictional universe you can imagine. The docs are organized by topic, but honestly the project overview is probably the best starting point if you're new here.

## Documentation Sections

### Project Overview
- [Project Overview](./project-overview.md)
- [Development Roadmap](./development/mvp-roadmap.md)
- [Remaining MVP Work](./development/remaining-mvp-work.md)

### Architecture
- [Repository Structure](./architecture/repository-structure.md)
- [Architecture Decisions](./architecture/architecture-decisions.md)
- [State Management Guide](./architecture/state-management-guide.md)
- [Technical Approach](./architecture/technical-approach.md)

### Core Systems
- [World Creation Wizard](./core-systems/world-creation-wizard.md)
- [Narrative Generation](./core-systems/narrative-generation.md)

### Features
- [AI Systems Overview](./features/ai-systems.md)
- [Narrative Consistency Tracking](./features/narrative-consistency-tracking.md)
- [Personalized Narrative System](./features/personalized-narrative-system.md)
- [World Management](./features/world-management.md)
- [Game Mechanics](./features/game-mechanics.md)

### API Documentation
- [Goal System API Reference](./api/goal-system-api.md)
- [Character Creation Auto-Save API](./api/character-creation-auto-save-api.md)
- [Types Reference](./api/types-reference.md)

### Technical Guides
- [Goal Tracking Usage](./technical-guides/goal-tracking-usage.md)
- [Goal System Integration](./technical-guides/goal-system-integration.md)
- [Lore Tracking System](./technical-guides/lore-tracking-system.md)
- [State Management Usage](./technical-guides/state-management-usage.md)
- [Character Creation Auto-Save](./technical-guides/character-creation-auto-save.md)
- [Error Handling](./technical-guides/error-handling.md)

### Components
- [Recovery Notification](./components/recovery-notification.md)
- [Shared Wizard System](./components/shared-wizard-system.md)

### Development
- [Testing Guide](./development/testing-guide.md)
- [React Best Practices](./development/react-best-practices.md)
- [UI/UX Guidelines](./development/ui-ux-guidelines.md)
- [Visual Testing Best Practices](./development/visual-testing-best-practices.md)

### Security
- [Security Overview](./security/README.md)
- [Security Testing Guide](./security/SECURITY_TESTING_GUIDE.md)

## What I'm Building Toward

The goal is a flexible storytelling framework that can adapt to any fictional universe: not just generic fantasy. Whether you want noir detective stories, space opera, or something set in your favorite fictional world, the AI should understand and match that setting's tone and rules.

**Technical priorities**: Clean, modular code with TDD practices. Responsive UI that adapts styling to match different world themes. Robust error handling because AI integrations can be unpredictable.

## Current Status

**Major milestone achieved**: Core MVP functionality is complete! All primary systems (world creation, character building, narrative engine, navigation, session persistence) are fully operational. Focus has shifted to user experience polish, developer infrastructure, and production readiness.

**Current phase**: Advanced polish - 30 high-priority items remain, primarily journal system completeness, developer debugging tools, and feature depth. Check the [MVP roadmap](./development/mvp-roadmap.md) and [remaining work breakdown](./development/remaining-mvp-work.md) for detailed status.

## Contributing

Primarily a solo project, but suggestions and feedback through GitHub issues are always welcome.

## License

This project is licensed under the MIT License: see the LICENSE file for details.
