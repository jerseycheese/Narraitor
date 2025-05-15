'use client';

import React, { useState } from 'react';
import WorldCard from '@/components/WorldCard/WorldCard';
import { World } from '@/types/world.types';
import { worldStore } from '@/state/worldStore';

// Mock world data
const mockWorld: World = {
  id: '1',
  name: 'Test World',
  description: 'This is a test world for testing the Play functionality.',
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

export default function WorldCardTestHarness() {
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  
  // Create a modified router for testing
  const testRouter = {
    push: (url: string) => {
      console.log(`Navigating to: ${url}`);
      setNavigationPath(url);
      // Don't actually navigate in the test harness
      return Promise.resolve(true);
    }
  };
  
  // Create modified store actions for testing
  const testStoreActions = {
    setCurrentWorld: (id: string) => {
      console.log(`Setting current world: ${id}`);
      setSelectedWorldId(id);
      // Still call the real implementation for consistency
      const { setCurrentWorld } = worldStore.getState();
      setCurrentWorld(id);
    }
  };
  
  // Standard handlers for WorldCard props
  const handleSelectWorld = (worldId: string) => {
    console.log(`Selected world: ${worldId}`);
    setSelectedWorldId(worldId);
  };
  
  const handleDeleteWorld = (worldId: string) => {
    console.log(`Delete world: ${worldId}`);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">WorldCard Test Harness</h1>
      
      <div className="flex gap-6">
        <div className="w-2/3">
          <WorldCard 
            world={mockWorld}
            onSelect={handleSelectWorld}
            onDelete={handleDeleteWorld}
            _storeActions={testStoreActions}
            _router={testRouter}
          />
        </div>
        
        <div className="w-1/3 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Test State</h2>
          
          <div className="mb-4">
            <h3 className="font-bold">Selected World ID:</h3>
            <div className="p-2 bg-white border rounded">
              {selectedWorldId || 'None'}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold">Navigation Path:</h3>
            <div className="p-2 bg-white border rounded">
              {navigationPath || 'None'}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-bold">Testing Notes:</h3>
            <ul className="list-disc pl-5">
              <li>Click &ldquo;Play&rdquo; to verify it sets current world</li>
              <li>Navigation will display in &ldquo;Navigation Path&rdquo;</li>
              <li>In real implementation, this would navigate to game session</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
