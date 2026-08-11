'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LoreViewer } from '@/components/LoreViewer';
import { useLoreStore } from '@/state/loreStore';
import { extractStructuredLore } from '@/lib/ai/structuredLoreExtractor';
import { useWorldStore } from '@/state/worldStore';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';
import type { EntityID } from '@/types';

const STATUS_AUTO_DISMISS_MS = 5000;

/**
 * Show a status message that auto-clears after a single configurable delay.
 * Replaces a previous pattern of unmanaged setTimeout calls scattered across handlers:
 * each new message cancels the prior timer, and any pending timer is cleared on unmount.
 */
function useTransientStatus(autoDismissMs = STATUS_AUTO_DISMISS_MS) {
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((next: string, opts?: { sticky?: boolean }) => {
    clearPending();
    setMessage(next);
    if (!opts?.sticky) {
      timerRef.current = setTimeout(() => {
        setMessage('');
        timerRef.current = null;
      }, autoDismissMs);
    }
  }, [autoDismissMs, clearPending]);

  const clear = useCallback(() => {
    clearPending();
    setMessage('');
  }, [clearPending]);

  useEffect(() => clearPending, [clearPending]);

  return { message, show, clear };
}

export default function LoreViewerTestPage() {
  const { addFact, clearFacts, getFacts, addStructuredLore, setAliases, searchFacts, findEntityByAnyName } = useLoreStore();
  const { worlds, createWorld } = useWorldStore();
  const status = useTransientStatus();
  const [showSessionOnly, setShowSessionOnly] = useState(false);
  const [customNarrative, setCustomNarrative] = useState('');
  const [worldId, setWorldId] = useState<EntityID | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create test world on mount if needed
  useEffect(() => {
    const existingWorldId = Object.keys(worlds)[0];
    if (existingWorldId) {
      setWorldId(existingWorldId as EntityID);
    } else {
      const newWorldId = createWorld({
        name: 'Test World',
        description: 'Test world for lore viewer',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 15,
          attributePointPool: 30,
          skillPointPool: 50
        }
      });
      void ensureWorldNpcRoster(newWorldId);
      setWorldId(newWorldId);
    }
  }, [worlds, createWorld]);
  
  const sessionId = 'test-session-123' as EntityID;
  
  // Don't render until we have a world
  if (!worldId) {
    return <div>Loading test world...</div>;
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
    
    const sampleNarrative = customNarrative || `You enter the bustling marketplace of Goldenhaven, where merchants hawk their wares. A mysterious woman named Lady Seraphina approaches you with an urgent request. She tells you about the Lost Temple of Aethon, deep in the Whispering Woods. The temple is said to contain the Crystal of Truth, a powerful artifact. Sir Gareth, the captain of the guard, warns you that the woods are dangerous. Many adventurers have entered the Whispering Woods, but few have returned. The local tavern, The Dragon's Rest, might have more information.`;
    
    status.show('Extracting structured lore with AI...', { sticky: true });
    try {
      const structuredLore = await extractStructuredLore(sampleNarrative);
      addStructuredLore(structuredLore, worldId, sessionId);

      const afterCount = getFacts({ worldId }).length;
      const extracted = afterCount - beforeCount;

      status.show(`AI extracted ${extracted} new structured facts! Check all categories for rich metadata.`);
    } catch (error) {
      status.show(`Failed to extract structured lore: ${error}`);
    }
  };

  const testErrorHandling = async () => {
    const beforeCount = getFacts({ worldId }).length;

    const sampleNarrative = customNarrative || `You enter the bustling marketplace of Goldenhaven, where merchants hawk their wares. A mysterious woman named Lady Seraphina approaches you with an urgent request. She tells you about the Lost Temple of Aethon, deep in the Whispering Woods. The temple is said to contain the Crystal of Truth, a powerful artifact. Sir Gareth, the captain of the guard, warns you that the woods are dangerous. Many adventurers have entered the Whispering Woods, but few have returned. The local tavern, The Dragon's Rest, might have more information.`;

    status.show('Testing AI extraction with error handling...', { sticky: true });

    try {
      const structuredLore = await extractStructuredLore(sampleNarrative);
      addStructuredLore(structuredLore, worldId, sessionId);
      const afterCount = getFacts({ worldId }).length;
      const extracted = afterCount - beforeCount;

      status.show(`AI extraction successful! Added ${extracted} facts.`);
    } catch (error) {
      status.show(`AI extraction failed: ${error}`);
    }
  };

  const testAliasAddition = () => {
    const facts = getFacts({ worldId });
    const characterFacts = facts.filter(f => f.category === 'characters');

    if (characterFacts.length === 0) {
      status.show('Add some facts first before testing aliases!');
      return;
    }

    characterFacts.slice(0, 3).forEach(fact => {
      if (fact.value.includes('Marcus')) {
        setAliases(fact.id, ['Marcus', 'The Brave', 'Hero of Willowbrook']);
      } else if (fact.value.includes('Seraphina')) {
        setAliases(fact.id, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      } else if (fact.value.includes('Gareth')) {
        setAliases(fact.id, ['Gareth', 'Captain', 'Guard Captain']);
      } else {
        const firstName = fact.value.split(' ')[0];
        setAliases(fact.id, [firstName, fact.value]);
      }
    });

    status.show('Added aliases to character facts! Check the display above.');
  };

  const testAliasSearch = () => {
    if (!searchQuery.trim()) {
      status.show('Enter a search query first!');
      return;
    }

    const results = searchFacts(searchQuery, { worldId });
    const entityByName = findEntityByAnyName(searchQuery, worldId);

    const lines = [
      `Search for "${searchQuery}":`,
      `- Found ${results.length} facts via search`,
      entityByName ? `- Found exact match: ${entityByName.value}` : `- No exact match found`,
    ];
    status.show(lines.join('\n'));
  };

  const testAliasExtraction = async () => {
    const narrativeWithAliases = `You encounter Lady Seraphina Moonwhisper in the market. The locals call her "Sera" or "The Mysterious Woman". She's accompanied by Sir Gareth "The Iron", captain of the guard, who many simply call "Captain". They speak of Goldenhaven (also known as "The Golden City" or "Haven") and its troubles. The Dragon's Rest tavern, which locals affectionately call "The Dragon" or "Dragon's", is nearby.`;

    status.show('Testing AI alias extraction...', { sticky: true });

    try {
      const structuredLore = await extractStructuredLore(narrativeWithAliases);
      addStructuredLore(structuredLore, worldId, sessionId);

      status.show('AI alias extraction complete! Check if aliases were detected in the display above.');
    } catch (error) {
      status.show(`AI alias extraction failed: ${error}`);
    }
  };

  return (
    <div>
      <h1>Lore Viewer Test Harness</h1>
      
      <div>
        <div>
          <button
            onClick={addSampleFacts}
          >
            Add Sample Facts
          </button>
          
          <button
            onClick={testStructuredExtraction}
          >
            Test AI Structured Extraction
          </button>
          
          <button
            onClick={testErrorHandling}
          >
            Test Error Handling
          </button>
          
          <button
            onClick={() => {
              clearFacts(worldId);
              status.show('All facts cleared from this world');
            }}
          >
            Clear All Facts
          </button>

          <label>
            <input
              type="checkbox"
              checked={showSessionOnly}
              onChange={(e) => setShowSessionOnly(e.target.checked)}
            />
            Show Session Facts Only
          </label>
        </div>

        <div>
          <h3>Alias Testing:</h3>
          <div>
            <button
              onClick={testAliasAddition}
            >
              Test Alias Addition
            </button>

            <button
              onClick={testAliasExtraction}
            >
              Test AI Alias Extraction
            </button>
          </div>

          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or alias (e.g., 'Sera', 'Captain')..."
            />
            <button
              onClick={testAliasSearch}
            >
              Test Alias Search
            </button>
          </div>
        </div>

        {status.message && (
          <div role="status" aria-live="polite" style={{ whiteSpace: 'pre-line' }}>
            {status.message}
          </div>
        )}

        <div>
          <label>
            Custom Narrative Text (optional - leave empty to use sample)
          </label>
          <textarea
            value={customNarrative}
            onChange={(e) => setCustomNarrative(e.target.value)}
            placeholder="Enter narrative text to test fact extraction..."
          />
        </div>
      </div>
      
      <div>
        <LoreViewer 
          worldId={worldId} 
          sessionId={showSessionOnly ? sessionId : undefined}
        />
      </div>
      
      <div>
        <h2>Test Instructions:</h2>
        <ol>
          <li><strong>Add Sample Facts:</strong> Manually adds predefined facts to test display</li>
          <li><strong>Test AI Structured Extraction:</strong> Uses AI to intelligently extract structured lore with rich metadata</li>
          <li><strong>Test Error Handling:</strong> Demonstrates robust error handling when AI fails</li>
          <li><strong>Custom Narrative:</strong> Enter your own text to test extraction (any genre/style supported)</li>
          <li><strong>Session Filtering:</strong> Toggle to show only facts from the current session</li>
          <li><strong>Clear All Facts:</strong> Remove all facts to start fresh</li>
          <li><strong>Test Alias Addition:</strong> Manually adds aliases to existing character facts</li>
          <li><strong>Test AI Alias Extraction:</strong> Tests AI extraction of aliases from narrative text</li>
          <li><strong>Test Alias Search:</strong> Search for entities by their canonical name or any alias</li>
        </ol>
        
        <div>
          <h3>AI Structured Extraction:</h3>
          <ul>
            <li>• Extracts characters with roles, descriptions, and importance</li>
            <li>• Identifies locations with types and context</li>
            <li>• Detects aliases and alternative names for entities</li>
            <li>• Captures events with significance and relationships</li>
            <li>• Recognizes rules and world mechanics</li>
            <li>• Covers more cases than regex patterns</li>
          </ul>
        </div>

        <div>
          <h3>Alias Management:</h3>
          <ul>
            <li>• Characters and locations can have multiple aliases</li>
            <li>• Search finds entities by canonical name or any alias</li>
            <li>• AI automatically detects aliases from narrative context</li>
            <li>• Aliases are displayed inline with the canonical name</li>
            <li>• Useful for nicknames, titles, and alternative references</li>
          </ul>
        </div>
        
        <div>
          <h3>Production Behavior:</h3>
          <ul>
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
