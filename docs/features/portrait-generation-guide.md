---
title: Portrait Generation Guide
tags: [portrait, character, ai, integration]
created: 2025-06-26
updated: 2025-06-26
---

# Portrait Generation Guide

Generate AI-powered character portraits integrated with the narrative system.

## Quick Start

Basic portrait generation in a component:

```tsx
import { CharacterPortrait } from '@/components/CharacterPortrait';

<CharacterPortrait
  character={character}
  world={world}
  onPortraitGenerated={(portrait) => {
    console.log('Portrait generated:', portrait);
  }}
/>
```

## API Integration

### Generate Portrait
```typescript
// Use secure server-side API
const generatePortrait = async (character: Character, world: World) => {
  const response = await fetch('/api/generate-portrait', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character, world })
  });

  if (!response.ok) {
    throw new Error('Portrait generation failed');
  }

  return response.json();
};
```

### Portrait Types
```typescript
interface Portrait {
  type: 'ai-generated' | 'placeholder' | 'custom';
  url?: string;
  description?: string;
  style?: 'realistic' | 'artistic' | 'cartoon';
}
```

## Character Creation Integration

### Auto-Generate During Creation
```tsx
import { useCharacterStore } from '@/state/characterStore';

const CharacterCreationWizard = () => {
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const { createCharacter } = useCharacterStore();

  const handleSubmit = async (characterData) => {
    setGeneratingPortrait(true);
    
    try {
      // Create character first
      const character = createCharacter(characterData);
      
      // Generate portrait
      const portrait = await generatePortrait(character, world);
      
      // Update character with portrait
      updateCharacter(character.id, { portrait });
      
    } catch (error) {
      console.error('Portrait generation failed:', error);
      // Character still created, just without portrait
    } finally {
      setGeneratingPortrait(false);
    }
  };

  return (
    <div>
      {/* Character creation form */}
      <CharacterForm onSubmit={handleSubmit} />
      
      {generatingPortrait && (
        <div>Generating portrait...</div>
      )}
    </div>
  );
};
```

## Display Components

### Portrait Display
```tsx
const PortraitDisplay = ({ character }: { character: Character }) => {
  if (!character.portrait) {
    return <div className="placeholder-portrait">No portrait</div>;
  }

  return (
    <img
      src={character.portrait.url}
      alt={character.portrait.description || character.name}
      className="character-portrait"
    />
  );
};
```

### Portrait with Fallback
```tsx
const PortraitWithFallback = ({ character }: { character: Character }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError || !character.portrait?.url) {
    return (
      <div className="portrait-fallback">
        <div className="initials">
          {character.name.substring(0, 2).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <img
      src={character.portrait.url}
      alt={character.name}
      onError={() => setImageError(true)}
      className="character-portrait"
    />
  );
};
```

## Batch Generation

### Generate Multiple Portraits
```tsx
const generateMultiplePortraits = async (characters: Character[], world: World) => {
  const results = await Promise.allSettled(
    characters.map(character => generatePortrait(character, world))
  );

  const portraits = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { character: characters[index], portrait: result.value };
    } else {
      console.error(`Portrait generation failed for ${characters[index].name}`);
      return { character: characters[index], portrait: null };
    }
  });

  return portraits;
};
```

## Error Handling

### Common Error Scenarios
```tsx
const handlePortraitGeneration = async (character: Character, world: World) => {
  try {
    return await generatePortrait(character, world);
  } catch (error) {
    if (error.message.includes('rate_limit')) {
      throw new Error('Too many portrait requests. Please wait and try again.');
    }
    
    if (error.message.includes('invalid_character')) {
      throw new Error('Character data is incomplete. Please check required fields.');
    }
    
    throw new Error('Portrait generation failed. Please try again later.');
  }
};
```

### Graceful Degradation
```tsx
const PortraitSection = ({ character }: { character: Character }) => {
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNew = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newPortrait = await generatePortrait(character, world);
      setPortrait(newPortrait);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Generating portrait...</div>;
  if (error) return <div>Error: {error} <button onClick={generateNew}>Retry</button></div>;
  if (!portrait) return <div>No portrait <button onClick={generateNew}>Generate</button></div>;

  return <PortraitDisplay portrait={portrait} />;
};
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache generated portraits
const portraitCache = new Map<string, Portrait>();

const getCachedPortrait = (characterId: string): Portrait | null => {
  return portraitCache.get(characterId) || null;
};

const cachePortrait = (characterId: string, portrait: Portrait) => {
  portraitCache.set(characterId, portrait);
};
```

### Lazy Loading
```tsx
const LazyPortrait = ({ character }: { character: Character }) => {
  const [visible, setVisible] = useState(false);
  const [portrait, setPortrait] = useState<Portrait | null>(null);

  useEffect(() => {
    if (visible && !portrait) {
      generatePortrait(character, world).then(setPortrait);
    }
  }, [visible, portrait]);

  return (
    <div
      ref={(el) => {
        if (el) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setVisible(true);
          });
          observer.observe(el);
        }
      }}
    >
      {portrait ? <PortraitDisplay portrait={portrait} /> : <PortraitPlaceholder />}
    </div>
  );
};
```

## Testing

### Mock Portrait Generation
```typescript
// For testing
const mockPortrait: Portrait = {
  type: 'ai-generated',
  url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+',
  description: 'Test portrait',
  style: 'realistic'
};

const generatePortrait = jest.fn().mockResolvedValue(mockPortrait);
```

### Component Testing
```tsx
test('displays portrait when available', () => {
  const character = { ...mockCharacter, portrait: mockPortrait };
  
  render(<PortraitDisplay character={character} />);
  
  expect(screen.getByRole('img')).toBeInTheDocument();
  expect(screen.getByAltText(character.name)).toBeInTheDocument();
});

test('shows fallback when portrait fails to load', async () => {
  const character = { ...mockCharacter, portrait: { url: 'invalid-url' } };
  
  render(<PortraitWithFallback character={character} />);
  
  const img = screen.getByRole('img');
  fireEvent.error(img);
  
  expect(screen.getByText(character.name.substring(0, 2))).toBeInTheDocument();
});
```

## Configuration

### Portrait Generation Settings
```typescript
interface PortraitConfig {
  style: 'realistic' | 'artistic' | 'cartoon';
  size: 'small' | 'medium' | 'large';
  quality: 'low' | 'medium' | 'high';
  enableCaching: boolean;
  maxRetries: number;
}
```

## Related
- `/components/CharacterPortrait/`
- `/api/generate-portrait`
- `/types/character.types`
- Character Creation Wizard integration