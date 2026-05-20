'use client';

import React, { useState, useEffect } from 'react';
import { ChoiceGenerator } from '@/lib/ai/choiceGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import ChoiceSelector from '@/components/shared/ChoiceSelector/ChoiceSelector';
import { Decision, NarrativeContext } from '@/types/narrative.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import { useWorldStore } from '@/state/worldStore';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ChoiceAlignmentDev');

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
      const newWorldId = useWorldStore.getState().createWorld({
        name: 'Test World',
        description: 'A fantasy world for testing choice alignment',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 100,
          skillPointPool: 100
        }
      });
      
      void ensureWorldNpcRoster(newWorldId);

      // Verify the world was created and stored
      const storedWorld = useWorldStore.getState().worlds[newWorldId];
      if (storedWorld) {
        setWorldId(newWorldId);
        logger.debug('Created test world with ID:', newWorldId, storedWorld);
      } else {
        logger.error('World was not stored properly');
        setError('Failed to create test world');
      }
    } catch (err) {
      logger.error('Error creating world:', err);
      setError(err instanceof Error ? err.message : 'Failed to create world');
    }
  }, []);

  const scenarios = {
    bandits: {
      location: 'Forest Path',
      situation: 'A group of bandits blocks your path',
      context: 'You are traveling through a dark forest when a group of armed bandits steps out from behind the trees, weapons drawn, demanding you pay a toll to pass. Their leader, a scarred man with a wicked grin, counts your coin purse with greedy eyes while his companions all escape routes.'
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
    const currentWorld = useWorldStore.getState().worlds[worldId];
    if (!currentWorld) {
      setError(`World ${worldId} no longer exists. This may be a persistence issue.`);
      logger.error('Available worlds:', Object.keys(useWorldStore.getState().worlds));
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
          createdAt: getTimestamp(),
          updatedAt: getTimestamp()
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
      logger.error('Error generating choices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    logger.debug('Selected choice:', choiceId);
    const selectedOption = decision?.options.find(opt => opt.id === choiceId);
    if (selectedOption) {
      logger.debug('Choice details:', {
        text: selectedOption.text,
        alignment: selectedOption.alignment
      });
    }
  };

  const handleCustomSubmit = (customText: string) => {
    logger.debug('Custom choice submitted:', customText);
  };

  return (
    <div>
      <div>
        <div>
          <h1>
            Choice Alignment Test
          </h1>
          
          {/* Controls */}
          <div>
            <h2>Test Controls</h2>
            
            <div>
              <div>
                <label>
                  Scenario
                </label>
                <select 
                  value={scenario} 
                  onChange={(e) => setScenario(e.target.value as 'bandits' | 'merchant' | 'dragon')}
                >
                  <option value="bandits">Forest Bandits</option>
                  <option value="merchant">Suspicious Merchant</option>
                  <option value="dragon">Dragon Encounter</option>
                </select>
              </div>
              
              <div>
                <button
                  onClick={generateChoices}
                  disabled={loading || !worldId}
                >
                  {loading ? 'Generating...' : !worldId ? 'Initializing...' : 'Generate Aligned Choices'}
                </button>
              </div>
            </div>
            
            {/* Scenario Display */}
            <div>
              <h3>Current Scenario:</h3>
              <p>
                <strong>Location:</strong> {scenarios[scenario].location}
              </p>
              <p>
                <strong>Situation:</strong> {scenarios[scenario].situation}
              </p>
              <p>
                {scenarios[scenario].context}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          {decision && (
            <div>
              <h2>Generated Choices</h2>
              
              {/* Alignment Legend */}
              <div>
                <h3>Alignment Legend:</h3>
                <div>
                  <div>
                    <div></div>
                    <span><strong>Lawful:</strong> Follows rules, respects authority</span>
                  </div>
                  <div>
                    <div></div>
                    <span><strong>Neutral:</strong> Balanced, practical approach</span>
                  </div>
                  <div>
                    <div></div>
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
              />

              {/* Debug Info */}
              <div>
                <h3>Debug Information:</h3>
                <div>
                  <p><strong>Template Used:</strong> Aligned Choice Template</p>
                  <p><strong>Options Count:</strong> {decision.options.length}</p>
                  <p><strong>Alignment Distribution:</strong></p>
                  <ul>
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
                
                <details>
                  <summary>
                    Raw Decision Object
                  </summary>
                  <pre>
                    {JSON.stringify(decision, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <h3>Testing Instructions</h3>
            <ul>
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
