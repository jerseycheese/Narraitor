# World Creation Wizard

This is the multi-step wizard that guides users through creating custom worlds. The main challenge was making world creation approachable for users who just want to start playing, while still allowing deep customization for those who want it.

## Key Features

**AI-assisted suggestions** - Describe your world and the AI suggests appropriate attributes and skills. Want "Force Sensitivity" for Star Wars? "Sanity" for Lovecraft? The AI understands genre conventions.

**Progressive disclosure** - Start simple with basic info, then dive deeper into attributes and skills. Each step builds on the previous one.

**Fallback handling** - If the AI service fails, you can still create worlds manually. The wizard doesn't break.

**State persistence** - Move between steps without losing your work. All data stays intact until you finish or cancel.

## Usage

```tsx
import WorldCreationWizard from './WorldCreationWizard';

// Basic usage
<WorldCreationWizard />

// With callbacks
<WorldCreationWizard 
  onComplete={(worldId) => console.log('Created world:', worldId)}
  onCancel={() => console.log('Creation cancelled')}
/>
```

## How the Wizard Works

The wizard walks you through 5 steps:

1. **Basic Information** - Name, brief description, and genre selection
2. **World Description** - Detailed description for AI analysis
3. **Attribute Review** - Review and customize AI-suggested attributes
4. **Skill Review** - Review and customize AI-suggested skills, add custom skills with multi-attribute linking
5. **Finalize** - Review all settings and create the world

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onComplete` | `(worldId: string) => void` | Optional callback when world creation completes |
| `onCancel` | `() => void` | Optional callback when user cancels the wizard |

## Implementation Details

The wizard maintains its own internal state using React hooks and integrates with a few key systems:
- `worldStore` for persisting created worlds
- `worldAnalyzer` for AI-powered description analysis
- Next.js router for navigation

### State Management

The wizard uses the `WizardState` interface to track:
- Current step
- World data being created
- AI suggestions for attributes and skills
- Custom skills created by the user
- Validation errors
- Processing state for async operations

### Validation

Each step includes validation:
- **Basic Info**: Name (3+ chars) and description (10+ chars) required
- **Description**: Detailed description (50-3000 chars) required
- **Attributes**: Max 6 attributes can be selected
- **Skills**: Max 12 skills can be selected (includes both AI suggestions and custom skills)

### Error Handling

The wizard handles errors without losing your progress:
- Form validation errors display inline
- AI failures fall back to default suggestions
- Network errors are caught and displayed to users

## Testing

The wizard includes test coverage:
- Unit tests for each step component
- Integration tests for the full wizard flow
- Storybook stories for visual testing

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
