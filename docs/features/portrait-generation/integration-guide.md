# Portrait Generation Integration Guide

This guide explains how to integrate portrait generation into your components and features.

## Table of Contents
1. [Basic Integration](#basic-integration)
2. [Character Creation Integration](#character-creation-integration)
3. [Displaying Portraits](#displaying-portraits)
4. [Error Handling](#error-handling)
5. [Advanced Usage](#advanced-usage)
6. [Testing](#testing)

## Basic Integration

### Step 1: Import Required Dependencies

```typescript
import { CharacterPortrait } from '@/components/CharacterPortrait';
import type { Character } from '@/types/character.types';
import type { World } from '@/types/world.types';
```

### Step 2: Create Portrait Generation Function

```typescript
// Use secure API endpoint instead of direct AI client
async function generateCharacterPortrait(character: Character, world: World) {
  try {
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character: character,
        world: world
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Portrait generation failed');
    }

    const { portrait } = await response.json();
    return portrait;
  } catch (error) {
    console.error('Portrait generation failed:', error);
    // Return placeholder portrait
    return {
      type: 'placeholder' as const,
      url: null
    };
  }
}
```

## Character Creation Integration

### Complete Example: Character Creation Form

```typescript
import React, { useState } from 'react';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import type { CharacterPortrait as CharacterPortraitType } from '@/types/character.types';

export function CharacterCreationForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [portrait, setPortrait] = useState<CharacterPortraitType>({
    type: 'placeholder',
    url: null
  });
  
  const { createCharacter, updateCharacter } = characterStore();
  const { currentWorld } = worldStore();
  
  const handleCreateCharacter = async (formData: CharacterFormData) => {
    // Create character with placeholder portrait
    const characterId = createCharacter({
      ...formData,
      portrait: {
        type: 'placeholder',
        url: null
      }
    });
    
    // Generate portrait asynchronously using secure API
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: { id: characterId, ...formData },
          world: currentWorld
        }),
      });

      if (!response.ok) {
        throw new Error('Portrait generation failed');
      }

      const { portrait: generatedPortrait } = await response.json();
      
      // Update character with generated portrait
      updateCharacter(characterId, { portrait: generatedPortrait });
      setPortrait(generatedPortrait);
    } catch (error) {
      console.error('Portrait generation failed:', error);
      // Character still exists with placeholder
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <form onSubmit={handleCreateCharacter}>
      {/* Form fields */}
      
      <div className="portrait-preview">
        <CharacterPortrait
          portrait={portrait}
          characterName={formData.name}
          size="large"
        />
        {isGenerating && (
          <div className="loading-overlay">
            Generating portrait...
          </div>
        )}
      </div>
      
      <button type="submit">Create Character</button>
    </form>
  );
}
```

## Displaying Portraits

### Using the CharacterPortrait Component

The `CharacterPortrait` component handles all display logic including fallbacks:

```typescript
import { CharacterPortrait } from '@/components/CharacterPortrait';

// Basic usage
<CharacterPortrait
  portrait={character.portrait}
  characterName={character.name}
  size="medium"
/>

// With custom styling
<CharacterPortrait
  portrait={character.portrait}
  characterName={character.name}
  size="large"
  className="border-4 border-gold-500"
/>

// Size options
// - 'small': 40x40px (list views)
// - 'medium': 64x64px (cards)
// - 'large': 96x96px (detail views)
```

### Handling Different Portrait States

```typescript
function CharacterCard({ character }: { character: Character }) {
  const portrait = character.portrait || { type: 'placeholder', url: null };
  
  return (
    <div className="character-card">
      <CharacterPortrait
        portrait={portrait}
        characterName={character.name}
        size="medium"
      />
      
      {portrait.type === 'placeholder' && (
        <button onClick={() => regeneratePortrait(character)}>
          Generate Portrait
        </button>
      )}
      
      {portrait.type === 'ai-generated' && portrait.generatedAt && (
        <span className="text-xs text-gray-500">
          Generated {new Date(portrait.generatedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
```

## Error Handling

### Comprehensive Error Handling Pattern

```typescript
interface PortraitGenerationResult {
  success: boolean;
  portrait?: CharacterPortrait;
  error?: string;
}

async function safeGeneratePortrait(
  character: Character,
  world: World
): Promise<PortraitGenerationResult> {
  try {
    // Use secure API endpoint - no need to check API keys client-side
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character: character,
        world: world
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Portrait generation failed',
        portrait: { type: 'placeholder', url: null }
      };
    }

    const { portrait } = await response.json();
    return {
      success: true,
      portrait: portrait
    };
    
  } catch (error) {
    console.error('Portrait generation error:', error);
    
    // Determine error type
    let errorMessage = 'Failed to generate portrait';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API configuration';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please try again';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      portrait: { type: 'placeholder', url: null }
    };
  }
}
```

### User-Friendly Error Display

```typescript
function PortraitGenerationStatus({ result }: { result: PortraitGenerationResult }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700 font-medium">Portrait Generation Failed</p>
        <p className="text-red-600 text-sm mt-1">{result.error}</p>
        <button 
          className="mt-2 text-red-700 underline text-sm"
          onClick={() => window.location.href = '/docs/features/portrait-generation/troubleshooting.md'}
        >
          See troubleshooting guide
        </button>
      </div>
    );
  }
  
  return null;
}
```

## Advanced Usage

### Custom Portrait Generation Options

```typescript
// For known fictional characters
const portrait = await portraitGenerator.generatePortrait(character, {
  worldTheme: 'Star Wars',
  isKnownFigure: true,
  knownFigureContext: 'fictional',
  actorName: 'Harrison Ford' // For characters played by specific actors
});

// For video game characters
const portrait = await portraitGenerator.generatePortrait(character, {
  worldTheme: 'Fantasy RPG',
  detection: {
    isKnownFigure: true,
    figureType: 'videogame',
    figureName: 'The Witcher 3'
  }
});

// With custom physical description override
const customCharacter = {
  ...character,
  background: {
    ...character.background,
    physicalDescription: 'Wearing ornate golden armor with glowing runes'
  }
};
const portrait = await portraitGenerator.generatePortrait(customCharacter);
```

### Batch Portrait Generation

```typescript
async function generatePortraitsForWorld(worldId: string) {
  const characters = Object.values(characterStore.getState().characters)
    .filter(char => char.worldId === worldId);
  
  const results = await Promise.allSettled(
    characters.map(async (character) => {
      if (character.portrait?.type === 'ai-generated') {
        return { character, skipped: true };
      }
      
      const portrait = await portraitGenerator.generatePortrait(character);
      characterStore.getState().updateCharacter(character.id, { portrait });
      
      return { character, portrait };
    })
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Generated ${successful} portraits, ${failed} failed`);
}
```

### Portrait Regeneration

```typescript
async function regeneratePortrait(character: Character) {
  const currentPortrait = character.portrait;
  
  // Set loading state
  characterStore.getState().updateCharacter(character.id, {
    portrait: { type: 'placeholder', url: null }
  });
  
  try {
    const newPortrait = await portraitGenerator.generatePortrait(character, {
      worldTheme: worldStore.getState().worlds[character.worldId]?.theme
    });
    
    characterStore.getState().updateCharacter(character.id, {
      portrait: newPortrait
    });
    
    return newPortrait;
  } catch (error) {
    // Restore previous portrait on failure
    characterStore.getState().updateCharacter(character.id, {
      portrait: currentPortrait || { type: 'placeholder', url: null }
    });
    throw error;
  }
}
```

## Testing

### Unit Testing Portrait Generation

```typescript
// ❌ OLD PATTERN - Testing direct AI clients (deprecated)
// Use API endpoint testing instead

// ✅ NEW SECURE PATTERN - Test API endpoints
describe('Portrait Generation API', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should generate portrait for character via API', async () => {
    const mockResponse = {
      portrait: {
        type: 'ai-generated',
        url: 'data:image/png;base64,mockImageData',
        generatedAt: new Date().toISOString(),
        prompt: 'Test prompt'
      }
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: mockCharacter, world: mockWorld })
    });
    
    const result = await response.json();
    
    expect(result.portrait).toEqual({
      type: 'ai-generated',
      url: 'data:image/png;base64,mockImageData',
      generatedAt: expect.any(String),
      prompt: 'Test prompt'
    });
  });
  
  it('should handle API generation failure gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    });
    
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: mockCharacter, world: mockWorld })
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});
```

### Integration Testing with React Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { CharacterCreationForm } from './CharacterCreationForm';

// Mock the portrait generator
jest.mock('@/lib/ai/portraitGenerator', () => ({
  PortraitGenerator: jest.fn().mockImplementation(() => ({
    generatePortrait: jest.fn().mockResolvedValue({
      type: 'ai-generated',
      url: 'data:image/png;base64,mockData',
      generatedAt: new Date().toISOString()
    })
  }))
}));

describe('Character Creation with Portrait', () => {
  it('should show loading state during generation', async () => {
    render(<CharacterCreationForm />);
    
    // Fill form and submit
    // ...
    
    expect(screen.getByText('Generating portrait...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Generating portrait...')).not.toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Always Handle Failures**: Portrait generation can fail for various reasons. Always provide fallbacks.

2. **Show Loading States**: Generation takes 2-5 seconds. Show appropriate loading indicators.

3. **Cache When Possible**: Store generated portraits in your state management system.

4. **Respect Rate Limits**: Implement client-side rate limiting for bulk operations.

5. **Provide Manual Controls**: Let users regenerate portraits if they're not satisfied.

6. **Test Fallback Behavior**: Ensure your UI works well with placeholder portraits.

## Common Integration Patterns

### Pattern 1: Deferred Generation
Generate portraits after character creation to avoid blocking the user flow.

### Pattern 2: Progressive Enhancement
Start with placeholders and enhance with AI portraits as they become available.

### Pattern 3: Bulk Operations
Provide tools for generating multiple portraits with progress tracking.

### Pattern 4: User Choice
Allow users to choose between AI generation, upload, or presets (when available).