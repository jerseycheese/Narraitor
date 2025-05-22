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
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 12px 0' }}>AI Testing Panel</h3>
      
      {/* World Override Section */}
      <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '500', margin: '0 0 8px 0' }}>World Override</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>
            <label htmlFor="world-name" style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>World Name:</label>
            <input
              id="world-name"
              type="text"
              value={testConfig.worldOverride?.name || ''}
              onChange={handleWorldNameChange}
              placeholder="Enter world name"
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            />
          </div>
          <div>
            <label htmlFor="world-theme" style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>World Theme:</label>
            <input
              id="world-theme"
              type="text"
              value={testConfig.worldOverride?.theme || ''}
              onChange={handleWorldThemeChange}
              placeholder="Enter world theme"
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>
      </div>

      {/* Character Override Section */}
      <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '500', margin: '0 0 8px 0' }}>Character Override</h4>
        <div>
          <label htmlFor="character-name" style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Character Name:</label>
          <input
            id="character-name"
            type="text"
            value={testConfig.characterOverride?.name || ''}
            onChange={handleCharacterNameChange}
            placeholder="Enter character name"
            style={{
              width: '100%',
              fontSize: '12px',
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ marginTop: '12px' }}>
        <button
          onClick={handleGenerateNarrative}
          disabled={isGenerating}
          style={{
            width: '100%',
            fontSize: '12px',
            padding: '8px 12px',
            backgroundColor: isGenerating ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Narrative'}
        </button>
      </div>

      {/* Results Section */}
      {isGenerating && (
        <div style={{ backgroundColor: '#fefce8', padding: '8px', borderRadius: '4px', border: '1px solid #fed7aa' }}>
          <p style={{ fontSize: '12px', color: '#92400e', margin: '0' }}>Generating narrative...</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
          <p style={{ fontSize: '12px', color: '#991b1b', margin: '0' }}>Error: {error}</p>
        </div>
      )}

      {result && (
        <div style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '500', margin: '0 0 8px 0', color: '#166534' }}>Generated Results</h4>
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#15803d', margin: '0' }}>{result.text}</p>
          </div>
          {result.choices && result.choices.length > 0 && (
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: '500', margin: '0 0 4px 0', color: '#166534' }}>Choices:</h5>
              <ul style={{ fontSize: '12px', color: '#15803d', margin: '0', padding: '0', listStyle: 'none' }}>
                {result.choices.map((choice, index) => (
                  <li key={index} style={{ 
                    paddingLeft: '8px', 
                    borderLeft: '2px solid #86efac', 
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}>• {choice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}