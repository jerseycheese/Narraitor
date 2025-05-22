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
    <div className={`ai-testing-panel space-y-3 ${className}`}>
      <h3 className="text-sm font-medium">AI Testing Panel</h3>
      
      {/* World Override Section */}
      <div className="world-override-section bg-white p-2 rounded border">
        <h4 className="text-xs font-medium mb-2">World Override</h4>
        <div className="space-y-1">
          <div>
            <label htmlFor="world-name" className="block text-xs text-gray-600">World Name:</label>
            <input
              id="world-name"
              type="text"
              value={testConfig.worldOverride?.name || ''}
              onChange={handleWorldNameChange}
              placeholder="Enter world name"
              className="w-full text-xs px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label htmlFor="world-theme" className="block text-xs text-gray-600">World Theme:</label>
            <input
              id="world-theme"
              type="text"
              value={testConfig.worldOverride?.theme || ''}
              onChange={handleWorldThemeChange}
              placeholder="Enter world theme"
              className="w-full text-xs px-2 py-1 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Character Override Section */}
      <div className="character-override-section bg-white p-2 rounded border">
        <h4 className="text-xs font-medium mb-2">Character Override</h4>
        <div>
          <label htmlFor="character-name" className="block text-xs text-gray-600">Character Name:</label>
          <input
            id="character-name"
            type="text"
            value={testConfig.characterOverride?.name || ''}
            onChange={handleCharacterNameChange}
            placeholder="Enter character name"
            className="w-full text-xs px-2 py-1 border rounded"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="generate-section">
        <button
          onClick={handleGenerateNarrative}
          disabled={isGenerating}
          className="w-full text-xs px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isGenerating ? 'Generating...' : 'Generate Narrative'}
        </button>
      </div>

      {/* Results Section */}
      {isGenerating && (
        <div className="loading-section bg-yellow-50 p-2 rounded border border-yellow-200">
          <p className="text-xs text-yellow-800">Generating narrative...</p>
        </div>
      )}

      {error && (
        <div className="error-section bg-red-50 p-2 rounded border border-red-200">
          <p className="text-xs text-red-800">Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="results-section bg-green-50 p-2 rounded border border-green-200">
          <h4 className="text-xs font-medium mb-2 text-green-800">Generated Results</h4>
          <div className="narrative-text mb-2">
            <p className="text-xs text-green-700">{result.text}</p>
          </div>
          {result.choices && result.choices.length > 0 && (
            <div className="choices-section">
              <h5 className="text-xs font-medium mb-1 text-green-800">Choices:</h5>
              <ul className="text-xs text-green-700 space-y-1">
                {result.choices.map((choice, index) => (
                  <li key={index} className="pl-2 border-l-2 border-green-300">• {choice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}