---
title: World Configuration System Requirements
aliases: [World System Requirements]
tags: [narraitor, requirements, world-system]
created: 2025-04-29
updated: 2025-04-30
---

# World Configuration System Requirements

## Overview
The World Configuration System allows users to define and customize fictional worlds with their own attributes, skills, and narrative tone settings. It forms the foundation of NarrAItor by establishing the parameters that influence character creation, narrative style, and gameplay mechanics. The system uses AI to assist in transforming a user's freeform world description into a structured game world with appropriate attributes and skills.

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

1. **World Creation**
   - As a user, I want to create a new world by describing it in my own words so I can quickly set up a custom narrative setting
   - As a user, I want AI to suggest appropriate attributes and skills based on my world description so I don't have to design everything from scratch
   - As a user, I want to select a pre-defined template to quickly set up a world if I don't want to create my own

2. **Attribute Management**
   - As a user, I want to review and modify AI-suggested attributes for my world so I can customize them to my preferences
   - As a user, I want to define custom attributes for my world so characters can have appropriate traits
   - As a user, I want to set ranges and default values for attributes to establish world norms

3. **Skill Management**
   - As a user, I want to review and modify AI-suggested skills for my world so I can customize them to my preferences
   - As a user, I want to create skills linked to attributes so characters can have specialized abilities
   - As a user, I want to organize skills by related attributes for logical character development

4. **World Selection and Management**
   - As a user, I want to view all my created worlds so I can select one for play
   - As a user, I want to edit existing worlds to refine my settings

## Acceptance Criteria
1. Users can successfully create worlds by providing freeform descriptions
2. AI can analyze world descriptions and suggest appropriate attributes and skills
3. Users can review and modify AI suggestions to finalize their world
4. Templates are available as alternatives to AI-assisted creation
5. World configurations are properly validated to meet system requirements
6. Users can select from created worlds for gameplay
7. World settings correctly influence character creation
8. UI adapts to the selected world's theme
9. Form validation prevents invalid configurations (e.g., duplicate attribute names)
10. The system handles errors gracefully during world creation and editing
11. The system allows recovery of unsaved world configuration progress

## GitHub Issues
- [Implement AI-assisted world creation from freeform descriptions] - Link to GitHub issue
- [Create world data model and state management] - Link to GitHub issue
- [Build world description analyzer using AI] - Link to GitHub issue
- [Implement attribute and skill suggestion system] - Link to GitHub issue
- [Create user interface for reviewing and editing AI suggestions] - Link to GitHub issue
- [Develop template world system as fallback option] - Link to GitHub issue
- [Build world selection interface] - Link to GitHub issue
- [Implement world editor interface] - Link to GitHub issue
- [Create world theme system with 5 preset themes] - Link to GitHub issue
- [Implement validation and error handling for world configurations] - Link to GitHub issue

## BootHillGM Reference Code
- The BootHillGM project doesn't have an explicit world configuration system as it uses a fixed western setting. However, the state management approach in `/app/reducers/gameReducer.ts` could provide patterns for managing world state.
- The error handling in `/app/components/ErrorBoundary.tsx` could be adapted for world configuration validation.
- The AI prompt construction in `/app/services/ai/promptBuilder.ts` could serve as a reference for building world description analysis prompts.

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
