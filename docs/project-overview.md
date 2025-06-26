---
title: Narraitor Project Overview
tags: [narraitor, overview]
created: 2025-04-27
updated: 2025-06-26
---

# Narraitor Project Overview

## Project Description
AI-driven narrative RPG framework built with Next.js and Google Gemini AI. Supports any fictional world with dynamic storytelling that adapts to user-defined themes, tone, and mechanics. Single-player experience focused on creative narrative exploration.

## Current Status
**Functional MVP Ready**: Core systems implemented and operational. Currently in extended testing and polish phase for public launch.

## Technical Foundation
- **Framework**: Next.js 15+ with App Router
- **AI Integration**: Google Gemini (secure server-side)
- **State Management**: Zustand stores with IndexedDB persistence
- **UI**: Tailwind CSS v4 with shadcn/ui components
- **Testing**: Jest, React Testing Library, Storybook
- **Development**: TDD workflow with 300-line file limits

## Core Features

### World Creation System
- AI-assisted world generation from freeform descriptions
- Configurable attributes (up to 6) and skills (up to 12) per world
- Template worlds available (Western, Fantasy, Sci-Fi, etc.)
- World-specific theming and styling

### Character System
- Multi-step character creation wizard
- Point-buy attribute allocation system
- Skill selection with world constraints
- Character background and description

### Narrative Engine
- Google Gemini AI for story generation
- Custom player input + AI-generated choices
- Context-aware narrative progression
- Decision weight and alignment systems
- AI-powered ending detection

### Game Session Management
- Session persistence with IndexedDB
- Navigation loading system
- Error handling and recovery
- State synchronization

### Development Tools
- Comprehensive DevTools panel
- Storybook component development
- Test harnesses for component validation
- Automated workflow scripts

## Security Architecture
- Server-side API key protection
- Rate limiting (50 requests/hour per IP)
- Input sanitization and validation
- No client-side exposure of sensitive data

## Target Audience
Personal use for narrative RPG experiences. Designed for solo play with custom worlds and AI-driven storytelling.

## Development Approach
- **KISS Principle**: Simple, maintainable code
- **TDD Workflow**: Tests before implementation
- **Component-First**: Storybook-driven development
- **Domain-Driven**: Clear architectural boundaries
- **PR-Based**: No direct commits to main branches

## Current Priorities
- User interface polish and responsiveness
- Performance optimization
- Extended testing and bug fixes
- Launch preparation and documentation

## Architecture Highlights
- Domain-driven folder structure
- Zustand stores for each domain (World, Character, Narrative, etc.)
- Shared component system with wizard patterns
- AI service abstractions for prompt management
- Type-safe APIs with comprehensive validation
