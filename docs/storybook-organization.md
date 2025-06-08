---
title: "Storybook Organization Guide"
type: guide
category: development
tags: [storybook, organization, components]
created: 2025-05-24
updated: 2025-06-08
---

# Storybook Organization Guide

## Overview

This guide documents the organization structure for Storybook stories in the Narraitor project. All stories follow a consistent categorization pattern to improve navigation and discoverability.

## Category Structure

All story titles follow this pattern:
```
Narraitor/[Domain]/[Type]/[Component]
```

### Domains

**Core Gameplay:**
- `Narraitor/World/` - World management and configuration
- `Narraitor/Character/` - Character creation and management
- `Narraitor/Game/` - Game sessions and gameplay
- `Narraitor/Narrative/` - Story generation and narrative display

**UI Components:**
- `Narraitor/UI/` - Reusable UI components
- `Narraitor/Design/` - Design system components

**System Components:**
- `Narraitor/DevTools/` - Development and debugging tools

### Types

Within each domain, components are organized by type:

**World Domain:**
- `Creation/` - World creation components (WorldCreationWizard, TemplateSelector, AISuggestions)
- `Display/` - Display components (WorldCard, WorldList, WorldListScreen)
- `Edit/` - Editing components (WorldEditor)

**Character Domain:**
- `Creation/` - Character creation components (CharacterCreationWizard, BasicInfoStep)

**Game Domain:**
- `Session/` - Game session components (GameSession, PlayerChoices, SessionControls)

**Narrative Domain:**
- `Display/` - Narrative display components (NarrativeDisplay, NarrativeHistory)
- `Control/` - Control components (NarrativeController)
- `Input/` - User input components (PlayerChoiceSelector)

**UI Domain:**
- `Forms/` - Form components (WorldAttributesForm, SkillRangeEditor)
- `Controls/` - Interactive controls (RangeSlider, SkillDifficulty, PointPoolManager)
- `Modals/` - Modal and dialog components (DeleteConfirmationDialog)
- `Feedback/` - Feedback components (SectionError from ErrorDisplay)

**DevTools Domain:**
- `Panels/` - Main panels (DevToolsPanel, AITestingPanel)
- `Components/` - Sub-components (CollapsibleSection, StateSection)

## Examples

```typescript
// World creation wizard
title: 'Narraitor/World/Creation/WorldCreationWizard'

// Game session component
title: 'Narraitor/Game/Session/GameSession'

// UI form component
title: 'Narraitor/UI/Forms/WorldAttributesForm'

// DevTools panel
title: 'Narraitor/DevTools/Panels/DevToolsPanel'
```

## Best Practices

1. **Keep Stories Colocated**: Story files should live alongside their components
2. **Use Consistent Naming**: Component name in the title should match the actual component name
3. **Add Documentation**: Use the `parameters.docs.description` field to describe the component
4. **Group Related Stories**: Use the type level to group related components together
5. **Follow Domain Boundaries**: Place components in the appropriate domain based on their functionality

## Migration Notes

When adding new stories or updating existing ones:
1. Check if the domain and type already exist
2. Follow the established pattern for similar components
3. If creating a new type, ensure it's generic enough to accommodate future components
4. Update this guide if introducing new domains or types