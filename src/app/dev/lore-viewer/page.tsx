'use client';

import React, { useState } from 'react';
import { LoreViewer } from '@/components/LoreViewer';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/useWorldStore';
import type { EntityID } from '@/types';

export default function LoreViewerTestPage() {
  const { addFact, clearFacts, extractFactsFromText } = useLoreStore();
  const { worlds, createWorld } = useWorldStore();
  const [showSessionOnly, setShowSessionOnly] = useState(false);
  
  // Get or create test world
  const worldId = Object.keys(worlds)[0] || createWorld({
    name: 'Test World',
    description: 'Test world for lore viewer',
    theme: 'fantasy'
  });
  
  const sessionId = 'test-session-123' as EntityID;

  const addSampleFacts = () => {
    // Characters
    addFact('hero_name', 'Marcus the Brave', 'characters', 'manual', worldId);
    addFact('villain_name', 'Lord Darkmore', 'characters', 'manual', worldId);
    addFact('mentor_name', 'Eldara the Wise', 'characters', 'manual', worldId);
    
    // Locations
    addFact('starting_town', 'Willowbrook Village', 'locations', 'manual', worldId);
    addFact('dungeon_name', 'The Caverns of Despair', 'locations', 'manual', worldId);
    addFact('capital_city', 'Goldenhaven', 'locations', 'manual', worldId);
    
    // Events
    addFact('quest_start', 'The village was attacked by goblins', 'events', 'narrative', worldId, sessionId);
    addFact('first_battle', 'Marcus defeated three goblins', 'events', 'narrative', worldId, sessionId);
    addFact('mentor_meeting', 'Eldara revealed the prophecy', 'events', 'narrative', worldId, sessionId);
    
    // Rules
    addFact('magic_system', 'Magic requires crystalline focuses', 'rules', 'manual', worldId);
    addFact('combat_rule', 'Initiative is based on agility', 'rules', 'manual', worldId);
  };

  const testNarrativeExtraction = () => {
    const sampleNarrative = `
      You enter the bustling marketplace of Goldenhaven, where merchants hawk their wares.
      A mysterious woman named Lady Seraphina approaches you with an urgent request.
      She tells you about the Lost Temple of Aethon, hidden deep in the Whispering Woods.
      The temple is said to contain the Crystal of Truth, a powerful artifact.
      
      Sir Gareth, the captain of the guard, warns you that the woods are dangerous.
      Many adventurers have entered the Whispering Woods, but few have returned.
      The local tavern, The Dragon's Rest, might have more information.
    `;
    
    extractFactsFromText(sampleNarrative, worldId, sessionId);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Lore Viewer Test Harness</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={addSampleFacts}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Sample Facts
        </button>
        
        <button
          onClick={testNarrativeExtraction}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Narrative Extraction
        </button>
        
        <button
          onClick={() => clearFacts(worldId)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Facts
        </button>
        
        <label className="inline-flex items-center ml-4">
          <input
            type="checkbox"
            checked={showSessionOnly}
            onChange={(e) => setShowSessionOnly(e.target.checked)}
            className="mr-2"
          />
          Show Session Facts Only
        </label>
      </div>
      
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <LoreViewer 
          worldId={worldId} 
          sessionId={showSessionOnly ? sessionId : undefined}
        />
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Test Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Add Sample Facts" to populate with test data</li>
          <li>Click "Test Narrative Extraction" to test automatic fact extraction</li>
          <li>Toggle "Show Session Facts Only" to test filtering</li>
          <li>Click "Clear All Facts" to reset</li>
        </ol>
      </div>
    </div>
  );
}