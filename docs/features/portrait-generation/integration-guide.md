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
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';
import { createAIClient } from '@/lib/ai/clientFactory';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import type { Character } from '@/types/character.types';
```

### Step 2: Initialize Portrait Generator

```typescript
// In your component or service
const aiClient = createAIClient();
const portraitGenerator = new PortraitGenerator(aiClient);
```

### Step 3: Generate a Portrait

```typescript
async function generateCharacterPortrait(character: Character, worldTheme?: string) {
  try {
    const portrait = await portraitGenerator.generatePortrait(character, {
      worldTheme: worldTheme || 'Fantasy'
    });
    
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
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';
import { createAIClient } from '@/lib/ai/clientFactory';
import { CharacterPortrait } from '@/components/CharacterPortrait';

export function CharacterCreationForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [portrait, setPortrait] = useState<CharacterPortrait>({
    type: 'placeholder',
    url: null
  });
  
  const { createCharacter, updateCharacter } = characterStore();
  
  const handleCreateCharacter = async (formData: CharacterFormData) => {
    // Create character with placeholder portrait
    const characterId = createCharacter({
      ...formData,
      portrait: {
        type: 'placeholder',
        url: null
      }
    });
    
    // Generate portrait asynchronously
    setIsGenerating(true);
    try {
      const aiClient = createAIClient();
      const portraitGenerator = new PortraitGenerator(aiClient);
      
      const generatedPortrait = await portraitGenerator.generatePortrait(
        { id: characterId, ...formData },
        { worldTheme: formData.worldTheme }
      );
      
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
  options?: PortraitGenerationOptions
): Promise<PortraitGenerationResult> {
  try {
    // Check for API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      return {
        success: false,
        error: 'API key not configured',
        portrait: { type: 'placeholder', url: null }
      };
    }
    
    // Attempt generation
    const aiClient = createAIClient();
    const portraitGenerator = new PortraitGenerator(aiClient);
    
    const portrait = await portraitGenerator.generatePortrait(character, options);
    
    return {
      success: true,
      portrait
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
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';

describe('Portrait Generation', () => {
  const mockAIClient = {
    generateContent: jest.fn(),
    generateImage: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should generate portrait for character', async () => {
    mockAIClient.generateImage.mockResolvedValue({
      image: 'data:image/png;base64,mockImageData',
      prompt: 'Test prompt'
    });
    
    const generator = new PortraitGenerator(mockAIClient);
    const portrait = await generator.generatePortrait(mockCharacter);
    
    expect(portrait).toEqual({
      type: 'ai-generated',
      url: 'data:image/png;base64,mockImageData',
      generatedAt: expect.any(String),
      prompt: 'Test prompt'
    });
  });
  
  it('should handle generation failure gracefully', async () => {
    mockAIClient.generateImage.mockRejectedValue(new Error('API Error'));
    
    const generator = new PortraitGenerator(mockAIClient);
    
    await expect(generator.generatePortrait(mockCharacter))
      .rejects.toThrow('Failed to generate character portrait');
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