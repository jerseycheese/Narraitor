---
title: Narraitor Project Overview
aliases: [Project Overview, Overview]
tags: [narraitor, documentation, overview]
created: 2025-04-27
updated: 2025-04-30
---

# Narraitor Project Overview

## 1. Project Description
Narraitor is a Next.js-based web application providing an AI-driven narrative experience for tabletop RPGs across any fictional world. The application uses Google Gemini AI to deliver dynamic storytelling while adapting to the specific themes, tone, and mechanics of user-defined worlds. Built with modern web technologies, it offers an accessible and responsive single-player experience.

## 2. Current Development Status

### 2.1 Planning Phase
- Requirements documentation complete with refined scope boundaries
- Core system design and architecture defined
- Development roadmap and MVP implementation plan established
- Ready to begin converting requirements to GitHub issues

## 3. Technical Foundation
- Framework: Next.js 14+ with App Router
- AI Integration: Google Gemini models
- State Management: Domain-specific reducers with React Context
- Data Persistence: IndexedDB with automated saving (every 5 minutes and after major events)
- UI: Tailwind CSS with world-specific theming
- Testing: Jest with React Testing Library and Playwright for E2E
- Component Development: Storybook-first approach

## 4. Project Objectives
- Create a flexible narrative RPG framework adaptable to any fictional world
- Implement AI-assisted world creation from freeform descriptions
- Develop a clean, modular codebase with files under 300 lines
- Follow strict Test-Driven Development practices
- Create a responsive and accessible UI with world-appropriate styling
- Build robust error handling and recovery mechanisms
- Implement proper GitHub workflows using PRs instead of direct commits

## 5. Target Audience
- Personal use, family, and friends interested in narrative-driven RPGs
- Enthusiasts seeking a solo play experience in custom worlds
- Players interested in AI-driven narrative experiences

## 6. Development Approach
- MVP-focused with phased implementation
- TDD with a focus on critical flows first
- Component-first development using Storybook
- Flow diagrams and planning before implementation
- Strict module size limits (under 300 lines per file)
- World-agnostic architecture with no hardcoded world content

## 7. MVP Core Systems

### 7.1 World Configuration System
- AI-assisted world creation from freeform descriptions
- Up to 6 attributes (range 1-10) and 12 skills (range 1-5) per world
- User review and customization of AI suggestions
- Template worlds as fallback options (Western, Sitcom, Fantasy)
- Five pre-defined theme options for world styling

### 7.2 Character System
- 4-step character creation wizard (Basic Info, Attributes, Skills, Background)
- Point-buy attribute allocation with world-defined constraints
- Skill selection limited to 8 skills per character
- Text-based character description and background
- Character filtering and sorting capabilities

### 7.3 Narrative Engine
- Google Gemini integration for narrative generation
- Player choice system with 3-4 options per decision point
- Context management preserving 5-10 narrative segments
- Scene transition handling with location/setting changes
- Error recovery mechanisms with retries and fallback content

### 7.4 Journal System
- Four primary entry types (narrative events, decisions, discoveries, character encounters)
- Entry categorization by significance (major/minor)
- New/unread entry indicators and session date grouping
- Chronological list view with entry detail display
- Filtering by entry type and significance

### 7.5 State Management
- React Context + useReducer pattern implementation
- IndexedDB persistence with auto-save
- Campaign management functionality (create, list, load, delete)
- Export/import capabilities for campaigns and world configurations
- Error handling with storage failure detection and recovery

### 7.6 User Interface
- World creation interface with AI assistance
- Character creation wizard
- Game session interface with narrative display and player choices
- Character summary panel showing relevant attributes and skills
- Journal access button with unread indicator
- Loading states and world-appropriate styling

## 8. Current Priorities
- Create GitHub issues from refined requirements
- Implement core state management foundation
- Develop domain-specific types and interfaces
- Build IndexedDB persistence layer
- Implement initial utilities and helpers
- Start world configuration system implementation with AI assistance

## 9. Development Status
The project has completed the requirements definition and planning phase. The next step is to begin implementation of the core infrastructure and state management components.

## 10. Phased Development Plan

### Phase 1: Project Setup and Infrastructure
- Initialize Next.js project with TypeScript
- Configure development tools
- Create domain-driven folder structure
- Set up state management architecture
- Implement IndexedDB persistence layer

### Phase 2: World Configuration System
- Implement world configuration reducer and types
- Create AI-assisted world creation components
- Build world description analyzer using Google Gemini
- Develop attribute and skill suggestion system
- Create template worlds as fallback options

### Phase 3: Character System
- Implement character state reducer and types
- Create 4-step character creation wizard
- Build character listing with filtering and sorting

### Phase 4: AI Service Integration
- Implement Google Gemini service
- Create narrative prompt templates
- Develop error handling and retry logic

### Phase 5: Narrative Engine
- Implement narrative state reducer and types
- Create player choice interface components
- Build narrative history tracking

### Phase 6: Journal System
- Implement journal entry data model and reducer
- Create automatic entry creation system
- Build journal list view component

### Phase 7: Game Session Integration
- Create game session container component
- Integrate narrative display with AI service
- Connect player choices to narrative progression

### Phase 8: Testing and Refinement
- Complete unit test coverage
- Add integration tests for system interactions
- Conduct usability testing and fix issues

## 11. Next Steps
- Convert requirements to GitHub issues
- Set up Next.js project with proper structure
- Implement state management foundation
- Create utility functions and helpers
- Begin world configuration system implementation with AI assistance
