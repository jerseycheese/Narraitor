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

1. **World Creation**
- As a user, I want to create a new world by describing it in my own words so I can quickly set up a custom narrative setting

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The system accepts and processes a freeform text description of a fictional world.
  2. The system guides the user through a step-by-step world creation process.
  3. The user can enter basic world information including name, description, and genre.
  4. Form validation ensures required information is provided.

- As a user, I want AI to suggest appropriate attributes and skills based on my world description so I don't have to design everything from scratch

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [ ] Medium
  - [x] Large

  **Acceptance Criteria**:
  1. The AI Service analyzes the provided world description.
  2. The system suggests appropriate attributes and skills based on the analysis.
  3. The user receives clear feedback during AI processing.
  4. AI suggestions include appropriate names and descriptions for attributes and skills.

- As a user, I want to select a pre-defined template to quickly set up a world if I don't want to create my own

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [x] Small
  - [ ] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. Pre-defined templates for Western, Sitcom, and Fantasy genres are available.
  2. Templates include complete sets of appropriate attributes and skills.
  3. Users can select and customize a template as an alternative to AI-assisted creation.
  4. Selected templates pre-populate all required world configuration fields.

2. **Attribute Management**
- As a user, I want to review and modify AI-suggested attributes for my world so I can customize them to my preferences

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The UI displays AI-suggested attributes clearly.
  2. Users can approve, modify, or reject each suggested attribute.
  3. Modified attributes are immediately updated in the UI.
  4. Changes persist between wizard steps.

- As a user, I want to define custom attributes for my world so characters can have appropriate traits

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. Users can add new custom attributes beyond AI suggestions.
  2. The system enforces the MVP limit of 6 total attributes.
  3. Each attribute requires a name and description.
  4. Duplicate attribute names are prevented through validation.

- As a user, I want to set ranges and default values for attributes to establish world norms

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [x] Small
  - [ ] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. For each attribute, users can set a default value.
  2. Attribute value ranges are fixed at 1-10 for MVP as specified in requirements.
  3. Default values must fall within the allowed range.
  4. The UI provides clear visual indicators of the value ranges.

3. **Skill Management**
- As a user, I want to review and modify AI-suggested skills for my world so I can customize them to my preferences

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The UI displays AI-suggested skills clearly.
  2. Users can approve, modify, or reject each suggested skill.
  3. Modified skills are immediately updated in the UI.
  4. Changes persist between wizard steps.

- As a user, I want to create skills linked to attributes so characters can have specialized abilities

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. Users can add new custom skills beyond AI suggestions.
  2. The system enforces the MVP limit of 12 total skills.
  3. Each skill requires a name and description.
  4. For each skill, users can link it to relevant attributes.
  5. Duplicate skill names are prevented through validation.

- As a user, I want to organize skills by related attributes for logical character development

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. Users can link each skill to 1-2 attributes using a selection interface.
  2. The UI shows which attributes are linked to each skill.
  3. Skills maintain their attribute relationships after editing.
  4. The system validates that linked attributes exist.
  5. Skill value ranges are fixed at 1-5 for MVP as specified in requirements.

4. **World Selection and Management**
- As a user, I want to view all my created worlds so I can select one for play

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [x] Small
  - [ ] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. A world selection screen displays all created worlds.
  2. Each world entry shows name, description, and genre.
  3. Users can select a world from the list to view or play.
  4. The selected world's configuration is loaded correctly.

- As a user, I want to edit existing worlds to refine my settings

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. An editing interface allows modification of world settings after creation.
  2. Users can modify attributes, skills, and basic world information.
  3. The interface validates changes to prevent invalid configurations.
  4. Changes to world configurations are automatically saved.
  5. Users can return to the game with updated world settings.

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
