# World Creation Wizard

A multi-step wizard component for creating game worlds in the Narraitor RPG framework. The wizard guides users through world creation including basic information, detailed descriptions, AI-assisted attribute and skill suggestions, and final confirmation.

## Features

- **Multi-step navigation** with progress tracking
- **Form validation** at each step
- **AI-powered analysis** of world descriptions to suggest appropriate attributes and skills
- **Fallback handling** for AI service failures
- **State persistence** between wizard steps
- **Responsive design** for various screen sizes

## Usage

```tsx
import WorldCreationWizard from '@/components/WorldCreationWizard';

// Basic usage
<WorldCreationWizard />

// With callbacks
<WorldCreationWizard 
  onComplete={(worldId) => console.log('Created world:', worldId)}
  onCancel={() => console.log('Creation cancelled')}
/>
```

## Steps

1. **Basic Information** - Name, brief description, and genre selection
2. **World Description** - Detailed description for AI analysis
3. **Attribute Review** - Review and customize AI-suggested attributes
4. **Skill Review** - Review and customize AI-suggested skills  
5. **Finalize** - Review all settings and create the world

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onComplete` | `(worldId: string) => void` | Optional callback when world creation completes |
| `onCancel` | `() => void` | Optional callback when user cancels the wizard |

## Implementation Details

The wizard maintains its own internal state using React hooks and integrates with:
- `worldStore` for persisting created worlds
- `worldAnalyzer` for AI-powered description analysis
- Next.js router for navigation

### State Management

The wizard uses the `WizardState` interface to track:
- Current step
- World data being created
- AI suggestions for attributes and skills
- Validation errors
- Processing state for async operations

### Validation

Each step includes validation:
- **Basic Info**: Name (3+ chars) and description (10+ chars) required
- **Description**: Detailed description (50-3000 chars) required
- **Attributes**: Max 6 attributes can be selected
- **Skills**: Max 12 skills can be selected

### Error Handling

- Form validation errors display inline
- AI failures gracefully fallback to default suggestions
- Network errors are caught and displayed to users

## Testing

The wizard includes comprehensive test coverage:
- Unit tests for each step component
- Integration tests for the full wizard flow
- Storybook stories for visual testing
- Test utilities in `worldCreationWizard.test-helpers.ts`

### Running Tests

```bash
# Run all wizard tests
npm test src/components/WorldCreationWizard

# Run Storybook
npm run storybook
```

## File Structure

```
src/components/WorldCreationWizard/
├── WorldCreationWizard.tsx          # Main wizard component
├── WorldCreationWizard.stories.tsx  # Storybook stories
├── index.ts                         # Module exports
├── steps/
│   ├── BasicInfoStep.tsx           # Step 1: Basic information
│   ├── DescriptionStep.tsx         # Step 2: Detailed description
│   ├── AttributeReviewStep.tsx     # Step 3: Attribute selection
│   ├── SkillReviewStep.tsx         # Step 4: Skill selection  
│   └── FinalizeStep.tsx            # Step 5: Final review
└── __tests__/
    ├── WorldCreationWizard.test.tsx
    ├── integration.test.tsx
    └── *.test.tsx                  # Other test files
```

## Dependencies

- React 19+
- Next.js 15+
- TypeScript 5+
- @/state/worldStore
- @/lib/ai/worldAnalyzer
- @/types/world.types

## Future Enhancements

- Add template worlds for quick setup
- Implement world preview during creation
- Add import/export functionality
- Support for custom themes beyond genre selection
- Collaborative world building features
