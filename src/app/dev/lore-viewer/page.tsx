'use client';

import React, { useState, useEffect } from 'react';
import { LoreViewer } from '@/components/LoreViewer';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/useWorldStore';
import type { EntityID } from '@/types';

export default function LoreViewerTestPage() {
  const { addFact, clearFacts, extractFactsFromText, getFacts } = useLoreStore();
  const { worlds, createWorld } = useWorldStore();
  const [showSessionOnly, setShowSessionOnly] = useState(false);
  const [extractionResult, setExtractionResult] = useState<string>('');
  const [customNarrative, setCustomNarrative] = useState('');
  const [worldId, setWorldId] = useState<EntityID | null>(null);
  
  // Create test world on mount if needed
  useEffect(() => {
    const existingWorldId = Object.keys(worlds)[0];
    if (existingWorldId) {
      setWorldId(existingWorldId as EntityID);
    } else {
      const newWorldId = createWorld({
        name: 'Test World',
        description: 'Test world for lore viewer',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 15,
          attributePointPool: 30,
          skillPointPool: 50
        }
      });
      setWorldId(newWorldId);
    }
  }, [worlds, createWorld]);
  
  const sessionId = 'test-session-123' as EntityID;
  
  // Don't render until we have a world
  if (!worldId) {
    return <div className="p-8">Loading test world...</div>;
  }

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
    const beforeCount = getFacts({ worldId }).length;
    
    const sampleNarrative = customNarrative || `
      You enter the bustling marketplace of Goldenhaven, where merchants hawk their wares.
      A mysterious woman named Lady Seraphina approaches you with an urgent request.
      She tells you about the Lost Temple of Aethon, hidden deep in the Whispering Woods.
      The temple is said to contain the Crystal of Truth, a powerful artifact.
      
      Sir Gareth, the captain of the guard, warns you that the woods are dangerous.
      Many adventurers have entered the Whispering Woods, but few have returned.
      The local tavern, The Dragon's Rest, might have more information.
    `;
    
    extractFactsFromText(sampleNarrative, worldId, sessionId);
    
    const afterCount = getFacts({ worldId }).length;
    const extracted = afterCount - beforeCount;
    
    setExtractionResult(`Extracted ${extracted} new facts from the narrative. Look for new entries in Characters and Locations categories.`);
    setTimeout(() => setExtractionResult(''), 5000);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Lore Viewer Test Harness</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
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
          
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showSessionOnly}
              onChange={(e) => setShowSessionOnly(e.target.checked)}
              className="mr-2"
            />
            Show Session Facts Only
          </label>
        </div>
        
        {extractionResult && (
          <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800">
            {extractionResult}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Custom Narrative Text (optional - leave empty to use sample)
          </label>
          <textarea
            value={customNarrative}
            onChange={(e) => setCustomNarrative(e.target.value)}
            placeholder="Enter narrative text to test fact extraction..."
            className="w-full p-2 border rounded h-32 font-mono text-sm"
          />
        </div>
      </div>
      
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <LoreViewer 
          worldId={worldId} 
          sessionId={showSessionOnly ? sessionId : undefined}
        />
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Test Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li><strong>Add Sample Facts:</strong> Manually adds predefined facts to test display</li>
          <li><strong>Test Narrative Extraction:</strong> Automatically extracts character names and locations from narrative text using regex patterns (e.g., &quot;Lady Seraphina&quot;, &quot;Lost Temple of Aethon&quot;)</li>
          <li><strong>Custom Narrative:</strong> Enter your own text to test extraction patterns</li>
          <li><strong>Session Filtering:</strong> Toggle to show only facts from the current session</li>
          <li><strong>Clear All Facts:</strong> Remove all facts to start fresh</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h3 className="font-semibold text-sm mb-1">Extraction Patterns:</h3>
          <ul className="text-sm space-y-1">
            <li>• Characters: Titles + Names (e.g., &quot;Sir Gareth&quot;, &quot;Lady Seraphina&quot;)</li>
            <li>• Locations: Proper nouns with location words (e.g., &quot;Temple of&quot;, &quot;Woods&quot;, &quot;Tavern&quot;)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}