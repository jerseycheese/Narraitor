---
title: Character System Requirements
aliases: [Character Management Requirements]
tags: [narraitor, requirements, character-system]
created: 2025-04-29
updated: 2025-04-29
---

# Character System Requirements

## Overview
The Character System provides functionality for creating, managing, and representing player characters within the narrative world. It allows players to define their in-game personas based on the attributes and skills defined by the selected world configuration.

## Core Functionality
- **Character Creation**: Step-by-step wizard for creating characters
- **Attribute Assignment**: Allocation of attribute points based on world configuration
- **Skill Selection**: Selection and rating of skills based on world configuration
- **Character Description**: Text-based description of character appearance and personality
- **Inventory Management**: Track and manage character possessions and equipment
- **Derived Statistics**: Calculate derived values based on attributes
- **Character Storage**: Save and retrieve character data
- **Character List**: View and manage multiple characters
- **Character Editing**: Modify existing characters
- **Character Recovery**: Recover unsaved character creation progress
- **Portrait Options**: Basic avatar selection or description

## Data Model

```typescript
interface Character {
  id: string;
  name: string;
  worldId: string;  // Reference to the world this character belongs to
  description: string;
  personality: string;
  background: string;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  inventory?: Inventory;
  derivedStats?: DerivedStatistic[];
  portraitDescription?: string;
  portraitUrl?: string;  // Optional placeholder for future features
  lastLocationId?: string;
  status?: CharacterStatus;
  createdAt: string;
  updatedAt: string;
}

interface CharacterAttribute {
  id: string;
  definitionId: string;  // Reference to the attribute definition in the world
  name: string;  // Cached for convenience
  value: number;
}

interface CharacterSkill {
  id: string;
  definitionId: string;  // Reference to the skill definition in the world
  name: string;  // Cached for convenience
  value: number;
}

interface Inventory {
  id: string;
  characterId: string;
  items: InventoryItem[];
  maxItems?: number;
  categories?: InventoryCategory[];
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: string;
  properties?: Record<string, any>;
  tags?: string[];
}

interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  itemTypes: string[];
}

interface DerivedStatistic {
  id: string;
  name: string;
  description: string;
  value: number;
  formula: string;
  dependencies: string[]; // IDs of attributes or other derived stats
}

interface CharacterStatus {
  health?: number;
  maxHealth?: number;
  conditions?: string[];
  notes?: string;
}
```

## User Interactions
- Users create characters through a guided wizard interface
- Users allocate attribute points according to world constraints
- Users select and rate skills based on world definitions
- Users provide text descriptions of character appearance and personality
- Users manage character inventory and equipment
- Users view derived statistics based on attributes
- Users view, edit, and delete existing characters
- Users resume character creation if interrupted

## Integration Points
- **World System**: Uses attribute and skill definitions from the selected world
- **Narrative Engine**: Provides character context for narrative generation
- **Journal System**: Provides character information for journal entries
- **State Management**: Persists character data between sessions
- **Inventory System**: Manages character items and equipment
- **Location System**: Tracks character's current location in the world

## MVP Scope Boundaries

### Included
- Character creation wizard with 4 steps:
  1. Basic info (name, short description)
  2. Attribute allocation (point-buy system with minimum and maximum values)
  3. Skill selection (choose and rate up to 8 skills)
  4. Character background (personality and history text fields)
- Character validation to ensure:
  - Name and description are provided
  - Attribute points are allocated within limits
  - Skill ratings are valid
- Character listing page showing:
  - Character name
  - World they belong to
  - Creation date
  - Brief description preview
- Character detail view showing:
  - Full character information
  - Attribute and skill values
  - Formatted description and background
- Basic character editing for all fields
- Character deletion with confirmation
- Support for multiple characters per world
- Character filtering by world
- Character sorting by name and creation date
- Responsive design for all character interfaces
- Basic recovery system for unsaved character progress
- Optional portrait text description field

### Excluded from MVP
- Character advancement and progression
- Inventory management
- Character relationships with NPCs
- Character status effects or conditions
- Combat statistics (unless defined by world attributes)
- Character history tracking
- Character portrait/image generation
- Character sharing functionality
- Custom character sheets
- Character cloning
- Character export/import
- Randomized character generation
- Derived statistics calculation

## User Stories

1. **Character Creation**
   - As a user, I want to create a new character for my selected world so I can have a persona in the narrative
   - As a user, I want to allocate attribute points to customize my character's strengths and weaknesses
   - As a user, I want to select and rate skills that define my character's abilities
   - As a user, I want to write a description and background for my character to establish their identity
   - As a user, I want to resume character creation if I accidentally navigate away or close the browser

2. **Character Management**
   - As a user, I want to view all my created characters so I can select one for play
   - As a user, I want to edit my existing characters to refine their attributes, skills, or descriptions
   - As a user, I want to delete characters I no longer want to use
   - As a user, I want to filter characters by world to easily find appropriate characters

3. **Character Selection**
   - As a user, I want to select a character to use in my narrative session
   - As a user, I want to see a summary of my character during gameplay for reference

4. **Inventory Management** (post-MVP)
   - As a user, I want to manage my character's inventory of items
   - As a user, I want to organize items into categories for easier management
   - As a user, I want items to have properties relevant to the game world

5. **Character Status and Progression** (post-MVP)
   - As a user, I want to see derived statistics based on my character's attributes
   - As a user, I want to track my character's health, status effects, and conditions
   - As a user, I want to advance my character's skills and attributes over time

## Acceptance Criteria
1. Users can successfully create characters with all required information
2. Character creation enforces the attributes and skills defined by the selected world
3. Character creation validates inputs and prevents invalid configurations
4. Users can view all created characters with filtering and sorting options
5. Users can edit and delete existing characters
6. Character data correctly persists between sessions
7. The system supports multiple characters per world
8. Character information is properly provided to the narrative engine
9. Users can select characters for gameplay sessions
10. Character management interfaces are responsive across device sizes
11. Users can recover unsaved character creation progress if browser is closed
12. Users receive validation feedback for invalid inputs

## GitHub Issues
- [Create Character Creation Wizard component] - Link to GitHub issue
- [Implement character data model and state management] - Link to GitHub issue
- [Build attribute allocation interface] - Link to GitHub issue
- [Build skill selection interface] - Link to GitHub issue
- [Create character listing and selection interface] - Link to GitHub issue
- [Implement character editing functionality] - Link to GitHub issue
- [Create character detail view component] - Link to GitHub issue
- [Implement character deletion with confirmation] - Link to GitHub issue
- [Build character filtering and sorting] - Link to GitHub issue
- [Implement character creation progress recovery] - Link to GitHub issue

## BootHillGM Reference Code
- The character creation implementation in `/app/components/CharacterCreation` provides a solid example for the wizard-based approach
- The character recovery system in `/app/components/GameSessionContent.tsx` (particularly the `useCharacterExtraction` hook) demonstrates effective pattern for recovering progress
- The character state management in `/app/reducers/character/characterReducer.ts` offers a structure for managing character data
- The character sheet component in `/app/components/CharacterSheetContent.tsx` shows how to display character information effectively
- The inventory system in BootHillGM (`/app/components/Inventory.tsx` and related files) could serve as a template for post-MVP inventory implementation

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met
