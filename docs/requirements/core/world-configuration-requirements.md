---
title: World Configuration System Requirements
aliases: [World System Requirements]
tags: [narraitor, requirements, world-system]
created: 2025-04-29
updated: 2025-04-30
---

# World Configuration System Requirements

## Overview
The World Configuration System allows users to define and customize fictional worlds with their own attributes, skills, and narrative tone settings. It forms the foundation of Narraitor by establishing the parameters that influence character creation, narrative style, and gameplay mechanics. The system uses AI to assist in transforming a user's freeform world description into a structured game world with appropriate attributes and skills.

## Core Functionality
- **World Creation**: Create new world configurations from freeform descriptions using AI assistance
- **AI-Assisted Configuration**: Generate suggested attributes and skills based on user's world description
- **Attribute Management**: Define custom attributes with ranges and default values
- **Skill Management**: Define skills linked to attributes
- **Template System**: Provide predefined world templates as fallback options
- **World Selection**: View and select from created worlds
- **Basic Validation**: Ensure world configurations meet system requirements
- **Error Handling**: Graceful error handling for world configurations

## Data Model

```typescript
interface World {
  id: string;
  name: string;
  description: string;
  genre: string;
  theme: WorldTheme;
  attributes: AttributeDefinition[];
  skills: SkillDefinition[];
  originalDescription: string; // The user's original freeform description
  createdAt: string;
  updatedAt: string;
}

interface WorldCreationProgress {
  id: string;
  step: 'description' | 'attributes' | 'skills' | 'review';
  worldData: Partial<World>;
  aiSuggestions?: AISuggestions;
  lastUpdated: string;
}

interface AISuggestions {
  genre?: string;
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
  timestamp: string;
}

interface AttributeSuggestion extends Omit<AttributeDefinition, 'id'> {
  accepted: boolean;
}

interface SkillSuggestion extends Omit<SkillDefinition, 'id'> {
  accepted: boolean;
}

interface AttributeDefinition {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  relatedAttributes: string[]; // IDs of attributes
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

interface WorldTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  backgroundStyle: string;
}
```

## User Interactions
- Users create worlds by providing a freeform description of their fictional world
- AI analyzes the description and suggests appropriate attributes and skills
- Users review and modify AI suggestions to finalize their world configuration
- Users can select from template worlds as an alternative to AI-assisted creation
- Users view a list of available worlds and select one for play
- Users can edit existing worlds through a dedicated interface

## Integration Points
- **AI Service**: Processes user's world description to suggest attributes and skills
- **Character System**: Provides attribute and skill definitions for character creation
- **Narrative Engine**: Provides world context for narrative generation
- **Journal System**: Provides world context for journal entries
- **State Management**: Persists world configurations between sessions
- **Recovery System**: Handles error recovery for world configuration issues

## MVP Scope Boundaries

### Included
- AI-assisted world creation from freeform descriptions with:
  - User provides a description of their fictional world
  - AI analyzes description and suggests attributes and skills
  - User reviews and modifies suggestions
  - System finalizes world configuration
- Basic world information (name, description, genre) with form validation
- Essential attributes system with:
  - Up to 6 attributes per world
  - Numeric range of 1-10 for all attributes
  - Description field for each attribute
- Skills system with:
  - Up to 12 skills per world
  - Numeric range of 1-5 for all skills
  - Each skill linked to 1-2 attributes
- Basic template worlds as fallback options:
  - Western
  - Sitcom
  - Fantasy
- World selection screen showing name, description, and genre
- Basic editor interface for updating world settings after creation
- Five AI-generated theme option values that affect UI appearance
- Basic error handling and validation for world configurations

### Excluded from MVP
- Tone settings:
  - Narrative style options
  - Pacing options
  - Content rating options
  - Thematic elements
  - Language style options
- Import/export functionality using JSON file format
- Custom narrative prompt templates
- Location management within worlds
- Faction and organization definitions
- Advanced mechanics beyond attributes and skills
- Visual theme editor (limited to pre-defined themes)
- Collaborative world building features
- World versioning or revision history
- Advanced attribute relationships or derived statistics
- Complex skill trees or hierarchies
- World-specific rule modifications
- Custom CSS in world themes

## User Stories
For detailed user stories, please see the [World Configuration User Stories CSV file](./world-configuration-user-stories.csv).

## BootHillGM Reference Code
- The BootHillGM project doesn't have an explicit world configuration system as it uses a fixed western setting. However, the state management approach in `src/app/reducers/gameReducer.ts` could provide patterns for managing world state.
- The error handling in `src/app/components/ErrorBoundary.tsx` could be adapted for world configuration validation.
- The AI prompt construction in `src/app/services/ai/promptBuilder.ts` could serve as a reference for building world description analysis prompts.

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met