// src/app/dev/ending-system/page.tsx

'use client';

import React, { useState } from 'react';
import { EndingScreen } from '../../../components/GameSession/EndingScreen';
import { useNarrativeStore } from '../../../state/narrativeStore';
import type { EndingType, EndingTone, StoryEnding } from '../../../types/narrative.types';

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
    epilogue: `As the sun set over the kingdom, our brave hero ${endingType === 'character-retirement' ? 'decided to lay down their sword and live peacefully' : 'stood victorious after their great adventure'}. The journey that began with uncertainty ended with ${desiredTone === 'tragic' ? 'great sacrifice' : desiredTone === 'bittersweet' ? 'mixed emotions' : 'celebration'}.

The lands would remember this day for generations to come, when a simple adventurer became the ${desiredTone === 'mysterious' ? 'enigmatic figure of legend' : 'hero the realm needed'}. Through trials and tribulations, they proved that courage and determination can overcome any obstacle.

As the stars began to twinkle in the evening sky, our hero ${endingType === 'character-retirement' ? 'smiled peacefully, knowing their adventuring days were behind them' : 'looked toward the horizon, ready for whatever adventures lay ahead'}.`,
    characterLegacy: `The hero's name would be spoken with ${desiredTone === 'tragic' ? 'solemn respect' : 'admiration'} throughout the realm. Their ${endingType === 'character-retirement' ? 'wise decision to step away at the peak of their power' : 'incredible journey from humble beginnings to legendary status'} inspired countless others to pursue their own adventures.

Young warriors would train hoping to follow in their footsteps, and bards would sing songs of their ${desiredTone === 'mysterious' ? 'enigmatic deeds' : 'heroic exploits'} for centuries to come.`,
    worldImpact: `The realm was forever changed by the hero's actions. ${endingType === 'story-complete' ? 'With the main quest completed, peace returned to the land' : endingType === 'character-retirement' ? 'The hero\'s retirement marked the end of an era' : 'The adventure\'s conclusion brought new possibilities'}.

Trade routes reopened, alliances were strengthened, and the people looked toward the future with ${desiredTone === 'hopeful' ? 'unbridled optimism' : desiredTone === 'tragic' ? 'cautious hope despite their losses' : 'renewed confidence'}. The world had been saved, and all knew that heroes like this one would always rise when needed.`,
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    achievements: [
      'Legendary Hero',
      'Realm Protector',
      `${endingType === 'character-retirement' ? 'Peaceful Retirement' : 'Quest Complete'}`,
      `${desiredTone.charAt(0).toUpperCase() + desiredTone.slice(1)} Ending`,
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Ending System Test Harness
          </h1>
          
          <div className="space-y-6">
            {/* Status Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h2>
              <div className="space-y-2">
                <p><strong>Is Generating:</strong> {isGeneratingEnding ? 'Yes' : 'No'}</p>
                <p><strong>Has Ending:</strong> {currentEnding ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {endingError || 'None'}</p>
              </div>
            </div>

            {/* Test Controls */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ending Type
                </label>
                <select
                  value={endingType}
                  onChange={(e) => setEndingType(e.target.value as EndingType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="player-choice">Player Choice</option>
                  <option value="story-complete">Story Complete</option>
                  <option value="session-limit">Session Limit</option>
                  <option value="character-retirement">Character Retirement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Tone
                </label>
                <select
                  value={desiredTone}
                  onChange={(e) => setDesiredTone(e.target.value as EndingTone)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="triumphant">Triumphant</option>
                  <option value="bittersweet">Bittersweet</option>
                  <option value="mysterious">Mysterious</option>
                  <option value="tragic">Tragic</option>
                  <option value="hopeful">Hopeful</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter any specific instructions for the ending..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleGenerateEnding}
                disabled={isGeneratingEnding}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingEnding ? 'Generating...' : 'Generate AI Ending'}
              </button>

              <button
                onClick={handleUseMockData}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Use Mock Ending Data
              </button>

              <button
                onClick={clearEnding}
                disabled={!currentEnding}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear Ending
              </button>
            </div>

            {/* Test Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Session ID:</strong> {mockSessionId}</p>
                <p><strong>Character ID:</strong> {mockCharacterId}</p>
                <p><strong>World ID:</strong> {mockWorldId}</p>
                <p><strong>Note:</strong> This test harness uses mock IDs for testing purposes.</p>
              </div>
            </div>

            {/* Error Display */}
            {endingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                <p className="text-red-800">{endingError}</p>
              </div>
            )}

            {/* Loading State */}
            {isGeneratingEnding && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Generating Ending</h3>
                <p className="text-yellow-800">Please wait while we create your story ending...</p>
                <div className="mt-2">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded bg-yellow-200 h-2 w-1/4"></div>
                    <div className="rounded bg-yellow-200 h-2 w-1/2"></div>
                    <div className="rounded bg-yellow-200 h-2 w-1/4"></div>
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