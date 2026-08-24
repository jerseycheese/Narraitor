---
title: Portrait Generation Guide
tags: [portrait, character, ai, integration]
created: 2025-06-26
updated: 2026-07-21
---

# Portrait Generation Guide

This system generates character portraits from the character's own description and the setting of the world they live in.

The challenge was making this work with character creation while handling AI image generation issues - rate limits, failed generations, inappropriate content.

## Getting Started

The simplest way to add portrait generation to any component:

```tsx
import { CharacterPortrait } from '@/components/CharacterPortrait';

<CharacterPortrait
  portrait={character.portrait}
  characterName={character.name}
  size="large"
  isGenerating={isGenerating}
  error={error}
/>
```

`CharacterPortrait` is a display component, not a generator. It handles loading state, the error
case, and the placeholder fallback, but generating the image is a separate call - see
`generatePortrait` below, or the `usePortraitGeneration` hook, which wires the two together.

## How the AI Generates a Portrait

### Generating Portraits
The API call is straightforward, but there's a lot happening behind the scenes:

```typescript
import { generatePortrait } from '@/lib/api/generatePortrait';

// Goes through a server-side route. aiFetch attaches the player's own key as a
// request header, so the browser never calls Google directly.
const { portrait } = await generatePortrait({ character, world });
```

The system takes your character description and world context, feeds it to the AI image generation service, and returns a portrait that actually fits your character. No generic fantasy warrior #47 - this is your specific character.

### Portrait Types
Portraits use the shared `GeneratedImage` type from `src/types/common.types.ts`. There's no
separate `Portrait` interface, no style field, and no custom-upload type - a portrait is either
generated or a placeholder.

```typescript
interface GeneratedImage {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}
```

## Smart Character Creation Integration

### How It Works During Character Creation
The portrait system hooks into character creation - no extra steps required:

```tsx
import { useCharacterStore } from '@/state/characterStore';

const CharacterCreationWizard = () => {
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const { createCharacter } = useCharacterStore();

  const handleSubmit = async (characterData) => {
    setGeneratingPortrait(true);
    
    try {
      // Create the character first
      const character = createCharacter(characterData);
      
      // Then generate the portrait based on their description
      const portrait = await generatePortrait(character, world);
      
      // Update the character with their new portrait
      updateCharacter(character.id, { portrait });
      
    } catch (error) {
      console.error('Portrait generation failed:', error);
      // Character still gets created, just without a portrait
      // They can always generate one later
    } finally {
      setGeneratingPortrait(false);
    }
  };

  return (
    <div>
      <CharacterForm onSubmit={handleSubmit} />
      
      {generatingPortrait && (
        <div>Creating your character's portrait...</div>
      )}
    </div>
  );
};
```

Character creation never fails just because portrait generation does. If the AI service is down or hits rate limits, you still get your character - they just don't have a picture yet.

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

### Fallback When Generation Fails
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

There isn't a portrait config object. What the route takes is the request payload in
`src/lib/api/generatePortrait.ts`:

```typescript
interface PortraitRequest {
  character?: unknown;
  world?: unknown;
  customDescription?: string;
  prompt?: string;
  promptOnly?: boolean;
}
```

Style, size, and quality aren't parameters - the prompt builder derives the look from the
character's physical description and the world's genre. `size` on `CharacterPortrait` is a
display-only prop and doesn't affect what gets generated.

## Related
- [CharacterPortrait component](../../src/components/CharacterPortrait/CharacterPortrait.tsx)
- [Generate portrait route](../../src/app/api/generate-portrait/route.ts)
- [Character types](../../src/types/character.types.ts)
- Character Creation Wizard integration
