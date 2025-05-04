---
title: World Interface Requirements
aliases: [World UI Requirements]
tags: [narraitor, requirements, ui, world-interface]
created: 2025-04-29
updated: 2025-04-29
---

# World Interface Requirements

## Overview
The World Interface provides the user-facing components for creating, editing, and managing fictional worlds in Narraitor. It offers intuitive interfaces for world configuration, attribute and skill management, template selection, and world listing.

## Core Functionality
- **World Creation Wizard**: Step-by-step interface for creating new worlds
- **World Listing**: View and select from available worlds
- **World Editor**: Modify existing world configurations
- **Attribute Management**: Interface for adding and editing attributes
- **Skill Management**: Interface for adding and editing skills
- **Tone Configuration**: Interface for setting narrative tone preferences (post-MVP)
- **Template Selection**: Choose from pre-defined world templates (post-MVP)
- **World Import/Export**: User interface for data import/export (post-MVP)

## UI Components

### Core Components
- **WorldList**: Displays available worlds with filtering options
- **WorldCreationWizard**: Multi-step wizard for world creation
- **WorldEditor**: Form-based interface for editing worlds
- **AttributeEditor**: Component for managing world attributes
- **SkillEditor**: Component for managing world skills
- **ToneSettingsEditor**: Component for configuring narrative tone (post-MVP)
- **WorldTemplateSelector**: Grid or list of template options (post-MVP)
- **ImportExportControls**: Buttons and modal dialogs for data operations (post-MVP)

## User Interactions
- Users navigate a multi-step wizard to create new worlds
- Users view a list of existing worlds with basic information
- Users edit attributes, skills, and basic settings through form interfaces
- Users select world templates to expedite creation (post-MVP)
- Users import and export world configurations (post-MVP)
- Users delete unwanted worlds with confirmation

## Integration Points
- **World System**: Connects UI to world data and operations
- **State Management**: Persists UI state during wizard steps
- **Character System**: Influences attribute and skill definitions
- **Narrative Engine**: Connected to basic world settings

## MVP Scope Boundaries

### Included
- Basic world creation wizard with essential steps
- Simple list view of available worlds
- Form-based world editing interface
- Attribute and skill management interfaces
- AI-assisted world creation

### Excluded
- Tone settings configuration
- Template selection from three options
- Basic import/export UI
- Advanced visualization of world structure
- Collaborative editing features
- Complex validation rules with visual feedback
- Theme customization interface
- Advanced filtering and searching
- Drag-and-drop organization tools
- Rich text formatting for descriptions

## User Stories

1. **World Creation**
   - As a user, I want to create a new world with basic information so I can start building my narrative setting

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
     1. The `WorldCreationWizard` component guides the user through steps including providing a freeform description.
     2. Basic validation ensures required fields (name, description) are filled.
     3. Created worlds are saved to the system with unique identifiers.
     4. The user can navigate between wizard steps with appropriate validation.

   - As a user, I want clear step-by-step guidance during world creation so I don't miss important configuration options

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
     1. The wizard clearly indicates the current step and total steps.
     2. Each step has a clear title and description of what needs to be configured.
     3. The wizard prevents advancing to the next step if required fields are incomplete.
     4. Progress is saved between steps to prevent data loss.

   - As a user, I want suggestions and help text for each field so I understand what I'm configuring

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
     1. The UI displays AI-generated suggestions for attributes and skills based on the description.
     2. Tooltips or help text are available for key configuration fields.
     3. Example values are shown where appropriate.
     4. Error messages provide guidance for resolving validation issues.

2. **Attribute Management**
   - As a user, I want to add custom attributes to my world so I can define character traits

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
     1. The `AttributeEditor` component allows adding new attributes (up to 6 total).
     2. Users can define attribute name and description.
     3. The interface prevents creating duplicate attribute names.
     4. Added attributes appear immediately in the attributes list.

   - As a user, I want to set attribute ranges and default values so I can establish world norms

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
     1. Users can set a default value for each attribute within the allowed range.
     2. Min/Max values are fixed at 1-10 for MVP.
     3. The interface provides visual controls for setting numeric values.
     4. Invalid values are prevented through UI constraints.

   - As a user, I want to edit attributes after creation so I can refine my world

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
     1. Existing attributes can be edited or removed via the interface.
     2. Edits to attributes are saved immediately.
     3. The system warns when removing attributes that are linked to skills.
     4. Attribute changes are reflected in the world configuration.

3. **Skill Management**
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
     1. The `SkillEditor` component allows adding new skills (up to 12 total).
     2. Users can define skill name and description.
     3. The interface prevents creating duplicate skill names.
     4. Added skills appear immediately in the skills list.

   - As a user, I want to define skill ranges and default values so I can control skill distribution

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
     1. Users can set a default value for each skill within the allowed range.
     2. Min/Max values are fixed at 1-5 for MVP.
     3. The interface provides visual controls for setting numeric values.
     4. Invalid values are prevented through UI constraints.

   - As a user, I want to organize skills by related attributes so there's logical character development

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
     1. Users can link each skill to 1-2 existing attributes via a selection mechanism.
     2. The UI shows which attributes are linked to each skill.
     3. Skills maintain their attribute relationships after editing.
     4. The system validates that linked attributes exist.

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
     1. The `WorldList` component displays all created worlds.
     2. Worlds can be selected for viewing or play.
     3. The world list loads automatically when the page is accessed.
     4. The list is responsive and works on different screen sizes.

   - As a user, I want to see basic information about each world so I can identify them easily

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
     1. Each world entry displays name, description, and genre.
     2. The list shows when each world was created or last modified.
     3. The information is presented in a clean, readable format.
     4. The display adapts responsively to different screen sizes.

   - As a user, I want to edit existing worlds so I can refine my settings

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
     1. Selecting a world allows viewing/editing its details via the `WorldEditor`.
     2. The `WorldEditor` provides forms to modify basic info, attributes, and skills.
     3. Changes are saved automatically or with an explicit save action.
     4. The editor prevents invalid modifications.

   - As a user, I want to delete worlds I no longer need with proper confirmation

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
     1. A delete option is available for each world.
     2. A confirmation dialog is shown before completing deletion.
     3. The world list updates immediately after deletion.
     4. The system provides feedback when deletion is complete.

## Technical Implementation Details

### Component Structure
```
WorldInterface/
├── WorldList/
│   ├── WorldList.tsx
│   ├── WorldCard.tsx
│   └── DeleteConfirmation.tsx
├── WorldCreation/
│   ├── WorldCreationWizard.tsx
│   ├── BasicInfoStep.tsx
│   ├── AttributesStep.tsx
│   ├── SkillsStep.tsx
│   ├── ThemeStep.tsx
│   └── WizardNavigation.tsx
├── WorldEditor/
│   ├── WorldEditor.tsx
│   ├── GeneralSettings.tsx
│   ├── AttributeManager.tsx
│   ├── SkillManager.tsx
│   └── EditorSidebar.tsx
├── AttributeEditor/
│   ├── AttributeEditor.tsx
│   ├── AttributeForm.tsx
│   ├── AttributeList.tsx
│   └── AttributeCard.tsx
├── SkillEditor/
│   ├── SkillEditor.tsx
│   ├── SkillForm.tsx
│   ├── SkillList.tsx
│   └── SkillCard.tsx
├── Common/
│   ├── FormField.tsx
│   ├── RangeInput.tsx
│   ├── HelpTooltip.tsx
│   └── ValidationMessage.tsx
└── WorldInterface.tsx
```

### Form Validation Strategy
- Client-side validation for immediate feedback
- Server-side validation for data integrity
- Inline validation messages next to form fields
- Form-level validation for cross-field dependencies
- Clear visual indicators for validation state
- Helpful error messages with suggestions for correction

### State Management
- React Context for wizard step state
- Form state using React Hook Form
- Redux for world data persistence
- Optimistic UI updates for better UX
- Debounced auto-save during form editing

### Responsive Design
- Mobile-first approach
- Single-column layout on mobile devices
- Multi-column layout on larger screens
- Collapsible sections on smaller viewports
- Touch-friendly controls for mobile users
- Maintained usability across device sizes

## GitHub Issues
- [Create WorldList component] - Link to GitHub issue
- [Implement WorldCreationWizard component] - Link to GitHub issue
- [Build WorldEditor component] - Link to GitHub issue
- [Develop AttributeEditor component] - Link to GitHub issue
- [Create SkillEditor component] - Link to GitHub issue
- [Build AI assistance integration] - Link to GitHub issue
- [Implement responsive layout] - Link to GitHub issue
- [Create form validation system] - Link to GitHub issue
- [Build world deletion functionality] - Link to GitHub issue

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met