'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorldStore } from '@/state/worldStore';
import { generateTestCharacter } from '@/lib/generators/characterGenerator';

interface DebugInfo {
  currentWorldId: string | null;
  worldName: string;
  sessionStorageKeys: string[];
  characterCreationKeys: string[];
  storedData: Record<string, unknown>;
  lastGenerated?: string;
  cleared?: boolean;
}

export default function TestCharacterFormPage() {
  const { worlds, currentWorldId } = useWorldStore();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    currentWorldId: null,
    worldName: 'None',
    sessionStorageKeys: [],
    characterCreationKeys: [],
    storedData: {}
  });
  
  useEffect(() => {
    // Check all sessionStorage keys
    const allKeys = Object.keys(sessionStorage);
    const characterKeys = allKeys.filter(key => key.startsWith('character-creation-'));
    
    const info: DebugInfo = {
      currentWorldId,
      worldName: currentWorldId ? worlds[currentWorldId]?.name : 'None',
      sessionStorageKeys: allKeys,
      characterCreationKeys: characterKeys,
      storedData: {}
    };
    
    // Get data for each character creation key
    characterKeys.forEach(key => {
      try {
        const data = sessionStorage.getItem(key);
        info.storedData[key] = data ? JSON.parse(data) : null;
      } catch {
        info.storedData[key] = 'Error parsing data';
      }
    });
    
    setDebugInfo(info);
  }, [currentWorldId, worlds]);
  
  const handleGenerateAndStore = () => {
    if (!currentWorldId || !worlds[currentWorldId]) {
      alert('Please select a world first');
      return;
    }
    
    const currentWorld = worlds[currentWorldId];
    const testData = generateTestCharacter(currentWorld);
    
    const wizardState = {
      currentStep: 0,
      worldId: currentWorld.id,
      characterData: testData,
      validation: {},
      pointPools: {
        attributes: {
          total: currentWorld.settings.attributePointPool,
          spent: testData.attributes.reduce((sum, attr) => sum + attr.value, 0),
          remaining: currentWorld.settings.attributePointPool - testData.attributes.reduce((sum, attr) => sum + attr.value, 0),
        },
        skills: {
          total: currentWorld.settings.skillPointPool,
          spent: testData.skills.filter(s => s.isActive).reduce((sum, skill) => sum + skill.level, 0),
          remaining: currentWorld.settings.skillPointPool - testData.skills.filter(s => s.isActive).reduce((sum, skill) => sum + skill.level, 0),
        },
      },
    };
    
    const storageKey = `character-creation-${currentWorld.id}`;
    sessionStorage.setItem(storageKey, JSON.stringify(wizardState));
    
    // Force refresh of debug info
    setDebugInfo(prev => ({ ...prev, lastGenerated: new Date().toISOString() }));
    
    alert(`Test data stored with key: ${storageKey}. Check the debug info below.`);
  };
  
  const handleClearStorage = () => {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith('character-creation-'));
    keys.forEach(key => sessionStorage.removeItem(key));
    setDebugInfo(prev => ({ ...prev, cleared: true }));
    alert('Cleared all character creation data from sessionStorage');
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Character Form Test & Debug</h1>
      
      <div className="mb-6 space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Current State</h2>
          <p>Selected World: <strong>{debugInfo.worldName || 'None'}</strong></p>
          <p>World ID: <code className="bg-gray-200 px-1">{debugInfo.currentWorldId || 'None'}</code></p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleGenerateAndStore}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={!currentWorldId}
          >
            Generate & Store Test Data
          </button>
          
          <button
            onClick={handleClearStorage}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Storage
          </button>
          
          <Link
            href="/characters/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Go to Character Creation
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Debug Info</h2>
        <pre className="text-xs overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure you have a world selected (check &quot;Current State&quot; above)</li>
          <li>Click &quot;Generate & Store Test Data&quot;</li>
          <li>Check the debug info to confirm data is stored</li>
          <li>Click &quot;Go to Character Creation&quot;</li>
          <li>The form should be pre-filled with the test data</li>
        </ol>
        <p className="mt-2 text-sm text-gray-600">
          If the form is not pre-filled, come back here and check the debug info for clues.
        </p>
      </div>
    </div>
  );
}
