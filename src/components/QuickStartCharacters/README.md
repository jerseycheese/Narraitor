# QuickStartCharacters Component

This handles getting players into the game fast when they don't want to go through full character creation. The challenge was balancing speed with meaningful choice - giving people options without overwhelming them.

## How It Works

**Smart archetype generation** - Creates three character options that actually fit your world. So if you're in a cyberpunk setting, you get hackers and corpo agents, not medieval knights.

**One-click play** - Pick a character and you're immediately in the game. No stat allocation, no lengthy backstory writing, just choose and go.

## Basic Usage

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

## What You Get

**Genre-appropriate archetypes** - Three characters that make sense for your world. Fantasy gets warriors, mages, and scouts. Sci-fi gets pilots, engineers, and medics. It reads your world settings and generates accordingly.

**Instant selection** - Click a character card and you're playing. Visual feedback shows your selection clearly.

**Random refresh** - Don't like the options? Hit the random button to generate three completely new archetypes.

**Full customization escape hatch** - Want more control? The "Customize Character" option takes you to the full creation wizard.

**Robust error handling** - If AI generation fails, you get clear error messages and retry options. The system doesn't leave you stuck.

**Smooth loading** - Elegant animations while the AI is generating your archetypes, so you know something's happening.

## Genre Examples

The system generates different archetype sets based on your world's theme:

**Fantasy worlds** - You'll get classic archetypes like the protective Warrior (high strength, combat skills), the knowledge-seeking Mage (intelligence, magic skills), and the independent Scout (balanced attributes, observant personality).

**Sci-fi settings** - Expect spacefaring archetypes: the adventurous Pilot (agility, technical skills), the problem-solving Engineer (intelligence, technology skills), and the caring Medic (empathy, medical skills).

**Modern scenarios** - Get contemporary archetypes like the analytical Detective (perception, investigation), the competitive Athlete (strength, physical skills), and the academic Scholar (intelligence, research).

**Custom or unusual themes** - When the system encounters something unique, it falls back to versatile archetypes: Balanced (even stats, adaptable), Specialist (focused expertise), and Versatile (moderate skills across areas).

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

## Implementation Notes

### Error Handling
The component includes robust error handling for AI generation failures:
- Automatic retry with exponential backoff for transient errors
- JSON parsing repair for malformed AI responses
- Fallback to genre-appropriate default archetypes when generation fails
- User-friendly error messages with retry functionality

### URL Parameter Integration
When used in character creation flow:
- Automatically extracts worldId from URL parameters
- Synchronizes with world store state
- Handles navigation between QuickStart and custom character creation