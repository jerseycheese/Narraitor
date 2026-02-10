// src/app/dev/ending-system/page.tsx

'use client';

import React, { useState } from 'react';
import { EndingScreen } from '../../../components/GameSession/EndingScreen';
import { useNarrativeStore } from '../../../state/narrativeStore';
import type { EndingType, EndingTone, StoryEnding } from '../../../types/narrative.types';
import { capitalize, getTimestamp } from '@/lib/utils';

export default function EndingSystemTestHarness() {
  const { generateEnding, currentEnding, isGeneratingEnding, endingError, clearEnding } = useNarrativeStore();
  const [endingType, setEndingType] = useState<EndingType>('story-complete');
  const [desiredTone, setDesiredTone] = useState<EndingTone>('triumphant');
  const [customPrompt, setCustomPrompt] = useState('');

  const mockSessionId = 'test-session-123';
  const mockCharacterId = 'test-char-456';
  const mockWorldId = 'test-world-789';

  const handleGenerateEnding = async () => {
    await generateEnding(endingType, {
      sessionId: mockSessionId,
      characterId: mockCharacterId,
      worldId: mockWorldId,
      desiredTone,
      customPrompt: customPrompt || undefined
    });
  };

  const mockEndingData: StoryEnding = {
    id: 'mock-ending-123',
    sessionId: mockSessionId,
    characterId: mockCharacterId,
    worldId: mockWorldId,
    type: endingType,
    tone: desiredTone,
    epilogue: `As the sun set over the kingdom, our brave hero ${endingType === 'character-retirement' ? 'decided to lay down their sword and live peacefully' : 'stood victorious after their great adventure'}. The journey that began with uncertainty ended with ${desiredTone === 'tragic' ? 'great sacrifice' : desiredTone === 'mysterious' ? 'lingering questions' : 'celebration'}. The lands would remember this day for generations to come, when a simple adventurer became the ${desiredTone === 'mysterious' ? 'enigmatic figure of legend' : 'hero the realm needed'}. Through trials and tribulations, they proved that courage and determination can overcome any obstacle. As the stars began to twinkle in the evening sky, our hero ${endingType === 'character-retirement' ? 'smiled peacefully, knowing their adventuring days were behind them' : 'looked toward the horizon, ready for whatever adventures lay ahead'}.`,
    characterLegacy: `The hero's name would be spoken with ${desiredTone === 'tragic' ? 'solemn respect' : 'admiration'} throughout the realm. Their ${endingType === 'character-retirement' ? 'wise decision to step away at the peak of their power' : 'incredible journey from humble beginnings to legendary status'} inspired countless others to pursue their own adventures. Young warriors would train hoping to follow in their footsteps, and bards would sing songs of their ${desiredTone === 'mysterious' ? 'enigmatic deeds' : 'heroic exploits'} for centuries to come.`,
    worldImpact: `The realm was forever changed by the hero's actions. ${endingType === 'story-complete' ? 'With the main quest completed, peace returned to the land' : endingType === 'character-retirement' ? 'The hero\'s retirement marked the end of an era' : 'The adventure\'s conclusion brought new possibilities'}. Trade routes reopened, alliances were strengthened, and the people looked toward the future with ${desiredTone === 'hopeful' ? 'unbridled optimism' : desiredTone === 'tragic' ? 'cautious hope despite their losses' : 'renewed confidence'}. The world had been saved, and all knew that heroes like this one would always rise when needed.`,
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    achievements: [
      'Legendary Hero',
      'Realm Protector',
      `${endingType === 'character-retirement' ? 'Peaceful Retirement' : 'Quest Complete'}`,
      `${capitalize(desiredTone)} Ending`,
      'Story Complete'
    ],
    playTime: 7200 // 2 hours
  };

  const handleUseMockData = () => {
    useNarrativeStore.setState({
      currentEnding: mockEndingData,
      isGeneratingEnding: false,
      endingError: null
    });
  };

  if (currentEnding && !isGeneratingEnding) {
    return <EndingScreen />;
  }

  return (
    <div>
      <div>
        <div>
          <h1>
            Ending System Test Harness
          </h1>
          
          <div>
            {/* Status Display */}
            <div>
              <h2>Current Status</h2>
              <div>
                <p><strong>Is Generating:</strong> {isGeneratingEnding ? 'Yes' : 'No'}</p>
                <p><strong>Has Ending:</strong> {currentEnding ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {endingError || 'None'}</p>
              </div>
            </div>

            {/* Test Controls */}
            <div>
              <div>
                <label>
                  Ending Type
                </label>
                <select
                  value={endingType}
                  onChange={(e) => setEndingType(e.target.value as EndingType)}
                >
                  <option value="player-choice">Player Choice</option>
                  <option value="story-complete">Story Complete</option>
                  <option value="session-limit">Session Limit</option>
                  <option value="character-retirement">Character Retirement</option>
                </select>
              </div>

              <div>
                <label>
                  Desired Tone
                </label>
                <select
                  value={desiredTone}
                  onChange={(e) => setDesiredTone(e.target.value as EndingTone)}
                >
                  <option value="triumphant">Triumphant</option>
                  <option value="mysterious">Mysterious</option>
                  <option value="tragic">Tragic</option>
                  <option value="hopeful">Hopeful</option>
                </select>
              </div>
            </div>

            <div>
              <label>
                Custom Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter any specific instructions for the ending..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div>
              <button
                onClick={handleGenerateEnding}
                disabled={isGeneratingEnding}
              >
                {isGeneratingEnding ? 'Generating...' : 'Generate AI Ending'}
              </button>

              <button
                onClick={handleUseMockData}
              >
                Use Mock Ending Data
              </button>

              <button
                onClick={clearEnding}
                disabled={!currentEnding}
              >
                Clear Ending
              </button>
            </div>

            {/* Test Information */}
            <div>
              <h3>Test Information</h3>
              <div>
                <p><strong>Session ID:</strong> {mockSessionId}</p>
                <p><strong>Character ID:</strong> {mockCharacterId}</p>
                <p><strong>World ID:</strong> {mockWorldId}</p>
                <p><strong>Note:</strong> This test harness uses mock IDs for testing purposes.</p>
              </div>
            </div>

            {/* Error Display */}
            {endingError && (
              <div>
                <h3>Error</h3>
                <p>{endingError}</p>
              </div>
            )}

            {/* Loading State */}
            {isGeneratingEnding && (
              <div>
                <h3>Generating Ending</h3>
                <p>Please wait while we create your story ending...</p>
                <div>
                  <div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
