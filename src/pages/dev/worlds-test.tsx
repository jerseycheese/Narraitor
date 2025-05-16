'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { worldStore } from '../../state/worldStore';
import { generateUniqueId } from '../../lib/utils/generateId';
import { World } from '../../types/world.types';

export default function WorldsTestPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [worldsText, setWorldsText] = useState('');

  useEffect(() => {
    // Get the current worlds
    const state = worldStore.getState();
    setWorlds(Object.values(state.worlds || {}));
    
    // Convert to text for display
    setWorldsText(JSON.stringify(state.worlds || {}, null, 2));
    
    // Subscribe to changes
    const unsubscribe = worldStore.subscribe(() => {
      const newState = worldStore.getState();
      setWorlds(Object.values(newState.worlds || {}));
      setWorldsText(JSON.stringify(newState.worlds || {}, null, 2));
    });
    
    return () => unsubscribe();
  }, []);

  const handleCreateTestWorld = () => {
    // Create a test world directly
    const worldId = generateUniqueId('world');
    const now = new Date().toISOString();
    
    const world = {
      id: worldId,
      name: 'Test World ' + new Date().toLocaleTimeString(),
      description: 'A test world created directly',
      theme: 'Western',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 30,
        skillPointPool: 36
      },
      createdAt: now,
      updatedAt: now
    };
    
    // Add to store
    worldStore.setState((state) => {
      // Make sure worlds object exists
      const worlds = state.worlds || {};
      
      return {
        ...state,
        worlds: {
          ...worlds,
          [worldId]: world
        }
      };
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Worlds Test Page</h1>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          onClick={handleCreateTestWorld}
        >
          Create Test World
        </button>
        
        <Link href="/dev/template-selector" className="px-4 py-2 bg-gray-500 text-white rounded">
          Go to Template Selector
        </Link>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Worlds ({worlds.length})</h2>
        {worlds.length === 0 ? (
          <p>No worlds found. Create one using the button above.</p>
        ) : (
          <ul className="list-disc pl-5">
            {worlds.map((world) => (
              <li key={world.id} className="mb-2">
                <strong>{world.name}</strong> - {world.description}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-bold mb-2">Raw World Data:</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">{worldsText}</pre>
      </div>
    </div>
  );
}