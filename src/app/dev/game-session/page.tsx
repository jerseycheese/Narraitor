'use client';

import React, { useState, useEffect } from 'react';
import { World } from '@/types/world.types';
import GameSession from '@/components/GameSession/GameSession';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import Logger from '@/lib/utils/logger';

// Mock world
const mockWorld: World = {
  id: 'world-1',
  name: 'Fantasy Realm',
  description: 'A high fantasy world of magic and adventure',
  theme: 'Fantasy',
  attributes: [],
  skills: [],
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
    relationships: []
  },
  portrait: {
    type: 'placeholder' as const,
    url: null
  },
  attributes: [],
  skills: [],
  isPlayer: true,
  status: {
    health: 100,
    maxHealth: 100,
    conditions: []
  },
  inventory: {
    characterId: 'test-character-123',
    items: [],
    capacity: 20,
    categories: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
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
          [mockWorld.id]: mockWorld
        }
      });
      logger.info('Test world created');
    }
    
    if (!characters[mockCharacter.id]) {
      useCharacterStore.setState({
        characters: {
          ...characters,
          [mockCharacter.id]: mockCharacter
        }
      });
      logger.info('Test character created');
    }
  }, [logger]);
  
  // Set isClient to true once component mounts to avoid hydration mismatch
  useEffect(() => {
    // Set client state
    setIsClient(true);
    
    // Create test world only once on initial mount
    createTestWorld();
    
    // Get initial state
    setCurrentState({...useSessionStore.getState()});
    
    // Setup state display refreshing
    const intervalId = setInterval(() => {
      setCurrentState({...useSessionStore.getState()});
    }, 1000);
    
    return () => {
      // Clean up
      clearInterval(intervalId);
    };
  }, [createTestWorld]);
  
  const handleSessionStart = () => {
    logger.info('Session started');
  };
  
  const handleSessionEnd = () => {
    logger.info('Session ended');
  };
  
  if (!isClient) {
    // Return loading placeholder to avoid hydration mismatch
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Game Session Test Harness</h1>
        <div>Loading test harness...</div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Game Session Test Harness</h2>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
          onClick={() => setShowRealComponent(!showRealComponent)}
        >
          {showRealComponent ? 'Hide Component' : 'Show Component'}
        </button>
      </div>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded mb-4"
          onClick={createTestWorld}
        >
          Ensure Test World & Character Exist
        </button>
        
        <button 
          className="px-4 py-2 bg-yellow-500 text-white rounded mb-4 ml-2"
          onClick={() => {
            // Initialize a new session
            logger.info('Starting new session');
            const store = useSessionStore.getState();
            if (store.initializeSession) {
              // Use the test character ID
              store.initializeSession(mockWorld.id, mockCharacter.id, handleSessionStart);
            } else {
              logger.error('initializeSession method not found');
            }
          }}
        >
          Start Session
        </button>
        
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded mb-4 ml-2"
          onClick={() => {
            // End current session only
            logger.info('Ending session');
            useSessionStore.getState().endSession();
          }}
        >
          End Session
        </button>
      </div>
      
      <div className="border p-4 rounded bg-gray-50">
        {showRealComponent ? (
          <GameSession 
            worldId={mockWorld.id}
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
            disableAutoResume={true}
          />
        ) : (
          <div>Component hidden</div>
        )}
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Current Session State</h2>
        <p className="text-sm text-gray-600 mb-2">
          Status: <span className="font-bold">{currentState.status || 'unknown'}</span>
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Store methods: {Object.keys(useSessionStore.getState()).filter(key => {
            const value = useSessionStore.getState()[key as keyof typeof useSessionStore.getState];
            return typeof value === 'function';
          }).join(', ')}
        </p>
        <div className="bg-slate-800 text-slate-100 p-4 rounded overflow-auto font-mono text-xs whitespace-pre">
          {JSON.stringify(currentState, null, 2)}
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Test World Data</h2>
        <div className="bg-slate-800 text-slate-100 p-4 rounded overflow-auto font-mono text-xs whitespace-pre">
          {JSON.stringify(mockWorld, null, 2)}
        </div>
      </div>
    </div>
  );
}
