'use client';

import React, { useState } from 'react';
import type { AITestConfig, AIResponse } from '../../../types';
// Using a mock implementation for testing purposes
import { createTestContext } from '../../../lib/ai/contextOverride';
import { requestLogger } from '../../../lib/ai/requestLogger';
import { useMockConfiguration, useMockControls } from '@/state/mockConfigurationStore';
import { MockStatusIndicator } from '../MockControlsSection';

interface AITestingPanelProps {
  className?: string;
}

export function AITestingPanel({ className = '' }: AITestingPanelProps) {
  const [testConfig, setTestConfig] = useState<AITestConfig>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock configuration hooks
  const mockConfiguration = useMockConfiguration();
  const { enableMock, setActiveScenario, getActiveScenario } = useMockControls();

  // Mock base data for testing
  const mockWorld = {
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
      skillPointPool: 20
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockCharacter = {
    id: 'test-character',
    name: 'Test Character',
    description: 'A test character',
    worldId: 'test-world',
    attributes: [],
    skills: [],
    background: {
      history: 'A test character with no history',
      personality: 'Adventurous',
      goals: ['Test the system'],
      fears: ['Nothing'],
      relationships: []
    },
    inventory: {
      characterId: 'test-character',
      items: [],
      capacity: 10,
      categories: []
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
      location: 'Test Area'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockNarrativeContext = {
    recentSegments: [],
    activeCharacters: ['test-character'],
    currentLocation: 'Test Area',
    activeQuests: [],
    mood: 'neutral'
  };

  const handleWorldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig(prev => ({
      ...prev,
      worldOverride: {
        ...prev.worldOverride,
        name: e.target.value
      }
    }));
  };

  const handleWorldGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig(prev => ({
      ...prev,
      worldOverride: {
        ...prev.worldOverride,
        genre: e.target.value
      }
    }));
  };

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig(prev => ({
      ...prev,
      characterOverride: {
        ...prev.characterOverride,
        name: e.target.value
      }
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

      // Start request logging
      const logId = requestLogger.startRequest(
        'test-template',
        'Test prompt for narrative generation',
        testContext.narrativeContext,
        testConfig
      );

      const startTime = Date.now();

      // Generate context-aware choices based on genre
      const generateChoices = (genre: string = 'Fantasy'): string[] => {
        const baseChoices = [
          `Explore the ${genre.toLowerCase()} landscape ahead`,
          `Study the ${worldName || 'unknown world'} surroundings more carefully`,
          `Call upon ${characterName || 'the character'}'s inner strength`
        ];

        if (genre.toLowerCase().includes('fantasy')) {
          return [
            'Venture deeper into the magical forest',
            'Seek out the ancient temple ruins',
            'Cast a spell to reveal hidden paths'
          ];
        } else if (genre.toLowerCase().includes('sci-fi') || genre.toLowerCase().includes('space')) {
          return [
            'Scan the area with your tech equipment',
            'Attempt to contact the orbital station',
            'Investigate the strange energy readings'
          ];
        } else if (genre.toLowerCase().includes('steampunk')) {
          return [
            'Fire up your mechanical contraption',
            'Navigate using the brass compass',
            'Repair the damaged airship engine'
          ];
        } else {
          return baseChoices;
        }
      };

      // Use developer mock system if enabled, otherwise use legacy mock
      if (mockConfiguration.enabled) {
        const activeScenario = getActiveScenario();
        if (activeScenario) {
          // Apply scenario-specific delay
          let delay = activeScenario.delay || mockConfiguration.globalDelay;
          if (mockConfiguration.enableDelayVariation && delay > 0) {
            const variation = delay * 0.25;
            delay = delay + (Math.random() - 0.5) * 2 * variation;
          }
          await new Promise(resolve => setTimeout(resolve, Math.max(0, delay)));

          // Handle scenario type
          if (activeScenario.type === 'error' && activeScenario.error) {
            throw new Error(activeScenario.error.message);
          } else if (activeScenario.type === 'timeout') {
            await new Promise(resolve => setTimeout(resolve, 5000));
            throw new Error('Request timeout');
          }

          // Use custom response if available
          if (activeScenario.response?.content) {
            const response: AIResponse = {
              text: activeScenario.response.content,
              choices: generateChoices(testContext.world.genre),
              metadata: { 
                tokens: activeScenario.response.promptTokens || 150,
                scenario: activeScenario.name
              }
            };
            
            const responseTime = Date.now() - startTime;
            requestLogger.completeRequest(logId, response, responseTime);
            setResult(response);
            return;
          }
        }
      }

      // Legacy mock delay for backward compatibility
      const delay = 1500 + Math.random() * 1500;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Generate context-aware narrative text
      const worldName = testContext.world.name;
      const worldTheme = testContext.world.genre;
      const characterName = testContext.character.name;
      
      const narrativeText = `In the ${worldTheme?.toLowerCase() || 'mysterious'} realm of ${worldName}, ${characterName} stands at a crossroads. The air thrums with potential as ancient forces stir around you. Your journey has led you to this pivotal moment where every decision will shape the path ahead.`;


      // Mock narrative generation for testing purposes
      const response: AIResponse = {
        text: narrativeText,
        choices: generateChoices(worldTheme),
        metadata: { tokens: 150 + Math.floor(Math.random() * 100) }
      };

      const responseTime = Date.now() - startTime;

      // Complete request log
      requestLogger.completeRequest(logId, response, responseTime);

      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="devtools-panel text-sm font-medium !my-0">AI Testing Panel</h3>
        <MockStatusIndicator />
      </div>

      {/* Mock Quick Controls */}
      {mockConfiguration.enabled && (
        <div className="bg-slate-700 p-2 rounded border border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Mock Mode Active</span>
            <div className="flex gap-2">
              <select
                value={mockConfiguration.activeScenario}
                onChange={(e) => setActiveScenario(e.target.value)}
                className="text-xs bg-slate-600 border-slate-500 text-slate-200 rounded px-2 py-1"
              >
                {mockConfiguration.scenarios.map(scenario => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => enableMock(false)}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* World Override Section */}
      <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
        <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">World Override</h4>
        <div className="space-y-1">
          <div>
            <label htmlFor="world-name" className="devtools-panel block !text-xs text-slate-300 !my-0 mb-0.5">World Name:</label>
            <input
              id="world-name"
              type="text"
              value={testConfig.worldOverride?.name || ''}
              onChange={handleWorldNameChange}
              placeholder="Enter world name"
              className="devtools-panel w-full bg-slate-600 text-slate-200 border-slate-500 placeholder-slate-400"
            />
          </div>
          <div>
            <label htmlFor="world-genre" className="devtools-panel block !text-xs text-slate-300 !my-0 mb-0.5">World Genre:</label>
            <input
              id="world-genre"
              type="text"
              value={testConfig.worldOverride?.genre || ''}
              onChange={handleWorldGenreChange}
              placeholder="Enter world genre"
              className="devtools-panel w-full bg-slate-600 text-slate-200 border-slate-500 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Character Override Section */}
      <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
        <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">Character Override</h4>
        <div>
          <label htmlFor="character-name" className="devtools-panel block !text-xs text-slate-300 !my-0 mb-0.5">Character Name:</label>
          <input
            id="character-name"
            type="text"
            value={testConfig.characterOverride?.name || ''}
            onChange={handleCharacterNameChange}
            placeholder="Enter character name"
            className="devtools-panel w-full bg-slate-600 text-slate-200 border-slate-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-3">
        <button
          onClick={handleGenerateNarrative}
          disabled={isGenerating}
          className={`devtools-panel w-full transition-colors ${
            isGenerating 
              ? '!bg-slate-500 cursor-not-allowed' 
              : '!bg-blue-600 hover:!bg-blue-500 cursor-pointer'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Narrative'}
        </button>
      </div>

      {/* Results Section */}
      {isGenerating && (
        <div className="bg-yellow-900 bg-opacity-30 p-2 rounded border border-yellow-600">
          <p className="devtools-panel !text-xs text-yellow-200 !my-0">Generating narrative...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900 bg-opacity-30 p-2 rounded border border-red-600">
          <p className="devtools-panel !text-xs text-red-200 !my-0">Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-900 bg-opacity-30 p-2 rounded border border-green-600">
          <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-green-200">Generated Results</h4>
          <div className="mb-2">
            <p className="devtools-panel !text-xs text-green-100 !my-0">{result.text}</p>
          </div>
          {result.choices && result.choices.length > 0 && (
            <div>
              <h5 className="devtools-panel !text-xs !font-medium !my-0 !mb-1 text-green-200">Choices:</h5>
              <ul className="text-xs text-green-100 my-0 p-0 list-none space-y-1">
                {result.choices.map((choice, index) => (
                  <li key={index} className="pl-2 border-l-2 border-green-400 text-xs">• {choice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
