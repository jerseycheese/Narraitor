---
title: World Configuration System Requirements
aliases: [World System Requirements]
tags: [narraitor, requirements, world-system]
created: 2025-04-29
updated: 2025-04-29
---

# World Configuration System Requirements

## Overview
The World Configuration System allows users to define and customize fictional worlds with their own attributes, skills, and narrative tone settings. It forms the foundation of NarrAItor by establishing the parameters that influence character creation, narrative style, and gameplay mechanics.

## Core Functionality
- **World Creation**: Create new world configurations with name, description, and genre
- **Attribute Management**: Define custom attributes with ranges and default values
- **Skill Management**: Define skills linked to attributes
- **Tone Configuration**: Set narrative tone and style preferences
- **Template System**: Select from pre-defined world templates
- **World Export/Import**: Export and import world configurations as JSON
- **Location Management**: Define and manage locations within the world
- **Error Handling**: Graceful error handling and validation for world configurations

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
  toneSettings: ToneSettings;
  locations?: LocationDefinition[];
  ruleMechanics?: RuleMechanic[];
  createdAt: string;
  updatedAt: string;
}

interface AttributeDefinition {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  category?: string;
}

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  relatedAttributes: string[]; // IDs of attributes
  minValue: number;
  maxValue: number;
  defaultValue: number;
  category?: string;
}

interface ToneSettings {
  narrativeStyle: 'descriptive' | 'concise' | 'dramatic' | 'humorous';
  pacePreference: 'slow' | 'moderate' | 'fast';
  contentRating: 'family' | 'teen' | 'mature';
  thematicElements: string[];
  languageStyle: 'formal' | 'casual' | 'period-appropriate';
  narrativePromptTemplates?: Record<string, string>;
}

interface WorldTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  backgroundStyle: string;
  customCSS?: string;
}

interface LocationDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  connections: string[]; // IDs of connected locations
  tags: string[];
  initialNarrativePrompt?: string;
}

interface RuleMechanic {
  id: string;
  name: string;
  description: string;
  type: string;
  formula?: string;
  affectedAttributes?: string[];
  affectedSkills?: string[];
}
```

## User Interactions
- Users create worlds through a step-by-step wizard interface
- Users select from templates to speed up creation
- Users edit existing worlds through a dedicated interface
- Users view a list of available worlds and select one for play
- Users export worlds to share or backup configurations
- Users import worlds created by themselves or others
- Users manage locations within a world with connections between them
- Users define world-specific rule mechanics (optional)

## Integration Points
- **Character System**: Provides attribute and skill definitions for character creation
- **Narrative Engine**: Provides tone settings to guide AI narrative generation
- **Journal System**: Provides world context for journal entries
- **State Management**: Persists world configurations between sessions
- **Location Service**: Manages locations for scene transitions in narrative
- **Recovery System**: Handles error recovery for world configuration issues

## MVP Scope Boundaries

### Included
- Basic world information (name, description, genre) with form validation
- Essential attributes system with:
  - Up to 6 attributes per world
  - Numeric range of 1-10 for all attributes
  - Description field for each attribute
- Skills system with:
  - Up to 12 skills per world
  - Numeric range of 1-5 for all skills
  - Each skill linked to 1-2 attributes
- Basic tone settings:
  - Four narrative style options (descriptive, concise, dramatic, humorous)
  - Three pacing options (slow, moderate, fast)
  - Three content rating options (family, teen, mature)
  - Up to 5 thematic elements as string tags
  - Three language style options (formal, casual, period-appropriate)
- Three template worlds: 
  - Fantasy Adventure (attributes: Strength, Dexterity, Intelligence, Wisdom, Charisma, Constitution)
  - Sci-Fi Exploration (attributes: Physique, Reflexes, Intelligence, Perception, Social, Technical)
  - Mystery Investigation (attributes: Physical, Mental, Social, Observation, Knowledge, Intuition)
- Simple import/export functionality using JSON file format
- World selection screen showing name, description, and genre
- Basic editor interface for updating world settings after creation
- Five pre-defined theme options that affect UI appearance
- Basic error handling and validation for world configurations

### Excluded from MVP
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
   - As a user, I want to create a new world with basic information so I can start building my narrative setting
   - As a user, I want to select a pre-defined template to quickly set up a world in a particular genre

2. **Attribute Management**
   - As a user, I want to define custom attributes for my world so characters can have appropriate traits
   - As a user, I want to set ranges and default values for attributes to establish world norms
   - As a user, I want to categorize attributes for better organization (post-MVP)

3. **Skill Management**
   - As a user, I want to create skills linked to attributes so characters can have specialized abilities
   - As a user, I want to organize skills by related attributes for logical character development
   - As a user, I want to categorize skills by type or domain (post-MVP)

4. **Tone Configuration**
   - As a user, I want to set narrative style preferences so the generated content matches my desired tone
   - As a user, I want to specify content rating to ensure appropriate material for my intended audience
   - As a user, I want to define custom narrative prompt templates for specific situations (post-MVP)

5. **World Selection and Management**
   - As a user, I want to view all my created worlds so I can select one for play
   - As a user, I want to edit existing worlds to refine my settings
   - As a user, I want to export my world configuration so I can backup or share it
   - As a user, I want to import a world configuration so I can use settings created by myself or others

6. **Location Management** (post-MVP)
   - As a user, I want to define locations within my world so characters can have places to visit
   - As a user, I want to create connections between locations for narrative flow
   - As a user, I want to set an initial narrative prompt for each location

7. **Rule Mechanics** (post-MVP)
   - As a user, I want to define custom rule mechanics for my world
   - As a user, I want to specify formulas for derived statistics based on attributes
   - As a user, I want to create special rules for specific world interactions

## Acceptance Criteria
1. Users can successfully create, edit, and delete worlds
2. Users can define custom attributes and skills for each world with proper validation
3. Users can configure tone settings that influence narrative generation
4. Template worlds demonstrate different genres with appropriate attributes and skills
5. Worlds can be exported to JSON and imported from JSON files
6. World settings correctly influence character creation and narrative generation
7. UI adapts to the selected world's theme
8. Form validation prevents invalid configurations (e.g., duplicate attribute names)
9. World list shows all created worlds with sorting by date created
10. Deleted worlds are confirmed before removal and completely purged from storage
11. The system handles errors gracefully during world creation and editing
12. The system allows recovery of unsaved world configuration progress

## GitHub Issues
- [Create World Creation Wizard component] - Link to GitHub issue
- [Implement world data model and state management] - Link to GitHub issue
- [Develop world template system with three templates] - Link to GitHub issue
- [Create world export/import functionality] - Link to GitHub issue
- [Build world selection interface] - Link to GitHub issue
- [Implement world editor interface] - Link to GitHub issue
- [Create world theme system with 5 preset themes] - Link to GitHub issue
- [Implement attribute management interface] - Link to GitHub issue
- [Implement skill management interface] - Link to GitHub issue
- [Create error handling and validation for world configurations] - Link to GitHub issue

## BootHillGM Reference Code
- The BootHillGM project doesn't have an explicit world configuration system as it uses a fixed western setting. However, the state management approach in `/app/reducers/gameReducer.ts` could provide patterns for managing world state.
- The error handling in `/app/components/ErrorBoundary.tsx` could be adapted for world configuration validation.
- The location-related code in `/app/services/locationService.ts` could be valuable for implementing the post-MVP location management features.

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
