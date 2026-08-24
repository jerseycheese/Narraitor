'use client';

import React, { useState } from 'react';
import type { AITestConfig, AIResponse, Character, GenreValue, World } from '@/types';
// Using a mock implementation for testing purposes
import { createTestContext } from '@/lib/ai/contextOverride';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getTimestamp } from '@/lib/utils';
import { GENRES, normalizeGenre } from '@/lib/constants/genres';
import Logger from '@/lib/utils/logger';

const logger = new Logger('AITestingPanel');

interface AITestingPanelProps {
  className?: string;
}

export function AITestingPanel({ className = '' }: AITestingPanelProps) {
  const [testConfig, setTestConfig] = useState<AITestConfig>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toGenreValue = (value: string): GenreValue => {
    const normalized = normalizeGenre(value);
    const isKnownGenre = GENRES.some((genre) => genre.value === normalized);
    return (isKnownGenre ? normalized : 'other') as GenreValue;
  };

  // Mock base data for testing
  const mockWorld: World = {
    id: 'test-world',
    name: 'Test World',
    description: 'A world for testing',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20,
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };

  const mockCharacter: Character = {
    id: 'test-character',
    name: 'Test Character',
    description: 'A test character',
    worldId: 'test-world',
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A test character with no history',
      personality: 'Adventurous',
      goals: ['Test the system'],
      fears: ['Nothing'],
      relationships: [],
    },
    inventory: {
      characterId: 'test-character',
      items: [],
      capacity: 10,
      categories: [],
      itemOrder: [],
    },
    status: {
      conditions: [],
      location: 'Test Area',
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };

  const mockNarrativeContext = {
    recentSegments: [],
    activeCharacters: ['test-character'],
    currentLocation: 'Test Area',
    activeQuests: [],
    mood: 'neutral',
  };

  const handleWorldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig((prev) => ({
      ...prev,
      worldOverride: {
        ...prev.worldOverride,
        name: e.target.value,
      },
    }));
  };

  const handleWorldGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig((prev) => ({
      ...prev,
      worldOverride: {
        ...prev.worldOverride,
        genre: toGenreValue(e.target.value),
      },
    }));
  };

  const handleCharacterNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTestConfig((prev) => ({
      ...prev,
      characterOverride: {
        ...prev.characterOverride,
        name: e.target.value,
      },
    }));
  };

  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Create test context with overrides
      const testContext = createTestContext(
        mockWorld,
        mockCharacter,
        mockNarrativeContext,
        testConfig
      );

      const startTime = Date.now();

      // Add realistic delay to show loading state (1.5-3 seconds)
      const delay = 1500 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Generate context-aware narrative text
      const worldName = testContext.world.name;
      const worldTheme = testContext.world.genre;
      const characterName = testContext.character.name;

      const narrativeText = `In the ${worldTheme?.toLowerCase() || 'mysterious'} realm of ${worldName}, ${characterName} stands at a crossroads. The air thrums with potential as ancient forces stir around you. Your journey has led you to this pivotal moment where every decision will shape the path ahead.`;

      // Generate context-aware choices based on genre
      const generateChoices = (genre: string = 'Fantasy'): string[] => {
        const baseChoices = [
          `Explore the ${genre.toLowerCase()} landscape ahead`,
          `Study the ${worldName} surroundings more carefully`,
          `Call upon ${characterName}'s inner strength`,
        ];

        if (genre.toLowerCase().includes('fantasy')) {
          return [
            'Venture deeper into the magical forest',
            'Seek out the ancient temple ruins',
            'Cast a spell to reveal paths',
          ];
        } else if (
          genre.toLowerCase().includes('sci-fi') ||
          genre.toLowerCase().includes('space')
        ) {
          return [
            'Scan the area with your tech equipment',
            'Attempt to contact the orbital station',
            'Investigate the strange energy readings',
          ];
        } else if (genre.toLowerCase().includes('steampunk')) {
          return [
            'Fire up your mechanical contraption',
            'Navigate using the brass compass',
            'Repair the damaged airship engine',
          ];
        } else {
          return baseChoices;
        }
      };

      // Mock narrative generation for testing purposes
      const response: AIResponse = {
        text: narrativeText,
        choices: generateChoices(worldTheme),
        metadata: { tokens: 150 + Math.floor(Math.random() * 100) },
      };

      const responseTime = Date.now() - startTime;

      logger.debug('Response generated in', responseTime, 'ms');

      setResult(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`${className}`}>
      <h3>
        AI Testing Panel
      </h3>

      {/* World Override Section */}
      <div>
        <h4>
          World Override
        </h4>
        <div>
          <div>
            <label
              htmlFor="world-name"
              
            >
              World Name:
            </label>
            <Input
              id="world-name"
              type="text"
              value={testConfig.worldOverride?.name || ''}
              onChange={handleWorldNameChange}
              placeholder="Enter world name"
              
            />
          </div>
          <div>
            <label
              htmlFor="world-genre"
              
            >
              World Genre:
            </label>
            <Input
              id="world-genre"
              type="text"
              value={testConfig.worldOverride?.genre || ''}
              onChange={handleWorldGenreChange}
              placeholder="Enter world genre"
              
            />
          </div>
        </div>
      </div>

      {/* Character Override Section */}
      <div>
        <h4>
          Character Override
        </h4>
        <div>
          <label
            htmlFor="character-name"
            
          >
            Character Name:
          </label>
          <Input
            id="character-name"
            type="text"
            value={testConfig.characterOverride?.name || ''}
            onChange={handleCharacterNameChange}
            placeholder="Enter character name"
            
          />
        </div>
      </div>

      {/* Generate Button */}
      <div>
        <Button
          onClick={handleGenerateNarrative}
          disabled={isGenerating}
          
          variant="default"
        >
          {isGenerating ? 'Generating...' : 'Generate Narrative'}
        </Button>
      </div>

      {/* Results Section */}
      {isGenerating && (
        <div>
          <p>Generating narrative...</p>
        </div>
      )}

      {error && (
        <div>
          <p>Error: {error}</p>
        </div>
      )}

      {result && (
        <div>
          <h4>
            Generated Results
          </h4>
          <div>
            <p>{result.text}</p>
          </div>
          {result.choices && result.choices.length > 0 && (
            <div>
              <h5>
                Choices:
              </h5>
              <ul>
                {result.choices.map((choice, index) => (
                  <li
                    key={index}
                    
                  >
                    • {choice}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
