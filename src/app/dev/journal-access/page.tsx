'use client';

import React from 'react';
import ActiveGameSession from '@/components/GameSession/ActiveGameSession';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { JournalEntry } from '@/types/journal.types';
import { getTimestamp } from '@/lib/utils';

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
  const [entryCount, setEntryCount] = React.useState(3);

  // Setup stores
  React.useEffect(() => {
    // Clear any existing ending state from narrative store
    useNarrativeStore.getState().clearEnding();
    
    // Clear the "ended sessions" record for our test session to ensure it's not marked as ended
    useNarrativeStore.setState((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { 'test-session-1': removed, ...remainingEndedSessions } = state.endedSessions;
      return {
        ...state,
        endedSessions: remainingEndedSessions
      };
    });
    
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
      
      const timestamp = getTimestamp();
      const testCharacter = {
        id: 'test-char-1',
        name: 'Test Adventurer',
        description: 'A brave explorer testing journal access functionality',
        worldId: 'test-world-1',
        level: 1,
        isPlayer: true,
        attributes: [],
        skills: [],
        background: {
          history: 'A brave explorer testing journal access',
          personality: 'Curious and methodical',
          goals: ['Master the journal system'],
          fears: ['Missing important story details'],
          physicalDescription: 'A determined adventurer with keen eyes',
          relationships: [],
          isKnownFigure: false
        },
        inventory: {
          characterId: 'test-char-1',
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
        createdAt: timestamp,
        updatedAt: timestamp
      };

      useCharacterStore.setState({
        characters: {
          'test-char-1': testCharacter
        },
        entities: {
          'test-char-1': testCharacter
        },
        currentCharacterId: 'test-char-1',
        currentEntityId: 'test-char-1',
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
        entities: {},
        currentCharacterId: null,
        currentEntityId: null,
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
        title: 'First Day at Work',
        content: 'Started my work shift at the video store today.',
        detailedContent: 'Opened the store for another shift. Same fluorescent lights, same carpet cleaner smell. Customers still ignore movie recommendations.',
        significance: 'minor',
        isRead: false,
        relatedEntities: [{ id: 'loc-1', type: 'location', name: 'Video Store' }],
        metadata: { tags: ['opening', 'introduction', 'work'], automaticEntry: true },
        updatedAt: getTimestamp()
      },
      {
        worldId: 'test-world-1',
        characterId: 'test-char-1',
        type: 'world_event',
        title: 'Unexpected Encounter',
        content: 'I questioned a caller about the nature of their problem, learning it concerns a missing package.',
        detailedContent: 'Customer called about missing Citizen Kane rental. Complained for twenty minutes about Orson Welles. Found it in their car after checking. Marco dealt with another difficult customer around the same time.',
        significance: 'minor',
        isRead: true,
        relatedEntities: [
          { id: 'char-2', type: 'character', name: 'Marco' },
          { id: 'char-3', type: 'character', name: 'Angry Customer' }
        ],
        metadata: { tags: ['dialogue', 'employee', 'customer-service'], automaticEntry: true },
        updatedAt: getTimestamp()
      },
      {
        worldId: 'test-world-1',
        characterId: 'test-char-1',
        type: 'decision',
        title: 'Help the Stranger',
        content: 'Chose to help the stranger when you encounter a suspicious person at the tavern',
        detailedContent: 'A cloaked figure approached asking about rare books. Despite their suspicious appearance, I decided to provide directions to the library. This could lead to interesting developments.',
        significance: 'major',
        isRead: false,
        relatedEntities: [
          { id: 'char-4', type: 'character', name: 'Cloaked Stranger' },
          { id: 'loc-2', type: 'location', name: 'Village Tavern' }
        ],
        metadata: { 
          tags: ['decision', 'stranger', 'tavern'], 
          automaticEntry: true,
          decisionId: 'decision-help-stranger',
          choiceText: 'Help the stranger',
          decisionPrompt: 'You encounter a suspicious person at the tavern. What do you do?'
        },
        updatedAt: getTimestamp()
      },
      {
        worldId: 'test-world-1',
        characterId: 'test-char-1',
        type: 'discovery',
        title: 'The Choice That Changed Everything',
        content: 'Learned a package, meant to arrive before the Myposian...',
        detailedContent: 'Organized Staff Picks section. Realized I\'m stuck in the same routine every day. Same store, same complaints about late fees. Considered not coming back tomorrow.',
        significance: 'critical',
        isRead: false,
        relatedEntities: [{ id: 'item-1', type: 'item', name: 'Staff Picks Display' }],
        metadata: { tags: ['browsing', 'selection', 'life-decision', 'epiphany'], automaticEntry: true },
        updatedAt: getTimestamp()
      }
    ];

    for (let i = 0; i < entryCount && i < mockEntries.length; i++) {
      addEntry('test-session-1', mockEntries[i]);
    }
  }, [entryCount]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test Controls */}
      <div className="bg-white shadow-md p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          📖 Journal Access Test Harness - Issue #278
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              onChange={(e) => setGameStatus(e.target.value as 'active' | 'paused' | 'ended')}
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
              max="4"
              value={entryCount}
              onChange={(e) => setEntryCount(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-700">{entryCount} entries</span>
          </div>
          
          {/* Journal Controls */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Journal Debug</h3>
            <button
              onClick={() => {
                // Clear existing journal entries for this session
                useJournalStore.getState().reset();
                // Force re-creation with proper content
                setEntryCount(0);
                setTimeout(() => setEntryCount(3), 100);
              }}
              className="w-full px-3 py-2 bg-amber-500 text-white rounded text-sm hover:bg-amber-500"
            >
              Clear & Regenerate Journal
            </button>
          </div>
        </div>

        {/* Acceptance Criteria Checklist */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">✅ Acceptance Criteria Testing</h3>
          <ul className="text-sm text-blue-900 space-y-1">
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
              <h4 className="font-medium text-gray-900 mb-2">Interactive Tests:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Toggle character presence to test AC1</li>
                <li>• Change game status to test AC3</li>
                <li>• Adjust entry count to test different journal states</li>
                <li>• Click journal button to test AC4 (smooth transition)</li>
                <li>• Verify AC2: game state preserved during journal access</li>
                <li>• Check AC5: narrative components remain visible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Expected Behavior:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Journal button appears only with character</li>
                <li>• Modal opens with role=&quot;dialog&quot; and aria-modal=&quot;true&quot;</li>
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
