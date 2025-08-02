# QuickStart Integration Guide

Complete guide for integrating the QuickStart character selection system into the WorldCreationWizard workflow.

## Integration Overview

The QuickStart system adds a final step to the world creation process, allowing users to immediately begin playing with pre-generated character archetypes or create custom characters.

## WorldCreationWizard Integration

### Step Configuration

```tsx
// In WorldCreationWizard.tsx
import { QuickStartStep } from './steps/QuickStartStep';

const WIZARD_STEPS = [
  {
    title: 'Basic Info',
    description: 'Name and describe your world',
    component: BasicInfoStep,
    validation: (wizard) => wizard.validateBasicInfo()
  },
  {
    title: 'World Type', 
    description: 'Choose your world\'s theme and genre',
    component: WorldTypeStep,
    validation: (wizard) => wizard.validateWorldType()
  },
  {
    title: 'Attributes',
    description: 'Define character attributes for your world',
    component: AttributesStep,
    validation: (wizard) => wizard.validateAttributes()
  },
  {
    title: 'Skills',
    description: 'Create skills that characters can learn',
    component: SkillsStep,
    validation: (wizard) => wizard.validateSkills()
  },
  {
    title: 'Review',
    description: 'Review and finalize your world settings',
    component: ReviewStep,
    validation: (wizard) => wizard.validateReview()
  },
  // NEW: QuickStart integration as final step
  {
    title: 'Quick Start Characters',
    description: 'Choose a character to begin your adventure',
    component: QuickStartStep,
    validation: () => true // Always valid: selection is optional
  }
];
```

### Navigation Logic Updates

```tsx
// Updated navigation to handle QuickStart step
const isLastStep = currentStep === WIZARD_STEPS.length - 1;
const isQuickStartStep = currentStep === WIZARD_STEPS.length - 1;

// Hide navigation on QuickStart step (users choose their own path)
const showNavigation = currentStep > 0 && currentStep < WIZARD_STEPS.length - 1;

return (
  <div className="max-w-7xl mx-auto p-6">
    {/* Step indicator: exclude QuickStart from progress */}
    <StepIndicator 
      steps={WIZARD_STEPS.slice(0, -1)} // Exclude QuickStart
      currentStep={Math.min(currentStep, WIZARD_STEPS.length - 2)}
    />
    
    {/* Render current step */}
    <CurrentStepComponent 
      wizard={wizard}
      onNext={handleNext}
      onBack={handleBack}
    />
    
    {/* Navigation: hidden on QuickStart step */}
    {showNavigation && (
      <WizardNavigation 
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceed}
        isLastStep={isLastStep}
      />
    )}
  </div>
);
```

## QuickStartStep Component

### Component Implementation

```tsx
// src/components/WorldCreationWizard/steps/QuickStartStep.tsx
import React, { useMemo } from 'react';
import { QuickStartCharacters } from '@/components/QuickStartCharacters/QuickStartCharacters';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useRouter } from 'next/navigation';

interface QuickStartStepProps {
  wizard: WorldCreationWizardData;
  onNext: () => void;
  onBack: () => void;
}

export function QuickStartStep({ wizard, onNext, onBack }: QuickStartStepProps) {
  const router = useRouter();
  const { createCharacter } = useCharacterStore();
  const { createSession } = useSessionStore();
  
  // Get existing character names to avoid duplicates
  const existingCharacterNames = useMemo(() => {
    const characters = useCharacterStore.getState().characters;
    return Object.values(characters)
      .filter(char => char.worldId === wizard.world.id)
      .map(char => char.name);
  }, [wizard.world.id]);
  
  const handleCharacterSelect = (archetype) => {
    // Create character from archetype
    const characterId = createCharacter({
      ...archetype,
      worldId: wizard.world.id
    });
    
    // Create game session
    const sessionId = createSession({
      worldId: wizard.world.id,
      characterId,
      type: 'adventure'
    });
    
    // Navigate to game session
    router.push(`/game/${sessionId}`);
  };
  
  const handleCustomizeClick = () => {
    // Navigate to character creation with world context
    router.push(`/character/create?worldId=${wizard.world.id}`);
  };
  
  return (
    <QuickStartCharacters
      world={wizard.world}
      onCharacterSelect={handleCharacterSelect}
      onCustomizeClick={handleCustomizeClick}
      existingCharacterNames={existingCharacterNames}
    />
  );
}
```

### World Creation Flow

```tsx
// Complete world creation flow with QuickStart
const handleCreateWorld = async () => {
  try {
    // 1. Create world in store
    const worldId = worldStore.createWorld(wizard.worldData);
    
    // 2. Set as current world
    worldStore.setCurrentWorld(worldId);
    
    // 3. Navigate to QuickStart step
    setCurrentStep(WIZARD_STEPS.length - 1);
    
    console.log('World created successfully, showing QuickStart options');
  } catch (error) {
    console.error('Failed to create world:', error);
    setError('Failed to create world. Please try again.');
  }
};
```

## User Flow Scenarios

### Scenario 1: Select Pre-generated Character

```
User Journey:
1. Complete world creation wizard (steps 1-5)
2. World is created and stored
3. QuickStart step displays 3 genre-appropriate archetypes
4. User clicks "Select Character" on preferred archetype
5. Character is created from archetype
6. Game session is initiated
7. User is navigated to `/game/{sessionId}`

Technical Flow:
wizard.createWorld() → QuickStartStep → QuickStartCharacters → 
archetype selection → createCharacter() → createSession() → 
router.push('/game/{sessionId}')
```

### Scenario 2: Generate Random Character

```
User Journey:  
1. Reach QuickStart step
2. User clicks "Generate New Random Character"
3. New random archetype is generated
4. Character is created automatically
5. Game session starts immediately

Technical Flow:
QuickStartCharacters → generateRandomArchetype() → 
createCharacter() → createSession() → router.push('/game/{sessionId}')
```

### Scenario 3: Create Custom Character

```
User Journey:
1. Reach QuickStart step
2. User clicks "Create Custom Character"  
3. Navigate to character creation wizard
4. User builds character manually
5. Return to world with custom character

Technical Flow:
QuickStartCharacters → router.push('/character/create?worldId={id}') →
CharacterCreationWizard → createCharacter() → 
return to world view
```

### Scenario 4: Skip Character Creation

```
User Journey:
1. Reach QuickStart step
2. User wants to explore world first
3. User can navigate away or go back
4. World is saved and available in world list

Technical Flow:
QuickStartStep → user navigation → world remains in worldStore →
accessible via /worlds page
```

## State Management Integration

### World Store Integration

```tsx
// World is created before QuickStart step
const worldId = worldStore.createWorld({
  name: wizard.name,
  description: wizard.description,
  genre: wizard.genre,
  attributes: wizard.attributes,
  skills: wizard.skills,
  settings: wizard.settings
});

// Set as current world for immediate use
worldStore.setCurrentWorld(worldId);
```

### Character Store Integration

```tsx
// Create character from selected archetype
const characterId = characterStore.createCharacter({
  name: archetype.name,
  description: archetype.description,
  level: 1,
  worldId: wizard.world.id,
  attributes: archetype.attributes,
  skills: archetype.skills,
  background: archetype.background
});
```

### Session Store Integration

```tsx
// Initialize game session
const sessionId = sessionStore.createSession({
  worldId: wizard.world.id,
  characterId: characterId,
  type: 'adventure',
  status: 'active',
  createdAt: new Date().toISOString()
});
```

## Error Handling

### World Creation Failures

```tsx
// Handle world creation errors gracefully
try {
  const worldId = await worldStore.createWorld(wizard.worldData);
  setCurrentStep(WIZARD_STEPS.length - 1);
} catch (error) {
  setError('Failed to create world. Please check your settings and try again.');
  // Stay on current step for user to retry
}
```

### Archetype Generation Failures

```tsx
// QuickStartCharacters handles its own errors
// Shows ErrorDisplay with retry functionality
// Fallback to generic archetypes if needed
```

### Navigation Failures

```tsx
// Handle navigation errors
const handleCharacterSelect = async (archetype) => {
  try {
    const characterId = createCharacter(archetype);
    const sessionId = createSession({ worldId, characterId });
    router.push(`/game/${sessionId}`);
  } catch (error) {
    console.error('Failed to start game session:', error);
    // Show error toast or inline error
    setError('Failed to start game. Please try again.');
  }
};
```

## Testing Integration

### Unit Tests

```tsx
// Test QuickStartStep component
describe('QuickStartStep', () => {
  test('creates character and session on archetype selection', () => {
    // Mock stores and router
    // Render QuickStartStep with test wizard data
    // Simulate archetype selection
    // Verify character creation, session creation, and navigation
  });
  
  test('navigates to character creation on customize click', () => {
    // Test custom character flow
  });
});
```

### Integration Tests

```tsx
// Test complete wizard flow
describe('WorldCreationWizard with QuickStart', () => {
  test('completes full workflow from world creation to game start', () => {
    // Simulate complete wizard progression
    // Verify world creation
    // Verify QuickStart step appears
    // Verify character selection works
    // Verify navigation to game session
  });
});
```

### E2E Tests

```bash
# Test complete user journey
npm run test:e2e -- --spec "world-creation-quickstart"
```

## Performance Considerations

### Lazy Loading

```tsx
// QuickStart step only loads when reached
const QuickStartStep = lazy(() => import('./steps/QuickStartStep'));

// Preload character archetypes for smooth experience
useEffect(() => {
  if (currentStep === WIZARD_STEPS.length - 2) {
    // Preload archetypes for next step
    preloadCharacterArchetypes(wizard.world);
  }
}, [currentStep]);
```

### Memory Management

```tsx
// Clean up wizard state after completion
useEffect(() => {
  return () => {
    if (isComplete) {
      wizard.cleanup();
    }
  };
}, [isComplete]);
```

## Accessibility

- **Skip Options**: Users can navigate away without selecting character
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus progression through options

## Related Documentation

- [QuickStartCharacters Component](../QuickStartCharacters/README.md)
- [Character Archetypes Utility](../../lib/utils/README-characterArchetypes.md)
- [WorldCreationWizard Overview](./README.md)
- [Character Store Documentation](../../state/README-characterStore.md)