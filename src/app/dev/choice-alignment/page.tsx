'use client';

import React, { useState, useEffect } from 'react';
import { ChoiceGenerator } from '@/lib/ai/choiceGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import ChoiceSelector from '@/components/shared/ChoiceSelector/ChoiceSelector';
import { Decision, NarrativeContext } from '@/types/narrative.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { worldStore } from '@/state/worldStore';

export default function ChoiceAlignmentTestPage() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<'bandits' | 'merchant' | 'dragon'>('bandits');
  const [error, setError] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<string | null>(null);

  const choiceGenerator = new ChoiceGenerator(createDefaultGeminiClient());

  // Create a test world when component mounts
  useEffect(() => {
    try {
      const newWorldId = worldStore.getState().createWorld({
        name: 'Test World',
        description: 'A fantasy world for testing choice alignment',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 100,
          skillPointPool: 100
        }
      });
      
      // Verify the world was created and stored
      const storedWorld = worldStore.getState().worlds[newWorldId];
      if (storedWorld) {
        setWorldId(newWorldId);
        console.log('Created test world with ID:', newWorldId, storedWorld);
      } else {
        console.error('World was not stored properly');
        setError('Failed to create test world');
      }
    } catch (err) {
      console.error('Error creating world:', err);
      setError(err instanceof Error ? err.message : 'Failed to create world');
    }
  }, []);

  const scenarios = {
    bandits: {
      location: 'Forest Path',
      situation: 'A group of bandits blocks your path',
      context: 'You are traveling through a dark forest when a group of armed bandits steps out from behind the trees, weapons drawn, demanding you pay a toll to pass. Their leader, a scarred man with a wicked grin, counts your coin purse with greedy eyes while his companions block all escape routes.'
    },
    merchant: {
      location: 'Town Market',
      situation: 'A suspicious merchant offers a deal',
      context: 'A hooded merchant approaches you in the bustling market square with an ornate, glowing artifact. The item pulses with magical energy, yet he offers to sell it for mere copper coins - far less than it appears to be worth. Other merchants nearby whisper nervously and avoid eye contact.'
    },
    dragon: {
      location: 'Mountain Cave',
      situation: 'A dragon guards its treasure',
      context: 'You have found the legendary dragon\'s lair deep within the mountain. The massive ancient red dragon sits atop an enormous pile of gold and jewels, its intelligent amber eyes following your every movement. Smoke curls from its nostrils as it speaks in a voice like rolling thunder, offering you a riddle for safe passage.'
    }
  };

  const generateChoices = async () => {
    if (!worldId) {
      setError('World not yet created. Please wait a moment and try again.');
      return;
    }
    
    // Double-check that the world still exists
    const currentWorld = worldStore.getState().worlds[worldId];
    if (!currentWorld) {
      setError(`World ${worldId} no longer exists. This may be a persistence issue.`);
      console.error('Available worlds:', Object.keys(worldStore.getState().worlds));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const mockNarrativeContext: NarrativeContext = {
        worldId: worldId,
        currentSceneId: generateUniqueId('scene'),
        characterIds: [generateUniqueId('character')],
        previousSegments: [{
          id: generateUniqueId('segment'),
          content: scenarios[scenario].context,
          type: 'scene',
          metadata: {
            tags: ['test'],
            location: scenarios[scenario].location
          },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        currentTags: ['adventure'],
        sessionId: generateUniqueId('session'),
        currentLocation: scenarios[scenario].location,
        currentSituation: scenarios[scenario].situation
      };

      const result = await choiceGenerator.generateChoices({
        worldId: worldId,
        narrativeContext: mockNarrativeContext,
        characterIds: [generateUniqueId('character')],
        useAlignedChoices: true
      });

      setDecision(result);
    } catch (err) {
      console.error('Error generating choices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    console.log('Selected choice:', choiceId);
    const selectedOption = decision?.options.find(opt => opt.id === choiceId);
    if (selectedOption) {
      console.log('Choice details:', {
        text: selectedOption.text,
        alignment: selectedOption.alignment
      });
    }
  };

  const handleCustomSubmit = (customText: string) => {
    console.log('Custom choice submitted:', customText);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Choice Alignment Test
          </h1>
          
          {/* Controls */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario
                </label>
                <select 
                  value={scenario} 
                  onChange={(e) => setScenario(e.target.value as 'bandits' | 'merchant' | 'dragon')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="bandits">Forest Bandits</option>
                  <option value="merchant">Suspicious Merchant</option>
                  <option value="dragon">Dragon Encounter</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={generateChoices}
                  disabled={loading || !worldId}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : !worldId ? 'Initializing...' : 'Generate Aligned Choices'}
                </button>
              </div>
            </div>
            
            {/* Scenario Display */}
            <div className="bg-white rounded p-3 border">
              <h3 className="font-medium text-gray-900 mb-2">Current Scenario:</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Location:</strong> {scenarios[scenario].location}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Situation:</strong> {scenarios[scenario].situation}
              </p>
              <p className="text-sm text-gray-600">
                {scenarios[scenario].context}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          {decision && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Choices</h2>
              
              {/* Alignment Legend */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Alignment Legend:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-2"></div>
                    <span><strong>Lawful:</strong> Follows rules, respects authority</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
                    <span><strong>Neutral:</strong> Balanced, practical approach</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-50 border border-red-300 rounded mr-2"></div>
                    <span><strong>Chaos:</strong> Unexpected, disruptive action</span>
                  </div>
                </div>
              </div>

              {/* Choice Selector */}
              <ChoiceSelector
                decision={decision}
                onSelect={handleChoiceSelect}
                enableCustomInput={true}
                onCustomSubmit={handleCustomSubmit}
                showHints={true}
              />

              {/* Debug Info */}
              <div className="mt-6 bg-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Debug Information:</h3>
                <div className="text-xs text-gray-700 space-y-1">
                  <p><strong>Template Used:</strong> Aligned Choice Template</p>
                  <p><strong>Options Count:</strong> {decision.options.length}</p>
                  <p><strong>Alignment Distribution:</strong></p>
                  <ul className="ml-4 space-y-1">
                    {['lawful', 'neutral', 'chaotic'].map(alignment => {
                      const count = decision.options.filter(opt => opt.alignment === alignment).length;
                      return (
                        <li key={alignment}>
                          {alignment}: {count} option{count !== 1 ? 's' : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                <details className="mt-4">
                  <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                    Raw Decision Object
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                    {JSON.stringify(decision, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-amber-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Testing Instructions</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Try different scenarios to see how alignment varies with context</li>
              <li>• Notice the color coding: blue for lawful, neutral for white, red for chaos</li>
              <li>• <strong>CHAOS VERIFICATION:</strong> Red choices should be wildly unexpected, dramatic, and could completely change the situation</li>
              <li>• Test that chaotic options ignore social norms and offer creative/disruptive solutions</li>
              <li>• Test the custom input feature alongside aligned choices</li>
              <li>• Check the debug information to verify alignment distribution</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}