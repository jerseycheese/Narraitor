'use client';

import React, { useState, useEffect } from 'react';
import { World } from '@/types/world.types';
import GameSession from '@/components/GameSession/GameSession';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import Logger from '@/lib/utils/logger';
import type { StandardInventoryCategory } from '@/types/inventory.types';
import { getTimestamp } from '@/lib/utils';

// Mock world
const mockWorld: World = {
  id: 'world-1',
  name: 'Fantasy Realm',
  description: 'A high fantasy world of magic and adventure',
  genre: 'fantasy',
  attributes: [
    {
      id: 'strength',
      name: 'Strength',
      description: 'Physical power and muscle',
      worldId: 'world-1',
      baseValue: 1,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'intelligence',
      name: 'Intelligence',
      description: 'Mental acuity and reasoning',
      worldId: 'world-1',
      baseValue: 1,
      minValue: 1,
      maxValue: 20,
    },
  ],
  skills: [
    {
      id: 'lockpicking',
      name: 'Lockpicking',
      description: 'The art of opening locks without keys',
      worldId: 'world-1',
      difficulty: 'medium',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
    },
    {
      id: 'intimidation',
      name: 'Intimidation',
      description: 'Using presence and fear to influence others',
      worldId: 'world-1',
      difficulty: 'hard',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Moving unseen and unheard',
      worldId: 'world-1',
      difficulty: 'medium',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
    },
    {
      id: 'magic',
      name: 'Magic',
      description: 'Wielding arcane forces',
      worldId: 'world-1',
      difficulty: 'hard',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
    },
    {
      id: 'persuasion',
      name: 'Persuasion',
      description: 'Convincing others through words and charm',
      worldId: 'world-1',
      difficulty: 'easy',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
    },
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z',
};

// Mock character
const mockCharacter = {
  id: 'test-character-123',
  name: 'Test Hero',
  description: 'A test character for debugging purposes',
  worldId: 'world-1',
  level: 5,
  background: {
    history: 'Born in a test harness, raised to debug',
    personality: 'Deterministic and reliable',
    goals: ['To pass all tests'],
    fears: ['Null pointer exceptions', 'Infinite loops'],
    physicalDescription: 'A well-structured test character',
    relationships: [],
  },
  portrait: {
    type: 'placeholder' as const,
    url: null,
  },
  attributes: [
    {
      id: 'attr1',
      characterId: 'test-character-123',
      worldAttributeId: 'strength',
      name: 'Strength',
      baseValue: 14,
      modifiedValue: 14,
      category: 'physical',
    },
    {
      id: 'attr2',
      characterId: 'test-character-123',
      worldAttributeId: 'intelligence',
      name: 'Intelligence',
      baseValue: 16,
      modifiedValue: 16,
      category: 'mental',
    },
  ],
  skills: [
    {
      id: 'skill1',
      characterId: 'test-character-123',
      worldSkillId: 'lockpicking',
      name: 'Lockpicking',
      level: 8,
      category: 'stealth',
    },
    {
      id: 'skill2',
      characterId: 'test-character-123',
      worldSkillId: 'intimidation',
      name: 'Intimidation',
      level: 6,
      category: 'social',
    },
    {
      id: 'skill3',
      characterId: 'test-character-123',
      worldSkillId: 'stealth',
      name: 'Stealth',
      level: 4,
      category: 'stealth',
    },
    {
      id: 'skill4',
      characterId: 'test-character-123',
      worldSkillId: 'magic',
      name: 'Magic',
      level: 9,
      category: 'arcane',
    },
    {
      id: 'skill5',
      characterId: 'test-character-123',
      worldSkillId: 'persuasion',
      name: 'Persuasion',
      level: 3,
      category: 'social',
    },
  ],
  derivedStats: [],
  isPlayer: true,
  status: {
    conditions: [],
  },
  inventory: {
    characterId: 'test-character-123',
    items: [],
    capacity: 20,
    categories: [],
    itemOrder: [],
  },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
};

type SessionStateDisplay = {
  status?: string;
  currentSceneId?: string | null;
  playerChoices?: unknown[];
  error?: string | null;
  worldId?: string | null;
  [key: string]: unknown;
};

export default function GameSessionTestHarness() {
  const [showRealComponent, setShowRealComponent] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentState, setCurrentState] = useState<SessionStateDisplay>({});
  const logger = React.useMemo(() => new Logger('GameSessionTestHarness'), []);

  // Create mock world and character for testing
  const createTestWorld = React.useCallback(() => {
    const worlds = useWorldStore.getState().worlds || {};
    const characters = useCharacterStore.getState().characters || {};

    // Only create if they don't exist
    if (!worlds[mockWorld.id]) {
      useWorldStore.setState({
        worlds: {
          ...worlds,
          [mockWorld.id]: mockWorld,
        },
      });
      logger.info('Test world created');
    }

    if (!characters[mockCharacter.id]) {
      useCharacterStore.setState({
        characters: {
          ...characters,
          [mockCharacter.id]: mockCharacter,
        },
        currentCharacterId: mockCharacter.id,
        error: null,
        loading: false,
      });
      logger.info('Test character created');
    }

    // Seed a couple of NPCs so consequence targets resolve by name in the
    // choice contract and the SceneStatus disposition labels have data (#468).
    const npcStore = useNPCStore.getState();
    const seededNpcs = [
      { id: 'npc-marta', name: 'Marta' },
      { id: 'npc-guard-bren', name: 'Guard Bren' },
    ];
    const missingNpcs = seededNpcs.filter((npc) => !npcStore.npcs[npc.id]);
    if (missingNpcs.length > 0) {
      const now = getTimestamp();
      useNPCStore.setState((state) => ({
        npcs: {
          ...state.npcs,
          ...Object.fromEntries(
            missingNpcs.map((npc) => [
              npc.id,
              { ...npc, description: 'Dev harness NPC', worldId: mockWorld.id, createdAt: now, updatedAt: now },
            ])
          ),
        },
        worldNpcs: {
          ...state.worldNpcs,
          [mockWorld.id]: [
            ...(state.worldNpcs[mockWorld.id] ?? []),
            ...missingNpcs.map((npc) => npc.id),
          ],
        },
      }));
      logger.info('Test NPCs created');
    }
  }, [logger]);

  // Add test inventory items to simulate starting inventory
  const addTestInventoryItems = React.useCallback(() => {
    const inventoryStore = useInventoryStore.getState();

    // Clear existing inventory first
    inventoryStore.clearCharacterInventory(mockCharacter.id);

    // Add various test items across categories
    const createAcquisition = (quantity: number = 1) => ({
      acquiredAt: new Date().toISOString(),
      method: 'manual' as const,
      quantity,
    });

    const createCategorization = (categoryId: StandardInventoryCategory) => ({
      categoryId,
      source: 'system' as const,
      classifiedAt: new Date().toISOString(),
      confidence: 0.9,
    });

    inventoryStore.addItem(mockCharacter.id, {
      name: 'Steel Sword',
      description: 'A well-crafted blade',
      quantity: 1,
      stackable: false,
      categorization: createCategorization('equipment'),
      acquisition: createAcquisition(1),
    });

    inventoryStore.addItem(mockCharacter.id, {
      name: 'Health Potions',
      description: 'Restores 50 HP',
      quantity: 5,
      stackable: true,
      maxStack: 10,
      categorization: createCategorization('consumables'),
      acquisition: createAcquisition(5),
    });

    inventoryStore.addItem(mockCharacter.id, {
      name: 'Gold Coins',
      description: 'Currency',
      quantity: 150,
      stackable: true,
      maxStack: 999,
      categorization: createCategorization('valuables'),
      acquisition: createAcquisition(150),
    });

    inventoryStore.addItem(mockCharacter.id, {
      name: 'Ancient Map',
      description: 'Shows locations',
      quantity: 1,
      stackable: false,
      categorization: createCategorization('documents'),
      acquisition: createAcquisition(1),
    });

    inventoryStore.addItem(mockCharacter.id, {
      name: 'Magic Ring',
      description: 'Quest item - glows faintly',
      quantity: 1,
      stackable: false,
      categorization: createCategorization('quest-items'),
      acquisition: createAcquisition(1),
    });

    logger.info('Test inventory items added');
  }, [logger]);

  // Set isClient to true once component mounts to avoid hydration mismatch
  useEffect(() => {
    // Set client state
    setIsClient(true);

    // Create test world only once on initial mount
    createTestWorld();

    // Add test inventory items after persistence hydrates so test data is consistent
    const inventoryPersist = (
      useInventoryStore as unknown as {
        persist?: {
          hasHydrated?: () => boolean;
          onFinishHydration?: (callback: () => void) => () => void;
        };
      }
    ).persist;
    let unsubscribeHydration: (() => void) | undefined;

    const seedInventoryOnce = () => {
      unsubscribeHydration?.();
      unsubscribeHydration = undefined;
      addTestInventoryItems();
    };

    if (inventoryPersist?.hasHydrated?.()) {
      seedInventoryOnce();
    } else if (inventoryPersist?.onFinishHydration) {
      unsubscribeHydration =
        inventoryPersist.onFinishHydration(seedInventoryOnce);
    } else {
      seedInventoryOnce();
    }

    // Don't auto-start sessions - let the GameSession component handle it
    // This prevents conflicts between test harness and component initialization
    logger.info(
      'Test harness ready - GameSession component will handle session initialization'
    );

    // Get initial state
    setCurrentState({ ...useSessionStore.getState() });

    // Setup state display refreshing
    const intervalId = setInterval(() => {
      setCurrentState({ ...useSessionStore.getState() });
    }, 1000);

    return () => {
      // Clean up
      clearInterval(intervalId);
      unsubscribeHydration?.();
    };
  }, [createTestWorld, addTestInventoryItems, logger]);

  const handleSessionStart = () => {
    logger.info('Session started');
  };

  const handleSessionEnd = () => {
    logger.info('Session ended');
    setShowRealComponent(false);
  };

  if (!isClient) {
    // Return loading placeholder to avoid hydration mismatch
    return (
      <div>
        <h1>Game Session Test Harness</h1>
        <div>Loading test harness...</div>
      </div>
    );
  }

  return (
    <div className="game-session-test-harness">
      {!showRealComponent && (
        <>
          <h2>Game Session Test Harness</h2>

          <div>
            <button onClick={() => setShowRealComponent(true)}>
              Show Component
            </button>
          </div>

          <div>
            <button onClick={createTestWorld}>
              Ensure Test World & Character Exist
            </button>

            <button
              onClick={() => {
                logger.info('Starting new session');
                const store = useSessionStore.getState();
                if (store.initializeSession) {
                  store.initializeSession(
                    mockWorld.id,
                    mockCharacter.id,
                    handleSessionStart
                  );
                } else {
                  logger.error('initializeSession method not found');
                }
              }}
            >
              Start Session
            </button>

            <button
              onClick={() => {
                logger.info('Ending session');
                useSessionStore.getState().endSession();
              }}
            >
              End Session
            </button>

            <button
              onClick={() => {
                logger.info('Resetting all session and narrative state');

                useSessionStore.setState({
                  id: null,
                  status: 'initializing',
                  currentSceneId: null,
                  playerChoices: [],
                  error: null,
                  worldId: null,
                  characterId: null,
                  savedSessions: {},
                  autoSave: {
                    enabled: true,
                    lastSaveTime: null,
                    status: 'idle',
                    errorMessage: null,
                    totalSaves: 0,
                  },
                });

                const narrativeStore = useNarrativeStore.getState();
                narrativeStore.reset();
                narrativeStore.clearEnding();

                useCharacterStore.getState().setCurrentCharacter(mockCharacter.id);

                setTimeout(() => {
                  logger.info('Forcing page refresh for complete reset');
                  window.location.reload();
                }, 500);
              }}
            >
              Reset State & Refresh
            </button>
          </div>

          <div>
            <h2>Current Session State</h2>
            <p>
              Status:{' '}
              <span>{currentState.status || 'unknown'}</span>
            </p>
            <p>
              Store methods:{' '}
              {Object.keys(useSessionStore.getState())
                .filter((key) => {
                  const value =
                    useSessionStore.getState()[
                      key as keyof typeof useSessionStore.getState
                    ];
                  return typeof value === 'function';
                })
                .join(', ')}
            </p>
            <div>
              {JSON.stringify(currentState, null, 2)}
            </div>
          </div>

          <div>
            <h2>Test World Data</h2>
            <div>
              {JSON.stringify(mockWorld, null, 2)}
            </div>
          </div>
        </>
      )}

      {showRealComponent && (
        <GameSession
          worldId={mockWorld.id}
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
        />
      )}
    </div>
  );
}
