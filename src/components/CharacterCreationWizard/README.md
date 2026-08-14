# Character Creation Wizard

This wizard handles character creation with point allocation, skill selection, and background building. The challenge was balancing flexibility with guidance: giving users enough options without overwhelming them.

## What It Does

**Guided 4-step process**: basic info, then attribute allocation, then skill selection, then background creation. Each step builds on your world's specific rules and constraints.

**Validation**: Prevents duplicate names, enforces point pool limits, provides real-time feedback. You can't accidentally create invalid characters.

**Adaptive to world rules**: Uses your world's custom attributes and skills. Creating a character for a Star Wars world feels different from a Lovecraft horror setting.

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
- Unspent points are allowed
- Cannot exceed point pool
- Respects min/max attribute values

### Skills
- Must select between 1 and the world max
- Unspent points are allowed
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
- [ ] Import/export functionality
