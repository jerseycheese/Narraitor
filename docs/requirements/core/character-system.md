---
title: Character System Requirements
aliases: [Character Management Requirements]
tags: [narraitor, requirements, character-system]
created: 2025-04-29
updated: 2025-05-03
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
- **Character Validation**: Ensure character data meets world requirements

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
  createdAt: string;
  updatedAt: string;
  lastLocationId?: string; // Added for potential future use, keeping minimal for MVP
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
  formula?: string; // Formula might be defined at the World level or here for simple cases
  dependencies?: string[]; // IDs of attributes or other derived stats
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
- Users view a list of existing characters

## Integration Points
- **World System**: Uses attribute and skill definitions from the selected world, may define derived stat formulas
- **Narrative Engine**: Provides character context for narrative generation, may use derived stats for determinations
- **Journal System**: Provides character information for journal entries
- **State Management**: Persists character data between sessions
- **Inventory System**: Manages character items and equipment
- **AI Service**: May use derived stats for narrative generation

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
  - Derived statistics
  - Formatted description and background
- Basic character editing for all fields
- Character deletion with confirmation
- Responsive design for all character interfaces
- Basic recovery system for unsaved character progress
- Optional portrait text description field
- Randomized character generation
- DevTools integration to expose helpful info/debug tools
- Basic inventory management with item listing, adding, and removing.
- Basic Derived Statistics:
  - Calculation of a few key derived stats based on simple formulas (e.g., based directly on one or two attributes).
  - Display of derived stats on the character sheet.
  - Availability of derived stats data for the Narrative Engine/AI Service.

### Excluded from MVP
- Character advancement and progression
- Character relationships with NPCs
- Character status effects or conditions
- Combat statistics calculation (unless covered by basic derived stats)
- Character history tracking
- Character sharing functionality
- Character sorting by name and creation date
- Character filtering by world
- Custom character sheets
- Character cloning
- Character export/import
- Complex derived statistics formulas or dependencies between derived stats.
- Advanced inventory features (equipping, item properties beyond name/quantity, categories, weight/limits)
- Comprehensive UI for defining or managing derived stat formulas within the Character System.
- Support for multiple characters per world

## User Stories and Acceptance Criteria

### 1. Character Creation
**User Story**: As a user, I want to create a new character for my selected world so I can have a persona in the narrative.

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
1. Users can enter a name and description for their character
2. Users can allocate attribute points according to the world's constraints
3. Users can select and rate skills based on the world's definitions
4. Users can provide a background and personality description
5. The created character is saved and appears in the character list

### 2. Attribute Allocation
**User Story**: As a user, I want to allocate attribute points to customize my character's strengths and weaknesses.

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
1. Users can distribute a fixed number of attribute points among available attributes
2. The interface enforces minimum and maximum values for each attribute
3. The interface shows remaining points as attributes are allocated
4. Users can reset attribute allocations to start over
5. Users cannot proceed until all attribute points are allocated

### 3. Skill Selection
**User Story**: As a user, I want to select and rate skills that define my character's abilities.

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
1. Users can select skills from a list defined by the world configuration
2. Users can assign ratings to selected skills within allowed ranges
3. The interface enforces any skill selection limits (e.g., maximum number of skills)
4. Users can remove or change selections before finalizing
5. Selected skills appear on the character sheet with their ratings

### 4. Character Description
**User Story**: As a user, I want to write a description and background for my character to establish their identity.

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
1. Users can enter a physical description of their character
2. Users can enter personality traits for their character
3. Users can enter a background story for their character
4. The interface validates that required fields are completed
5. Character descriptions are properly formatted and displayed on the character sheet

### 5. Character Recovery
**User Story**: As a user, I want to resume character creation if I accidentally navigate away or close the browser.

## Priority
- [ ] High (MVP)
- [x] Medium (MVP Enhancement)
- [ ] Low (Nice to Have)
- [ ] Post-MVP

## Estimated Complexity
- [ ] Small
- [x] Medium
- [ ] Large

**Acceptance Criteria**:
1. The system automatically saves character creation progress periodically
2. When returning to character creation, the system detects and offers to restore previous work
3. Users can choose to continue from saved progress or start fresh
4. All previously entered data is correctly restored when resuming
5. The recovery system works across browser sessions

### 6. Character Management
**User Story**: As a user, I want to view all my created characters so I can select one for play.

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
1. All characters created by the user are displayed in a list
2. Each character entry shows basic information (name, world, description)
3. Characters are loaded from persistent storage when the page loads
4. The list is responsive and works on different screen sizes
5. The user can select a character from the list for detailed view or gameplay

### 7. Character Editing
**User Story**: As a user, I want to edit my existing characters to refine their attributes, skills, or descriptions.

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
1. Users can modify all aspects of an existing character
2. The system validates changes against the world's constraints
3. Changes are saved immediately when submitted
4. The interface provides clear feedback when changes are saved
5. Users can cancel edits without saving changes

### 8. Character Deletion
**User Story**: As a user, I want to delete characters I no longer want to use.

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
1. Users can initiate character deletion from the character list or detail view
2. The system requires confirmation before completing deletion
3. Deleted characters are permanently removed from storage
4. The interface provides feedback when deletion is complete
5. The character list updates immediately after deletion

### 9. Character Selection
**User Story**: As a user, I want to select a character to use in my narrative session.

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
1. The user can select a character from their list of created characters
2. The selected character is properly loaded into the narrative session
3. The character selection is persisted between browser sessions
4. The user interface provides clear feedback when a character is selected
5. A summary of the selected character is displayed during gameplay, including key derived stats

### 10. Character Summary
**User Story**: As a user, I want to see a summary of my character during gameplay for reference, including key derived stats.

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
1. Character summary is accessible throughout the gameplay session
2. Summary displays character name, attributes, skills, and key derived stats
3. Summary information is presented in a compact, readable format
4. Character summary is updated if character data changes during gameplay
5. The summary view is responsive and adapts to different screen sizes

## GitHub Issues
- [Create Character Creation Wizard component] - Link to GitHub issue
- [Implement character data model and state management] - Link to GitHub issue
- [Build attribute allocation interface] - Link to GitHub issue
- [Build skill selection interface] - Link to GitHub issue
- [Create character listing and selection interface] - Link to GitHub issue
- [Implement basic character editing functionality] - Link to GitHub issue
- [Create character detail view component with derived stats] - Link to GitHub issue
- [Implement character deletion with confirmation] - Link to GitHub issue
- [Implement character creation progress recovery] - Link to GitHub issue
- [Implement character validation] - Link to GitHub issue
- [Implement basic inventory management] - Link to GitHub issue
- [Implement basic derived statistics calculation] - Link to GitHub issue
- [Integrate derived stats with narrative engine/AI service] - Link to GitHub issue

## BootHillGM Reference Code
- The character creation implementation in `/app/components/CharacterCreation` provides a solid example for the wizard-based approach
- The character recovery system in `/app/components/GameSessionContent.tsx` (particularly the `useCharacterExtraction` hook) demonstrates effective pattern for recovering progress
- The character state management in `/app/reducers/character/characterReducer.ts` offers a structure for managing character data
- The character sheet component in `/app/components/CharacterSheetContent.tsx` shows how to display character information effectively, including potential areas for derived stats.
- The inventory system in BootHillGM (`/app/components/Inventory.tsx` and related files) could serve as a template for MVP inventory implementation.

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met