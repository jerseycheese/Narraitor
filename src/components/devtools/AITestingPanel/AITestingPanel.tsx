'use client';

import React, { useState } from 'react';
import type { AITestConfig, AIResponse } from '../../../types';
// Using a mock implementation for testing purposes
import { createTestContext } from '../../../lib/ai/contextOverride';
import { requestLogger } from '../../../lib/ai/requestLogger';

interface AITestingPanelProps {
  className?: string;
}

export function AITestingPanel({ className = '' }: AITestingPanelProps) {
  const [testConfig, setTestConfig] = useState<AITestConfig>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock base data for testing
  const mockWorld = {
    id: 'test-world',
    name: 'Test World',
    description: 'A world for testing',
    theme: 'Fantasy',
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

  const handleWorldThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig(prev => ({
      ...prev,
      worldOverride: {
        ...prev.worldOverride,
        theme: e.target.value
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

      // Mock narrative generation for testing purposes
      const response: AIResponse = {
        text: `Generated narrative for ${testContext.world.name} with character ${testContext.character.name}`,
        choices: [
          'Continue exploring the area',
          'Rest and recover your strength',
          'Search for clues about your past'
        ],
        metadata: { tokens: 150 }
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
      <h3 className="devtools-panel text-sm font-medium !my-0 !mb-3">AI Testing Panel</h3>
      
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
            <label htmlFor="world-theme" className="devtools-panel block !text-xs text-slate-300 !my-0 mb-0.5">World Theme:</label>
            <input
              id="world-theme"
              type="text"
              value={testConfig.worldOverride?.theme || ''}
              onChange={handleWorldThemeChange}
              placeholder="Enter world theme"
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