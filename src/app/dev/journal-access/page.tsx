'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ActiveGameSession from '@/components/GameSession/ActiveGameSession';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import { JournalEntry } from '@/types/journal.types';
import { getTimestamp } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('JournalAccessDev');

/**
 * Test Harness for Issue #278: Journal Access During Gameplay
 * Stage 2 Verification: Integration testing with realistic data
 *
 * Interactive Features:
 * - Toggle character presence
 * - Add/remove journal entries
 * - Change game session status
 * - Test journal page navigation
 * - Verify state preservation
 */
export default function JournalAccessTestPage() {
  const [hasCharacter, setHasCharacter] = React.useState(true);
  const [gameStatus, setGameStatus] = React.useState<
    'active' | 'paused' | 'ended'
  >('active');
  const [entryCount, setEntryCount] = React.useState(3);
  const router = useRouter();

  // Setup stores
  React.useEffect(() => {
    // Clear any existing ending state from narrative store
    useNarrativeStore.getState().clearEnding();

    // Clear the "ended sessions" record for our test session to ensure it's not marked as ended
    useNarrativeStore.setState((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { 'test-session-1': removed, ...remainingEndedSessions } =
        state.endedSessions;
      return {
        ...state,
        endedSessions: remainingEndedSessions,
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
        savedSessions: {},
      });

      const timestamp = getTimestamp();
      const testWorld = {
        id: 'test-world-1',
        name: 'Test World',
        description: 'A lightweight world for journal testing.',
        genre: 'modern' as const,
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 12,
          skillPointPool: 10,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const testCharacter = {
        id: 'test-char-1',
        name: 'Test Adventurer',
        description: 'A brave explorer testing journal access functionality',
        worldId: 'test-world-1',
        level: 1,
        isPlayer: true,
        attributes: [],
        skills: [],
        derivedStats: [],
        background: {
          history: 'A brave explorer testing journal access',
          personality: 'Curious and methodical',
          goals: ['Master the journal system'],
          fears: ['Missing important story details'],
          physicalDescription: 'A determined adventurer with keen eyes',
          relationships: [],
          isKnownFigure: false,
        },
        inventory: {
          characterId: 'test-char-1',
          items: [],
          capacity: 10,
          categories: [],
          itemOrder: [],
        },
        status: {
          conditions: [],
          location: 'Test Area',
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      useCharacterStore.setState({
        characters: {
          'test-char-1': testCharacter,
        },
        currentCharacterId: 'test-char-1',
        error: null,
        loading: false,
      });

      useWorldStore.setState({
        worlds: { 'test-world-1': testWorld },
        entities: { 'test-world-1': testWorld },
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
        savedSessions: {},
      });

      useCharacterStore.setState({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false,
      });

      useWorldStore.setState({
        worlds: {},
        entities: {},
      });
    }
  }, [hasCharacter, gameStatus]);

  // Setup journal entries
  React.useEffect(() => {
    const { addEntry, reset } = useJournalStore.getState();
    reset();

    const mockEntries: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>[] =
      [
        {
          worldId: 'test-world-1',
          characterId: 'test-char-1',
          type: 'character_event',
          title: 'First Day at Work',
          content: 'Started my work shift at the video store today.',
          detailedContent:
            'Opened the store for another shift. Same fluorescent lights, same carpet cleaner smell. Customers still ignore movie recommendations.',
          significance: 'minor',
          isRead: false,
          relatedEntities: [
            { id: 'loc-1', type: 'location', name: 'Video Store' },
          ],
          metadata: {
            tags: ['opening', 'introduction', 'work'],
            automaticEntry: true,
          },
          updatedAt: getTimestamp(),
        },
        {
          worldId: 'test-world-1',
          characterId: 'test-char-1',
          type: 'world_event',
          title: 'Unexpected Encounter',
          content:
            'I questioned a caller about the nature of their problem, learning it concerns a missing package.',
          detailedContent:
            'Customer called about missing Citizen Kane rental. Complained for twenty minutes about Orson Welles. Found it in their car after checking. Marco dealt with another difficult customer around the same time.',
          significance: 'minor',
          isRead: true,
          relatedEntities: [
            { id: 'char-2', type: 'character', name: 'Marco' },
            { id: 'char-3', type: 'character', name: 'Angry Customer' },
          ],
          metadata: {
            tags: ['dialogue', 'employee', 'customer-service'],
            automaticEntry: true,
          },
          updatedAt: getTimestamp(),
        },
        {
          worldId: 'test-world-1',
          characterId: 'test-char-1',
          type: 'decision',
          title: 'Help the Stranger',
          content:
            'Chose to help the stranger when you encounter a suspicious person at the tavern',
          detailedContent:
            'A cloaked figure approached asking about rare books. Despite their suspicious appearance, I decided to provide directions to the library. This could lead to interesting developments.',
          significance: 'major',
          isRead: false,
          relatedEntities: [
            { id: 'char-4', type: 'character', name: 'Cloaked Stranger' },
            { id: 'loc-2', type: 'location', name: 'Village Tavern' },
          ],
          metadata: {
            tags: ['decision', 'stranger', 'tavern'],
            automaticEntry: true,
            decisionId: 'decision-help-stranger',
            choiceText: 'Help the stranger',
            decisionPrompt:
              'You encounter a suspicious person at the tavern. What do you do?',
          },
          updatedAt: getTimestamp(),
        },
        {
          worldId: 'test-world-1',
          characterId: 'test-char-1',
          type: 'discovery',
          title: 'The Choice That Changed Everything',
          content: 'Learned a package, meant to arrive before the Myposian...',
          detailedContent:
            "Organized Staff Picks section. Realized I'm stuck in the same routine every day. Same store, same complaints about late fees. Considered not coming back tomorrow.",
          significance: 'critical',
          isRead: false,
          relatedEntities: [
            { id: 'item-1', type: 'item', name: 'Staff Picks Display' },
          ],
          metadata: {
            tags: ['browsing', 'selection', 'life-decision', 'epiphany'],
            automaticEntry: true,
          },
          updatedAt: getTimestamp(),
        },
      ];

    for (let i = 0; i < entryCount && i < mockEntries.length; i++) {
      addEntry('test-session-1', mockEntries[i]);
    }
  }, [entryCount]);

  return (
    <div>
      {/* Test Controls */}
      <div>
        <h1>
          📖 Journal Access Test Harness - Issue #278
        </h1>

        <div>
          {/* Character Toggle */}
          <div>
            <h3>Character Presence</h3>
            <label>
              <input
                type="checkbox"
                checked={hasCharacter}
                onChange={(e) => setHasCharacter(e.target.checked)}
              />
              <span>Has Character (AC1: button visibility)</span>
            </label>
          </div>

          {/* Game Status */}
          <div>
            <h3>Game Status</h3>
            <select
              value={gameStatus}
              onChange={(e) =>
                setGameStatus(e.target.value as 'active' | 'paused' | 'ended')
              }
            >
              <option value="active">
                Active (AC3: available at any point)
              </option>
              <option value="paused">
                Paused (AC3: available at any point)
              </option>
              <option value="ended">Ended</option>
            </select>
          </div>

          {/* Journal Entries */}
          <div>
            <h3>Journal Entries</h3>
            <input
              type="range"
              min="0"
              max="4"
              value={entryCount}
              onChange={(e) => setEntryCount(parseInt(e.target.value))}
            />
            <span>{entryCount} entries</span>
          </div>

          {/* Journal Controls */}
          <div>
            <h3>Journal Debug</h3>
            <button
              onClick={() => router.push('/worlds/test-world-1/play/journal')}
            >
              Open Journal Page
            </button>
            <button
              onClick={() => {
                useJournalStore.getState().reset();
                // Force re-creation with proper content
                setEntryCount(0);
                setTimeout(() => setEntryCount(3), 100);
              }}
            >
              Clear & Regenerate Journal
            </button>
          </div>
        </div>

        {/* Acceptance Criteria Checklist */}
        <div>
          <h3>
            ✅ Acceptance Criteria Testing
          </h3>
          <ul>
            <li>
              🎯 <strong>AC1:</strong> Journal button visible when character
              present
            </li>
            <li>
              🎯 <strong>AC2:</strong> Game state preserved when journal opened
            </li>
            <li>
              🎯 <strong>AC3:</strong> Journal available during active/paused
              status
            </li>
            <li>
              🎯 <strong>AC4:</strong> Smooth page transition with proper
              accessibility
            </li>
            <li>
              🎯 <strong>AC5:</strong> Narrative components remain functional
              when journal open
            </li>
          </ul>
        </div>
      </div>

      {/* Game Session Component */}
      <div>
        <div>
          <ActiveGameSession
            worldId="test-world-1"
            sessionId="test-session-1"
            status={gameStatus}
            onChoiceSelected={(choiceId) =>
              logger.debug('Choice selected:', choiceId)
            }
          />
        </div>
      </div>

      {/* Testing Instructions */}
      <div>
        <div>
          <h3>
            🧪 Testing Instructions
          </h3>
          <div>
            <div>
              <h4>
                Interactive Tests:
              </h4>
              <ul>
                <li>• Toggle character presence to test AC1</li>
                <li>• Change game status to test AC3</li>
                <li>• Adjust entry count to test different journal states</li>
                <li>• Click journal button to test AC4 (page transition)</li>
                <li>
                  • Verify AC2: game state preserved during journal access
                </li>
                <li>• Check AC5: narrative components remain visible</li>
              </ul>
            </div>
            <div>
              <h4>
                Expected Behavior:
              </h4>
              <ul>
                <li>• Journal button appears only with character</li>
                <li>• Journal opens as a full-page view</li>
                <li>• Journal entries display correctly</li>
                <li>• Back navigation returns to gameplay</li>
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
