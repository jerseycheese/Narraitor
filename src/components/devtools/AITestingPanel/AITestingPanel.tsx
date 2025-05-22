import React, { useState } from 'react';
import type { AITestConfig, AIResponse } from '../../../types';
import { generateNarrative } from '../../../lib/ai/narrativeGenerator';
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
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCharacter = {
    id: 'test-character',
    name: 'Test Character',
    worldId: 'test-world',
    level: 1,
    attributes: {},
    skills: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockNarrativeContext = {
    worldId: 'test-world',
    characterId: 'test-character',
    currentScene: 'Starting scene',
    previousChoices: [],
    gameState: {}
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

  const handleCharacterLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestConfig(prev => ({
      ...prev,
      characterOverride: {
        ...prev.characterOverride,
        level: parseInt(e.target.value) || 1
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

      // Generate narrative with test context
      const response = await generateNarrative({
        world: testContext.world,
        character: testContext.character,
        context: testContext.narrativeContext
      });

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
    <div className={`ai-testing-panel ${className}`}>
      <h3>AI Testing Panel</h3>
      
      {/* World Override Section */}
      <div className="world-override-section">
        <h4>World Override</h4>
        <div>
          <label htmlFor="world-name">World Name:</label>
          <input
            id="world-name"
            type="text"
            value={testConfig.worldOverride?.name || ''}
            onChange={handleWorldNameChange}
            placeholder="Enter world name"
          />
        </div>
        <div>
          <label htmlFor="world-theme">World Theme:</label>
          <input
            id="world-theme"
            type="text"
            value={testConfig.worldOverride?.theme || ''}
            onChange={handleWorldThemeChange}
            placeholder="Enter world theme"
          />
        </div>
      </div>

      {/* Character Override Section */}
      <div className="character-override-section">
        <h4>Character Override</h4>
        <div>
          <label htmlFor="character-name">Character Name:</label>
          <input
            id="character-name"
            type="text"
            value={testConfig.characterOverride?.name || ''}
            onChange={handleCharacterNameChange}
            placeholder="Enter character name"
          />
        </div>
        <div>
          <label htmlFor="character-level">Character Level:</label>
          <input
            id="character-level"
            type="number"
            value={testConfig.characterOverride?.level || ''}
            onChange={handleCharacterLevelChange}
            placeholder="Enter character level"
            min="1"
          />
        </div>
      </div>

      {/* Narrative Context Section */}
      <div className="narrative-context-section">
        <h4>Narrative Context</h4>
        <p>Custom narrative variables can be configured here.</p>
      </div>

      {/* Generate Button */}
      <div className="generate-section">
        <button
          onClick={handleGenerateNarrative}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Narrative'}
        </button>
      </div>

      {/* Results Section */}
      {isGenerating && (
        <div className="loading-section">
          <p>Generating narrative...</p>
        </div>
      )}

      {error && (
        <div className="error-section">
          <p>Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="results-section">
          <h4>Generated Results</h4>
          <div className="narrative-text">
            <p>{result.text}</p>
          </div>
          {result.choices && result.choices.length > 0 && (
            <div className="choices-section">
              <h5>Choices:</h5>
              <ul>
                {result.choices.map((choice, index) => (
                  <li key={index}>{choice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}