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
- [[project-overview|Project Overview]]
- [[development-roadmap|Development Roadmap]]
- [[mvp-implementation-plan|MVP Implementation Plan]]
- [[user-stories|User Stories]]

### Requirements
- [[requirements/index|Requirements Documentation]]
- [[summaries/refined-requirements-summary|Refined Requirements Summary]]
- [[workflows/requirements-to-github|Requirements to GitHub Workflow]]

### Architecture
- [[architecture/repository-structure|Repository Structure]]
- [[architecture/architecture-decisions|Architecture Decisions]]
- [[architecture/state-management|State Management]]
- [[architecture/technical-approach|Technical Approach]]

### Core Systems
- [[core-systems/world-system|World Configuration System]]
- [[core-systems/character-system|Character System]]
- [[core-systems/narrative-engine|Narrative Engine]]
- [[core-systems/journal-system|Journal System]]
- [[features/narrative-consistency-tracking|Goal Tracking System]]

### Features
- [[features/ai-systems|AI Systems Overview]]
- [[features/narrative-consistency-tracking|Narrative Consistency Tracking]]
- [[features/personalized-narrative-system|Personalized Narrative System]]
- [[features/world-management|World Management]]

### API Documentation
- [[api/goal-system-api|Goal System API Reference]]
- [[api/types-reference|Types Reference]]

### Technical Guides
- [[technical-guides/goal-tracking-usage|Goal Tracking Usage Guide]]
- [[technical-guides/goal-system-integration|Goal System Integration]]
- [[technical-guides/lore-tracking-system|Lore Tracking System]]
- [[technical-guides/state-management-usage|State Management Usage]]

### Development
- [[development/tdd-with-kiss|Test-Driven Development with KISS]]
- [[development/storybook-workflow|Storybook Workflow]]
- [[development/feature-development-workflow|Feature Development Workflow]]
- [[development/documentation-workflow|Documentation Workflow]]

### Security
- [[security/README|Security Overview]]
- [[security/SECURITY_TESTING_GUIDE|Security Testing Guide]]
- [[technical-guides/ai-service-api|AI Service Security Documentation]]

### Flows
- [[flows/world-creation|World Creation Flow]]
- [[flows/character-creation|Character Creation Flow]]
- [[flows/game-session|Game Session Flow]]
- [[flows/state-persistence|State Persistence Flow]]

### Template Worlds
- [[universes/western|Western World Template]]
- [[universes/sitcom|Sitcom World Template]]
- [[universes/fantasy|Fantasy World Template]]

## What I'm Building Toward

The goal is a flexible storytelling framework that can adapt to any fictional universe: not just generic fantasy. Whether you want noir detective stories, space opera, or something set in your favorite fictional world, the AI should understand and match that setting's tone and rules.

**Technical priorities**: Clean, modular code with TDD practices. Responsive UI that adapts styling to match different world themes. Robust error handling because AI integrations can be unpredictable.

## Current Status

**Major milestone achieved**: Core MVP functionality is complete! All primary systems (world creation, character building, narrative engine, navigation, session persistence) are fully operational. Focus has shifted to user experience polish, developer infrastructure, and production readiness.

**Current phase**: Advanced polish - 30 high-priority items remain, primarily journal system completeness, developer debugging tools, and feature depth. Check the [MVP roadmap](development/mvp-roadmap.md) and [remaining work breakdown](development/remaining-mvp-work.md) for detailed status.

## Contributing

Primarily a solo project, but suggestions and feedback through GitHub issues are always welcome.

## License

This project is licensed under the MIT License: see the LICENSE file for details.
