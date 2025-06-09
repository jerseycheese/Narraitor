'use client';

import React from 'react';
import ActiveGameSession from '@/components/GameSession/ActiveGameSession';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';

/**
 * Test Harness for Issue #278: Journal Access During Gameplay
 * Stage 2 Verification: Integration testing with realistic data
 * 
 * Interactive Features:
 * - Toggle character presence
 * - Add/remove journal entries
 * - Change game session status
 * - Test journal modal functionality
 * - Verify state preservation
 */
export default function JournalAccessTestPage() {
  const [hasCharacter, setHasCharacter] = React.useState(true);
  const [gameStatus, setGameStatus] = React.useState<'active' | 'paused' | 'ended'>('active');
  const [entryCount, setEntryCount] = React.useState(2);

  // Setup stores
  React.useEffect(() => {
    if (hasCharacter) {
      useSessionStore.setState({
        characterId: 'test-char-1',
        id: 'test-session-1',
        status: gameStatus,
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'test-world-1',
        savedSessions: {}
      });
      
      useCharacterStore.setState({
        characters: {
          'test-char-1': {
            id: 'test-char-1',
            name: 'Test Adventurer',
            worldId: 'test-world-1',
            background: 'A brave explorer testing journal access',
            createdAt: new Date().toISOString()
          }
        },
        currentCharacterId: 'test-char-1',
        error: null,
        loading: false
      });
    } else {
      useSessionStore.setState({
        characterId: null,
        id: 'test-session-1',
        status: gameStatus,
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'test-world-1',
        savedSessions: {}
      });
      
      useCharacterStore.setState({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false
      });
    }
  }, [hasCharacter, gameStatus]);

  // Setup journal entries
  React.useEffect(() => {
    const { addEntry, reset } = useJournalStore.getState();
    reset();
    
    const mockEntries: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>[] = [
      {
        worldId: 'test-world-1',
        characterId: 'test-char-1',
        type: 'character_event',
        title: 'Started Testing',
        content: 'Began testing the journal access functionality in the test harness.',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['testing'], automaticEntry: true }
      },
      {
        worldId: 'test-world-1',
        characterId: 'test-char-1',
        type: 'discovery',
        title: 'Found Test Environment',
        content: 'Discovered this wonderful test harness for journal functionality.',
        significance: 'minor',
        isRead: true,
        relatedEntities: [],
        metadata: { tags: ['discovery'], automaticEntry: true }
      },
      {
        worldId: 'test-world-1',
        characterId: 'test-char-1',
        type: 'achievement',
        title: 'Passed All Tests',
        content: 'Successfully verified all acceptance criteria for issue #278.',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['success'], automaticEntry: true }
      }
    ];

    for (let i = 0; i < entryCount && i < mockEntries.length; i++) {
      addEntry('test-session-1', mockEntries[i]);
    }
  }, [entryCount]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Controls */}
      <div className="bg-white shadow-md p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          📖 Journal Access Test Harness - Issue #278
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Character Toggle */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Character Presence</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hasCharacter}
                onChange={(e) => setHasCharacter(e.target.checked)}
                className="rounded"
              />
              <span>Has Character (AC1: button visibility)</span>
            </label>
          </div>

          {/* Game Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Game Status</h3>
            <select
              value={gameStatus}
              onChange={(e) => setGameStatus(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="active">Active (AC3: available at any point)</option>
              <option value="paused">Paused (AC3: available at any point)</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          {/* Journal Entries */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Journal Entries</h3>
            <input
              type="range"
              min="0"
              max="3"
              value={entryCount}
              onChange={(e) => setEntryCount(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{entryCount} entries</span>
          </div>
        </div>

        {/* Acceptance Criteria Checklist */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">✅ Acceptance Criteria Testing</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>🎯 <strong>AC1:</strong> Journal button visible when character present</li>
            <li>🎯 <strong>AC2:</strong> Game state preserved when journal opened</li>
            <li>🎯 <strong>AC3:</strong> Journal available during active/paused status</li>
            <li>🎯 <strong>AC4:</strong> Smooth modal transition with proper accessibility</li>
            <li>🎯 <strong>AC5:</strong> Narrative components remain functional when journal open</li>
          </ul>
        </div>
      </div>

      {/* Game Session Component */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <ActiveGameSession
            worldId="test-world-1"
            sessionId="test-session-1"
            status={gameStatus}
            onChoiceSelected={(choiceId) => console.log('Choice selected:', choiceId)}
            onEnd={() => console.log('Session ended')}
          />
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="bg-gray-100 p-6 border-t">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-3">🧪 Testing Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Interactive Tests:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Toggle character presence to test AC1</li>
                <li>• Change game status to test AC3</li>
                <li>• Adjust entry count to test different journal states</li>
                <li>• Click journal button to test AC4 (smooth transition)</li>
                <li>• Verify AC2: game state preserved during journal access</li>
                <li>• Check AC5: narrative components remain visible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Expected Behavior:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Journal button appears only with character</li>
                <li>• Modal opens with role="dialog" and aria-modal="true"</li>
                <li>• Journal entries display correctly</li>
                <li>• Close button works (multiple ways: X, backdrop, Escape)</li>
                <li>• Game session remains intact throughout</li>
                <li>• Accessibility features work properly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}