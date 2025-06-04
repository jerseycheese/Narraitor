'use client';

import React, { useState, useEffect } from 'react';
import { LoreViewer } from '@/components/LoreViewer';
import { useLoreStore } from '@/state/loreStore';
import { extractStructuredLore } from '@/lib/ai/structuredLoreExtractor';
import { useWorldStore } from '@/state/useWorldStore';
import type { EntityID } from '@/types';

export default function LoreViewerTestPage() {
  const { addFact, clearFacts, getFacts, addStructuredLore } = useLoreStore();
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


  const testStructuredExtraction = async () => {
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
    
    try {
      setExtractionResult('Extracting structured lore with AI...');
      const structuredLore = await extractStructuredLore(sampleNarrative);
      addStructuredLore(structuredLore, worldId, sessionId);
      
      const afterCount = getFacts({ worldId }).length;
      const extracted = afterCount - beforeCount;
      
      setExtractionResult(`AI extracted ${extracted} new structured facts! Check all categories for rich metadata.`);
      setTimeout(() => setExtractionResult(''), 7000);
    } catch (error) {
      setExtractionResult(`Failed to extract structured lore: ${error}`);
      setTimeout(() => setExtractionResult(''), 5000);
    }
  };

  const testErrorHandling = async () => {
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
    
    setExtractionResult('Testing AI extraction with error handling...');
    
    try {
      const structuredLore = await extractStructuredLore(sampleNarrative);
      addStructuredLore(structuredLore, worldId, sessionId);
      const afterCount = getFacts({ worldId }).length;
      const extracted = afterCount - beforeCount;
      
      setExtractionResult(`AI extraction successful! Added ${extracted} facts with robust error handling.`);
      setTimeout(() => setExtractionResult(''), 7000);
      
    } catch (error) {
      setExtractionResult(`AI extraction failed gracefully: ${error}`);
      setTimeout(() => setExtractionResult(''), 5000);
    }
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
            onClick={testStructuredExtraction}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test AI Structured Extraction
          </button>
          
          <button
            onClick={testErrorHandling}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test Error Handling
          </button>
          
          <button
            onClick={() => {
              clearFacts(worldId);
              setExtractionResult('All facts cleared from this world');
              setTimeout(() => setExtractionResult(''), 3000);
            }}
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
          <li><strong>Test AI Structured Extraction:</strong> Uses AI to intelligently extract structured lore with rich metadata</li>
          <li><strong>Test Error Handling:</strong> Demonstrates robust error handling when AI fails</li>
          <li><strong>Custom Narrative:</strong> Enter your own text to test extraction (any genre/style supported)</li>
          <li><strong>Session Filtering:</strong> Toggle to show only facts from the current session</li>
          <li><strong>Clear All Facts:</strong> Remove all facts to start fresh</li>
        </ol>
        
        <div className="mt-4 p-3 bg-purple-50 rounded">
          <h3 className="font-semibold text-sm mb-1">AI Structured Extraction:</h3>
          <ul className="text-sm space-y-1">
            <li>• Extracts characters with roles, descriptions, and importance</li>
            <li>• Identifies locations with types and context</li>
            <li>• Captures events with significance and relationships</li>
            <li>• Recognizes rules and world mechanics</li>
            <li>• Much more comprehensive than regex patterns</li>
          </ul>
        </div>
        
        <div className="mt-4 p-3 bg-orange-50 rounded">
          <h3 className="font-semibold text-sm mb-1">Production Behavior:</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Primary:</strong> AI-powered structured extraction (production with API key)</li>
            <li>• <strong>Development:</strong> Mock structured extraction (intelligent patterns without API)</li>
            <li>• <strong>Error Handling:</strong> Graceful failure - no lore extraction rather than bad data</li>
            <li>• Focuses on quality over quantity - better no data than wrong data</li>
            <li>• Simple, reliable architecture without brittle regex patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
