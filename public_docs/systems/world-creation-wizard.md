---
title: "World Creation Wizard Documentation"
type: architecture
category: world
tags: [world, wizard, creation, ai]
created: 2025-05-15
updated: 2026-07-21
---

# World Creation Wizard Documentation

## Overview

Creating a new RPG world can be overwhelming - do you need a Strength attribute? What skills make sense for a cyberpunk setting? The World Creation Wizard walks you through the process step by step, and even uses AI to analyze your world description and suggest appropriate attributes and skills.

## Architecture

### Component Structure

```
WorldCreationWizard
├── BasicInfoStep      (Step 1: Name, description, genre)
├── DescriptionStep    (Step 2: Detailed description with AI analysis)
├── AttributeReviewStep (Step 3: Review and select attributes)
├── SkillReviewStep    (Step 4: Review and select skills)
└── FinalizeStep       (Step 5: Confirm and create)
```

### State Management

The wizard uses local React state for managing:
- Current step progression
- World data being created
- AI suggestions for attributes and skills
- Validation errors
- Processing states

### Integration Points

1. **World Store** - Persists created worlds
2. **World Analyzer** - AI service for analyzing descriptions
3. **Next.js Router** - Navigation after completion

## Features

### AI-Powered Suggestions

This is where the wizard gets smart. Describe a post-apocalyptic wasteland and it suggests skills like "Radiation Resistance" and "Scavenging". Here's how it works:

1. Sends the description to the AI analyzer
2. Receives suggested attributes and skills
3. Presents suggestions for user review
4. Falls back to defaults if AI fails

### Context-Aware Guidance

Each step surfaces genre-aware coaching:

- Inline help text explains what to include in each field, with tailored prompts per genre.
- Example world descriptions, attribute hooks, and skill ideas appear before you ever invoke the AI.
- After running the analyzer, a preview highlights the top attribute and skill ideas so you can gauge tone at a glance.
- If you tweak the description later, the wizard flags that your AI suggestions are out of date and invites you to refresh them.

### Validation

We keep the validation reasonable but firm - enough to prevent obviously broken worlds:

- Name: 3+ characters required
- Description: 10+ characters (basic), 50-3000 characters (detailed)
- Attributes: 1-6 must be selected
- Skills: 1-12 must be selected

### Error Handling

Errors are caught so users never get stuck:

- Form validation errors display inline
- AI failures fall back to defaults
- Creation errors are caught and displayed

## API

### Props

```typescript
interface WorldCreationWizardProps {
  onComplete?: (worldId: string) => void;
  onCancel?: () => void;
}
```

### World Data Structure

```typescript
interface WizardState {
  currentStep: number;
  worldData: Partial<World>;
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  errors: Record<string, string>;
  isProcessing: boolean;
}
```

### Suggestion Types

```typescript
interface AttributeSuggestion {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  category?: string;
  accepted: boolean;
}

interface SkillSuggestion {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  linkedAttributeNames?: string[];
  accepted: boolean;
}
```

## Usage Example

```tsx
// Basic usage
<WorldCreationWizard />

// With callbacks
<WorldCreationWizard 
  onComplete={(worldId) => {
    console.log('Created world:', worldId);
    router.push(`/worlds/${worldId}`);
  }}
  onCancel={() => {
    console.log('Creation cancelled');
    router.push('/worlds');
  }}
/>
```

## Testing

Test coverage:

### Unit Tests
- Each step component has dedicated tests
- Validation logic is thoroughly tested
- Error states are covered

### Integration Tests
- Full wizard flow testing
- AI integration with fallback
- State persistence between steps
- Navigation behavior

### Storybook
- Visual testing for each step
- Error state demonstrations
- Mobile responsive views

## Performance Considerations

1. **AI Analysis** - Async operation with loading states
2. **State Updates** - Optimized with React hooks
3. **Validation** - Immediate feedback without blocking

## Accessibility

- Proper ARIA attributes on form fields
- Keyboard navigation support
- Error messages linked to fields
- Focus management between steps

## Future Enhancements

1. **Import/Export** - Save and load world configurations
2. **Preview Mode** - Live preview of world settings
3. **Collaborative Creation** - Multi-user world building
4. **Advanced AI Options** - Custom prompts for suggestions

## Related Documentation

- [World Management](../features/world-management.md)
- [World Types](../../src/types/world.types.ts)
- [AI World Analyzer](../../src/lib/ai/worldAnalyzer.ts)
- [World Store](../../src/state/worldStore.ts)
