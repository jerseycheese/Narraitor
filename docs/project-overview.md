---
title: NarrAItor Project Overview
aliases: [Project Overview, Overview]
tags: [narraitor, documentation, overview]
created: 2025-04-27
updated: 2025-04-28
---

# NarrAItor Project Overview

## 1. Project Description
NarrAItor is a Next.js-based web application providing an AI-driven narrative experience for tabletop RPGs across any fictional world. The application uses modern AI models to deliver dynamic storytelling while adapting to the specific themes, tone, and mechanics of the selected world. Built with modern web technologies, it offers an accessible and responsive single-player experience.

## 2. Current Development Status

### 2.1 Planning Phase
- Initial documentation and architecture design
- Research into modern approaches and best practices
- Definition of core systems and component structure
- Establishing development workflows and methodologies
- MVP approach with phased implementation

## 3. Technical Foundation
- Framework: Next.js 14.x with App Router
- AI Integration: Currently targeting Google Gemini models (with considerations for alternatives)
- State Management: Domain-specific reducers with React Context
- Data Persistence: IndexedDB with automated saving
- UI: Tailwind CSS with world-specific theming
- Testing: Jest with React Testing Library and Playwright for E2E
- Component Development: Storybook-first approach
- Visual Elements: Images generated via Google Imagen 3 or Midjourney

## 4. Project Objectives
- Create a flexible narrative RPG framework adaptable to any fictional world
- Implement world-agnostic systems for characters, NPCs, and narratives
- Develop a clean, modular codebase with files under 300 lines
- Follow strict Test-Driven Development practices
- Integrate visual elements early for better engagement
- Maintain comprehensive NPC tracking throughout narratives
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

### 7.1 Core Systems
- **World Configuration System**: Basic world settings and rules
- **Character System**: Simple character creation and management
- **Narrative Engine**: AI-driven storytelling
- **Journal System**: Basic history tracking
- **State Management**: Game state persistence between sessions

### 7.2 User Interface
- World Selection Interface
- Character Creation Wizard
- Game Session Interface
- Journal Viewer

## 8. Current Priorities
- Complete core architecture documentation
- Create initial flow diagrams
- Set up project skeleton with proper structure
- Implement core state management foundation
- Implement MVP world configuration system

## 9. Development Status
The project is in the initial planning and architecture design phase. Documentation is being created and research is being conducted into best practices and approaches.

## 10. Phased Development Plan

### Phase 1: Core Framework (MVP)
- World definition system (minimal)
- Basic character creation
- Simple narrative engine
- State persistence

### Phase 2: Enhanced Narrative
- Improved AI integration
- Better context management
- NPC relationships
- Expanded journal

### Phase 3: Extended Systems
- Combat (if enabled)
- Inventory management
- Character advancement
- Rich visualization

## 11. Next Steps
- Register domain names (narraitor.com, narraitor.ai)
- Set up Next.js project with proper structure
- Implement TDD workflow and scripts
- Create GitHub PR templates and workflows
- Develop initial component library in Storybook
- Implement world configuration system
