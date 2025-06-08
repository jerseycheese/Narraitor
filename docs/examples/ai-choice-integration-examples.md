---
title: "AI Choice Generation Integration Examples"
type: example
category: ai
tags: [ai, choice, integration, examples]
created: 2025-05-21
updated: 2025-06-08
---

# AI Choice Generation Integration Examples

This document provides complete code examples for integrating AI choice generation into different parts of the Narraitor application.

## Example 1: Simple Game Session with AI Choices

This is the most straightforward way to add AI choice generation to a game session:

```tsx
// components/CustomGameSession.tsx
import React from 'react';
import { GameSessionActiveWithNarrative } from '@/components/GameSession';
import { World } from '@/types/world.types';

interface CustomGameSessionProps {
  world: World;
  sessionId: string;
}

export const CustomGameSession: React.FC<CustomGameSessionProps> = ({
  world,
  sessionId
}) => {
  const handleChoiceSelected = (choiceId: string) => {
    console.log(`Player selected choice: ${choiceId}`);
    // Choice selection automatically triggers new narrative generation
    // which then generates new choices, creating a continuous cycle
  };

  const handleSessionEnd = () => {
    console.log('Game session ended');
    // Handle session cleanup
  };

  return (
    <div className="game-container">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">{world.name}</h1>
        <p className="text-gray-600">{world.description}</p>
      </header>
      
      <GameSessionActiveWithNarrative
        worldId={world.id}
        sessionId={sessionId}
        world={world}
        status="active"
        onChoiceSelected={handleChoiceSelected}
        onEnd={handleSessionEnd}
      />
    </div>
  );
};
```

## Example 2: Custom Choice Display Component

Create a custom component that uses the choice generation system with your own UI:

```tsx
// components/CustomChoiceDisplay.tsx
import React, { useState, useEffect } from 'react';
import { NarrativeController } from '@/components/Narrative';
import { Decision, NarrativeSegment } from '@/types/narrative.types';

interface CustomChoiceDisplayProps {
  worldId: string;
  sessionId: string;
  onChoiceSelected: (choiceId: string) => void;
}

export const CustomChoiceDisplay: React.FC<CustomChoiceDisplayProps> = ({
  worldId,
  sessionId,
  onChoiceSelected
}) => {
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>();

  const handleNarrativeGenerated = (segment: NarrativeSegment) => {
    console.log('New narrative segment generated:', segment.content);
    // Start generating choices after narrative
    setIsGenerating(true);
  };

  const handleChoicesGenerated = (decision: Decision) => {
    setCurrentDecision(decision);
    setIsGenerating(false);
  };

  const selectChoice = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setCurrentDecision(null); // Clear current choices
    onChoiceSelected(choiceId);
  };

  return (
    <div className="choice-display">
      {/* Hidden narrative controller for generation logic */}
      <div style={{ display: 'none' }}>
        <NarrativeController
          worldId={worldId}
          sessionId={sessionId}
          generateChoices={true}
          choiceId={selectedChoiceId}
          onNarrativeGenerated={handleNarrativeGenerated}
          onChoicesGenerated={handleChoicesGenerated}
        />
      </div>

      {/* Custom choice UI */}
      <div className="choices-container">
        {isGenerating && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span>Generating your choices...</span>
          </div>
        )}

        {currentDecision && !isGenerating && (
          <div className="choice-section">
            <h3 className="text-lg font-semibold mb-4">{currentDecision.prompt}</h3>
            <div className="space-y-2">
              {currentDecision.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => selectChoice(option.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-medium text-blue-600">{index + 1}.</span>{' '}
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {!currentDecision && !isGenerating && (
          <div className="text-gray-500">
            Continue the story to see your choices...
          </div>
        )}
      </div>
    </div>
  );
};
```

## Example 3: Advanced Integration with Character Context

This example shows how to prepare for character integration (ready for when character system issues are completed):

```tsx
// components/CharacterAwareChoiceSystem.tsx
import React, { useState } from 'react';
import { narrativeStore } from '@/state/narrativeStore';
import { Decision, NarrativeContext } from '@/types/narrative.types';

interface CharacterAwareChoiceSystemProps {
  worldId: string;
  sessionId: string;
  characterId?: string; // Will be used when character integration is complete
  onChoiceSelected: (choiceId: string) => void;
}

export const CharacterAwareChoiceSystem: React.FC<CharacterAwareChoiceSystemProps> = ({
  worldId,
  sessionId,
  characterId,
  onChoiceSelected
}) => {
  const [choices, setChoices] = useState<Decision | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateChoicesWithCharacterContext = async () => {
    setIsGenerating(true);
    
    try {
      // Get narrative context
      const segments = narrativeStore.getState().getSessionSegments(sessionId);
      const recentSegments = segments.slice(-5);
      
      // Build context (character integration ready)
      const narrativeContext: NarrativeContext = {
        recentSegments,
        currentLocation: 'Current Scene', // Could be derived from latest segment
        // characterData: characterId ? getCharacterData(characterId) : undefined // Future integration
      };

      // Use secure API endpoint instead of direct AI client
      const response = await fetch('/api/narrative/choices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldId,
          narrativeContext,
          characterIds: characterId ? [characterId] : [], // Ready for character integration
          maxOptions: 4,
          minOptions: 3
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate choices');
      }

      const decision = await response.json();
      setChoices(decision);
    } catch (error) {
      console.error('Failed to generate character-aware choices:', error);
      // Fallback to basic choices
      setChoices({
        id: `fallback-${Date.now()}`,
        prompt: "What would you like to do?",
        options: [
          { id: 'fallback-1', text: 'Continue exploring' },
          { id: 'fallback-2', text: 'Talk to someone' },
          { id: 'fallback-3', text: 'Rest and observe' }
        ]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger generation when needed
  React.useEffect(() => {
    generateChoicesWithCharacterContext();
  }, [worldId, sessionId, characterId]);

  const handleChoiceSelect = (choiceId: string) => {
    setChoices(null); // Clear current choices
    onChoiceSelected(choiceId);
    
    // Re-generate choices after a delay to allow for narrative update
    setTimeout(() => {
      generateChoicesWithCharacterContext();
    }, 1000);
  };

  return (
    <div className="character-aware-choices">
      {isGenerating && (
        <div className="text-center py-4">
          <div className="animate-pulse">
            Considering your character's abilities and generating choices...
          </div>
        </div>
      )}

      {choices && !isGenerating && (
        <div className="choices-panel">
          <h3 className="text-xl font-bold mb-4">{choices.prompt}</h3>
          
          {/* Character context indicator (future feature) */}
          {characterId && (
            <div className="text-sm text-gray-600 mb-3">
              Choices personalized for your character
            </div>
          )}
          
          <div className="grid gap-3">
            {choices.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleChoiceSelect(option.id)}
                className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## Example 4: Testing Component

Use this component to test choice generation in isolation:

```tsx
// components/ChoiceGenerationTester.tsx
import React, { useState } from 'react';
import { Decision, NarrativeSegment } from '@/types/narrative.types';

export const ChoiceGenerationTester: React.FC = () => {
  const [worldId, setWorldId] = useState('');
  const [narrativeContent, setNarrativeContent] = useState('');
  const [generatedChoices, setGeneratedChoices] = useState<Decision | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  const testChoiceGeneration = async () => {
    if (!worldId.trim() || !narrativeContent.trim()) {
      setError('Please provide both World ID and narrative content');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Create mock narrative context
      const mockSegment: NarrativeSegment = {
        id: 'test-segment',
        content: narrativeContent,
        type: 'scene',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      // Use secure API endpoint instead of direct AI client
      const response = await fetch('/api/narrative/choices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldId,
          narrativeContext: {
            recentSegments: [mockSegment]
          },
          characterIds: [],
          maxOptions: 4,
          minOptions: 3
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate choices');
      }

      const decision = await response.json();
      setGeneratedChoices(decision);
    } catch (err: any) {
      setError(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="choice-tester p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">AI Choice Generation Tester</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">World ID:</label>
          <input
            type="text"
            value={worldId}
            onChange={(e) => setWorldId(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter world ID (e.g., world-123)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Narrative Context:</label>
          <textarea
            value={narrativeContent}
            onChange={(e) => setNarrativeContent(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Enter the story context for choice generation..."
          />
        </div>

        <button
          onClick={testChoiceGeneration}
          disabled={isGenerating}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? 'Generating Choices...' : 'Generate Choices'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {generatedChoices && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h3 className="font-bold text-lg mb-2">Generated Choices:</h3>
            <p className="mb-4 font-medium">{generatedChoices.prompt}</p>
            
            <div className="space-y-2">
              {generatedChoices.options.map((option, index) => (
                <div key={option.id} className="p-2 bg-white border rounded">
                  <strong>{index + 1}.</strong> {option.text}
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>Decision ID: {generatedChoices.id}</p>
              <p>Options Count: {generatedChoices.options.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Example 5: React Hook for Choice Generation

Create a reusable hook for choice generation logic:

```tsx
// hooks/useAIChoiceGeneration.ts
import { useState, useCallback } from 'react';
import { Decision, NarrativeContext } from '@/types/narrative.types';

interface UseAIChoiceGenerationOptions {
  worldId: string;
  maxOptions?: number;
  minOptions?: number;
  autoGenerate?: boolean;
}

export const useAIChoiceGeneration = (options: UseAIChoiceGenerationOptions) => {
  const [choices, setChoices] = useState<Decision | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChoices = useCallback(async (
    narrativeContext: NarrativeContext,
    characterIds: string[] = []
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use secure API endpoint instead of direct AI client
      const response = await fetch('/api/narrative/choices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldId: options.worldId,
          narrativeContext,
          characterIds,
          maxOptions: options.maxOptions || 4,
          minOptions: options.minOptions || 3
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate choices');
      }

      const decision = await response.json();
      setChoices(decision);
      return decision;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate choices';
      setError(errorMessage);
      console.error('Choice generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [options.worldId, options.maxOptions, options.minOptions]);

  const clearChoices = useCallback(() => {
    setChoices(null);
    setError(null);
  }, []);

  const selectChoice = useCallback((choiceId: string) => {
    if (choices) {
      // Mark the choice as selected
      const updatedChoices = {
        ...choices,
        selectedOptionId: choiceId
      };
      setChoices(updatedChoices);
    }
    return choiceId;
  }, [choices]);

  return {
    choices,
    isGenerating,
    error,
    generateChoices,
    clearChoices,
    selectChoice
  };
};

// Usage example:
export const ExampleComponent: React.FC = () => {
  const { choices, isGenerating, generateChoices, selectChoice } = useAIChoiceGeneration({
    worldId: 'my-world-id',
    maxOptions: 4
  });

  const handleGenerateChoices = () => {
    generateChoices({
      recentSegments: [
        { content: 'You enter a mysterious cave...', type: 'scene' }
      ]
    });
  };

  return (
    <div>
      <button onClick={handleGenerateChoices}>Generate Choices</button>
      
      {isGenerating && <div>Generating...</div>}
      
      {choices && (
        <div>
          <h3>{choices.prompt}</h3>
          {choices.options.map(option => (
            <button key={option.id} onClick={() => selectChoice(option.id)}>
              {option.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Usage in Different Contexts

### 1. Main Game Loop
Use `GameSessionActiveWithNarrative` for complete AI-driven gameplay.

### 2. Custom UI
Use `NarrativeController` with custom choice display components.

### 3. Testing & Development
Use the tester component to validate choice generation.

### 4. Advanced Integration
Use the hook-based approach for maximum flexibility.

### 5. Character-Ready Development
Structure your code to easily integrate character data when those issues are completed.

---

These examples provide a complete foundation for integrating AI choice generation throughout your application. Each example builds on the core system while providing different levels of customization and control.