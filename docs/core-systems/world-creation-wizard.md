# World Creation Wizard Documentation

## Overview

The World Creation Wizard is a multi-step React component that guides users through the process of creating a new game world in the Narraitor RPG system. It features AI-powered analysis of world descriptions to suggest appropriate attributes and skills.

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

When users provide a detailed world description, the wizard:
1. Sends the description to the AI analyzer
2. Receives suggested attributes and skills
3. Presents suggestions for user review
4. Falls back to defaults if AI fails

### Validation

Each step includes appropriate validation:
- Name: 3+ characters required
- Description: 10+ characters (basic), 50-3000 characters (detailed)
- Attributes: 1-6 must be selected
- Skills: 1-12 must be selected

### Error Handling

- Form validation errors display inline
- AI failures gracefully fallback to defaults
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
  linkedAttributeName?: string;
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

The wizard includes comprehensive test coverage:

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

1. **Template Worlds** - Pre-configured world templates
2. **Import/Export** - Save and load world configurations
3. **Preview Mode** - Live preview of world settings
4. **Collaborative Creation** - Multi-user world building
5. **Advanced AI Options** - Custom prompts for suggestions

## Related Documentation

- [World Creation Flow](/docs/flows/world-creation-flow.md)
- [World Types](/src/types/world.types.ts)
- [AI World Analyzer](/src/lib/ai/worldAnalyzer.ts)
- [World Store](/src/state/worldStore.ts)
