# QuickStartCharacters Component

A comprehensive quick start character selection system that allows players to begin playing immediately after world creation with pre-generated character archetypes.

## Usage

The QuickStartCharacters component provides an intuitive interface for selecting pre-generated character archetypes or creating custom characters:

```tsx
import { QuickStartCharacters } from '@/components/QuickStartCharacters/QuickStartCharacters';
import { CharacterArchetype } from '@/lib/utils/characterArchetypes';

function GameStart({ world }) {
  const handleCharacterSelect = (archetype: CharacterArchetype) => {
    // Create character from archetype and start game session
    const characterId = createCharacterFromArchetype(archetype, world.id);
    navigateToGameSession(world.id, characterId);
  };

  const handleCustomizeClick = () => {
    // Navigate to character creation wizard
    navigateToCharacterCreation(world.id);
  };

  return (
    <QuickStartCharacters
      world={world}
      onCharacterSelect={handleCharacterSelect}
      onCustomizeClick={handleCustomizeClick}
      existingCharacterNames={['Aelric', 'Lyra']} // Optional: prevent duplicate names
    />
  );
}
```

## Key Features

- **Genre-Specific Archetypes**: Automatically generates 3 archetypes tailored to the world's genre
- **One-Click Selection**: Immediate character selection with smooth visual feedback
- **Random Generation**: Generate completely new random characters on demand
- **Custom Character Option**: Seamless transition to full character creation
- **Error Handling**: Comprehensive error states with retry functionality
- **Loading States**: Elegant loading animations during archetype generation

## Supported Genres

### Fantasy Archetypes
- **Warrior**: High strength and combat skills, protective personality
- **Mage**: High intelligence and magic skills, knowledge-seeking personality  
- **Scout**: Balanced attributes, independent and observant personality

### Sci-fi Archetypes
- **Pilot**: High agility and technical skills, adventurous personality
- **Engineer**: High intelligence and technology skills, problem-solving personality
- **Medic**: High empathy and medical skills, caring personality

### Modern Archetypes
- **Detective**: High perception and investigation skills, analytical personality
- **Athlete**: High strength and physical skills, competitive personality
- **Scholar**: High intelligence and research skills, academic personality

### Generic Archetypes (Fallback)
- **Balanced**: Even attribute distribution, adaptable personality
- **Specialist**: High focus in one area, dedicated personality
- **Versatile**: Moderate skills across multiple areas, flexible personality

## Props

- `world`: **World** (required) - The world object containing genre, attributes, skills, and settings
- `onCharacterSelect`: **(archetype: CharacterArchetype) => void** (required) - Callback when a character archetype is selected
- `onCustomizeClick`: **() => void** (required) - Callback when the customize character option is chosen
- `existingCharacterNames`: **string[]** (optional) - Array of existing character names to avoid duplicates

## Integration with WorldCreationWizard

The component integrates as the final step in the world creation wizard:

```tsx
// In WorldCreationWizard.tsx
import { QuickStartStep } from './steps/QuickStartStep';

const WIZARD_STEPS = [
  // ... other steps
  {
    title: 'Quick Start Characters',
    description: 'Choose a character to begin your adventure',
    component: QuickStartStep,
    validation: () => true // Always valid, selection is optional
  }
];
```

## Error Handling Scenarios

### Network/Generation Failures
```tsx
// Component automatically handles generation failures
<QuickStartCharacters
  world={world}
  onCharacterSelect={handleSelect}
  onCustomizeClick={handleCustomize}
  // Shows ErrorDisplay with retry button on failure
/>
```

### Invalid World Data
```tsx
// Component validates world data and shows appropriate errors
const incompleteWorld = { id: '1', name: 'Test' }; // Missing required fields
// Will display: "Unable to generate character options for this world"
```

### Empty Archetype Generation
```tsx
// If no archetypes can be generated for the genre
// Component falls back to generic archetypes automatically
```

## Performance Optimizations

- **React.memo**: Component is memoized to prevent unnecessary re-renders
- **Automatic Retry**: Built-in retry logic for transient failures
- **Debounced Actions**: Selection actions are debounced to prevent double-clicks
- **Lazy Loading**: Archetype generation only occurs when component mounts

## Accessibility Features

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support for character selection
- **Screen Reader Support**: Descriptive text for all character information
- **Focus Management**: Proper focus handling during loading and error states
- **High Contrast**: Supports high contrast themes and color schemes

## Testing

### Unit Tests
```bash
npm test src/components/QuickStartCharacters/__tests__/QuickStartCharacters.test.tsx
```

### Storybook Stories
```bash
npm run storybook
# Navigate to Narraitor/Components/QuickStartCharacters
```

### Integration Testing
```bash
# Test in development environment
npm run dev
# Navigate to /world/create and complete wizard to reach QuickStart step
```

## Common Use Cases

### World Creation Wizard Integration
```tsx
// Integrate as final step in world creation
<QuickStartStep
  world={createdWorld}
  onComplete={handleWorldCreationComplete}
  onCharacterSelect={startGameSession}
  onCustomizeClick={navigateToCharacterCreation}
/>
```

### Standalone Character Selection
```tsx
// Use independently for character selection
<QuickStartCharacters
  world={existingWorld}
  onCharacterSelect={createAndStartGame}
  onCustomizeClick={openCharacterCreator}
  existingCharacterNames={worldCharacters.map(c => c.name)}
/>
```

### Custom Genre Support
```tsx
// Component automatically adapts to any world genre
const customWorld = {
  id: '1',
  name: 'Steampunk London',
  genre: 'steampunk', // Will generate appropriate archetypes
  attributes: [...],
  skills: [...]
};
```

## Related Components

- **QuickStartStep**: Wizard step wrapper for world creation flow
- **ActiveStateCard**: Used for archetype selection cards
- **ActionButtonGroup**: Used for random generation and customize buttons
- **ErrorDisplay**: Used for error states and retry functionality
- **LoadingSkeleton**: Used for loading states during generation

## Dependencies

- **characterArchetypes**: Core utility for generating genre-specific archetypes
- **Badge**: UI component for displaying character attributes and skills
- **Button**: UI component for actions and selection
- **Card**: UI components for character archetype layout

## Related Documentation

- [QuickStart Character Integration Fix](../../../docs/fixes/quickstart-character-integration-fix.md) - Comprehensive implementation details and troubleshooting
- [AI Response Parser Improvements](../../../docs/fixes/ai-response-parser-improvements.md) - Error handling for character generation