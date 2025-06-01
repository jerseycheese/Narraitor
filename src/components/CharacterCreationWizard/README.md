# Character Creation Wizard

A multi-step wizard for creating player characters with attribute allocation, skill selection, and background creation.

## Features

- **4-Step Process**:
  1. Basic Information (name, description, portrait)
  2. Attributes (point allocation with constraints)
  3. Skills (selection based on world limits)
  4. Background (history, personality, goals)

- **Smart Validation**:
  - Name uniqueness checking
  - Minimum character counts for descriptions
  - Point pool constraints
  - Real-time validation feedback

- **Visual Features**:
  - Dynamic portrait placeholder with initials
  - Progress tracking
  - Responsive design
  - Consistent styling with WorldCreationWizard

## Usage

```typescript
import CharacterCreationWizard from '@/components/CharacterCreationWizard';

// In your page/component
<CharacterCreationWizard worldId={worldId} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| worldId | string | Yes | ID of the world for this character |

## Architecture

The wizard uses the shared wizard component system:

```
CharacterCreationWizard/
├── CharacterCreationWizard.tsx    # Main wizard component
├── components/
│   └── CharacterPortraitPlaceholder.tsx
├── steps/
│   ├── BasicInfoStep.tsx         # Name & description
│   ├── AttributesStep.tsx        # Point allocation
│   ├── SkillsStep.tsx           # Skill selection
│   └── BackgroundStep.tsx       # Background info
├── utils/
│   └── validation.ts            # Validation logic
└── types.ts                     # TypeScript definitions
```

## State Management

- Uses `characterStore` for character persistence
- Session storage for auto-save functionality
- Integrates with `worldStore` for world configuration

## Validation Rules

### Basic Info
- Name: 3-50 characters, unique within world
- Description: Minimum 50 characters

### Attributes
- Must allocate all available points
- Cannot exceed point pool
- Respects min/max attribute values

### Skills
- Must select exact number required by world
- All skills start at level 1

### Background
- History: Minimum 100 characters
- Personality: Minimum 50 characters

## Testing

```bash
# Run tests
npm test src/components/CharacterCreationWizard

# View in Storybook
npm run storybook
# Navigate to Narraitor/Character section
```

## Integration Points

- **World Store**: Fetches world configuration
- **Character Store**: Saves created characters
- **Router**: Navigates to character detail after creation
- **Shared Wizard System**: Reuses common components

## Customization

The wizard appearance can be customized through:
- Shared `wizardStyles` configuration
- Component className props
- Theme overrides in global CSS

## Future Enhancements

- [ ] Character portrait upload
- [ ] AI-suggested backgrounds
- [ ] Skill prerequisites
- [ ] Character templates/archetypes
- [ ] Import/export functionality