'use client';

import React, { useState, useEffect } from 'react';
import { World } from '@/types/world.types';
import GameSession from '@/components/GameSession/GameSession';
import { worldStore } from '@/state/worldStore';
import { sessionStore } from '@/state/sessionStore';
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

export default function GameSessionTestHarness() {
  const [showRealComponent, setShowRealComponent] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentState, setCurrentState] = useState({});
  const logger = React.useMemo(() => new Logger('GameSessionTestHarness'), []);
  
  // Set isClient to true once component mounts to avoid hydration mismatch
  useEffect(() => {
    // Set client state
    setIsClient(true);
    
    // Create test world only once on initial mount
    createTestWorld();
    
    // Reset any existing session - only once at start
    sessionStore.getState().endSession();
    
    // Get initial state
    setCurrentState({...sessionStore.getState()});
    
    // Setup state display refreshing
    const intervalId = setInterval(() => {
      setCurrentState({...sessionStore.getState()});
    }, 1000);
    
    return () => {
      // Clean up
      clearInterval(intervalId);
      // Don't end session here - it causes multiple calls
    };
  }, []);
  
  // Create mock world for testing
  const createTestWorld = () => {
    const worlds = worldStore.getState().worlds || {};
    
    // Check if world already exists
    if (!worlds[mockWorld.id]) {
      // Set the mock world in the store
      worldStore.setState({
        worlds: {
          ...worlds,
          [mockWorld.id]: mockWorld
        }
      });
    }
  };
  
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
      <h1 className="text-2xl font-bold mb-4">Game Session Test Harness</h1>
      
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
          Recreate Test World
        </button>
        
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded mb-4 ml-2"
          onClick={() => sessionStore.getState().endSession()}
        >
          Reset Session
        </button>
      </div>
      
      <div className="border p-4 rounded bg-gray-50">
        {showRealComponent ? (
          <GameSession 
            worldId={mockWorld.id}
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
          />
        ) : (
          <div>Component hidden</div>
        )}
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Current Session State</h2>
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
