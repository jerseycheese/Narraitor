'use client';

import React, { useState, useMemo } from 'react';
import { useLoreStore } from '../../../state/loreStore';
import { generateConsistencyInstructions } from '../../../lib/ai/consistencyInstructions';
import { buildLoreContext } from '../../../lib/lore/loreContext';
import { JsonViewer } from '../JsonViewer';

/**
 * Consistency Validation Debug Section
 * 
 * Provides debugging tools for AI consistency validation:
 * - Live preview of lore context building
 * - Generated consistency instructions preview
 * - Lore fact categorization viewer
 * - Importance ranking validation
 */
export const ConsistencyValidationSection = () => {
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const { facts, getFacts } = useLoreStore();

  // Get available world IDs from lore facts
  const availableWorldIds = useMemo(() => {
    const worldIds = new Set<string>();
    Object.values(facts).forEach(fact => {
      if (fact.worldId) {
        worldIds.add(fact.worldId);
      }
    });
    return Array.from(worldIds);
  }, [facts]);

  // Get lore facts for selected world
  const worldLoreFacts = useMemo(() => {
    if (!selectedWorldId) return [];
    return getFacts({ worldId: selectedWorldId });
  }, [selectedWorldId, getFacts]);

  // Build lore context and generate instructions
  const loreContext = useMemo(() => {
    return buildLoreContext(worldLoreFacts);
  }, [worldLoreFacts]);

  const consistencyInstructions = useMemo(() => {
    return generateConsistencyInstructions(loreContext);
  }, [loreContext]);

  // Statistics about the lore
  const loreStats = useMemo(() => {
    return {
      totalFacts: worldLoreFacts.length,
      characters: loreContext.characters.length,
      locations: loreContext.locations.length,
      worldRules: loreContext.worldRules.length,
      historicalEvents: loreContext.historicalEvents.length,
      highImportance: [
        ...loreContext.characters.filter(c => c.importance === 'high'),
        ...loreContext.locations.filter(l => l.importance === 'high'),
        ...loreContext.worldRules.filter(r => r.importance === 'high'),
        ...loreContext.historicalEvents.filter(e => e.importance === 'high')
      ].length
    };
  }, [loreContext, worldLoreFacts]);

  return (
    <div className="flex flex-col space-y-3">
      {/* World Selection */}
      <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
        <label className="devtools-panel block !text-xs text-slate-300 !my-0 mb-1">
          Select World for Consistency Analysis:
        </label>
        <select
          value={selectedWorldId}
          onChange={(e) => setSelectedWorldId(e.target.value)}
          className="devtools-panel w-full bg-slate-600 text-slate-200 border-slate-500"
        >
          <option value="">-- Select a World --</option>
          {availableWorldIds.map(worldId => (
            <option key={worldId} value={worldId}>
              {worldId}
            </option>
          ))}
        </select>
      </div>

      {selectedWorldId && (
        <>
          {/* Lore Statistics */}
          <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
            <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">Lore Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>Total Facts: {loreStats.totalFacts}</div>
              <div>High Importance: {loreStats.highImportance}</div>
              <div>Characters: {loreStats.characters}</div>
              <div>Locations: {loreStats.locations}</div>
              <div>World Rules: {loreStats.worldRules}</div>
              <div>Historical Events: {loreStats.historicalEvents}</div>
            </div>
          </div>

          {/* Generated Consistency Instructions */}
          <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
            <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">Generated Consistency Instructions</h4>
            <div className="bg-slate-800 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-slate-300">
              {consistencyInstructions || 'No instructions generated'}
            </div>
          </div>

          {/* Structured Lore Context */}
          <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
            <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">Structured Lore Context</h4>
            <div className="max-h-48 overflow-y-auto">
              <JsonViewer 
                data={loreContext} 
                className="bg-slate-800"
              />
            </div>
          </div>

          {/* Raw Lore Facts */}
          <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
            <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">Raw Lore Facts ({worldLoreFacts.length})</h4>
            <div className="max-h-48 overflow-y-auto">
              <JsonViewer 
                data={worldLoreFacts} 
                className="bg-slate-800"
              />
            </div>
          </div>

          {/* Categorization Breakdown */}
          <div className="devtools-panel bg-slate-700 p-2 rounded border border-slate-600">
            <h4 className="devtools-panel !text-xs !font-medium !my-0 !mb-2 text-slate-200">Categorization Details</h4>
            <div className="space-y-2 text-xs">
              {loreContext.characters.length > 0 && (
                <div>
                  <div className="font-medium text-slate-200">Characters:</div>
                  {loreContext.characters.map((char, idx) => (
                    <div key={idx} className="ml-2 text-slate-300">
                      {char.name} - {char.importance} importance - Traits: {char.traits.join(', ')}
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.locations.length > 0 && (
                <div>
                  <div className="font-medium text-slate-200">Locations:</div>
                  {loreContext.locations.map((loc, idx) => (
                    <div key={idx} className="ml-2 text-slate-300">
                      {loc.name} ({loc.type}) - {loc.importance} importance
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.worldRules.length > 0 && (
                <div>
                  <div className="font-medium text-slate-200">World Rules:</div>
                  {loreContext.worldRules.map((rule, idx) => (
                    <div key={idx} className="ml-2 text-slate-300">
                      {rule.rule} - {rule.importance} importance
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.historicalEvents.length > 0 && (
                <div>
                  <div className="font-medium text-slate-200">Historical Events:</div>
                  {loreContext.historicalEvents.map((event, idx) => (
                    <div key={idx} className="ml-2 text-slate-300">
                      {event.event} - {event.importance} importance
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedWorldId && availableWorldIds.length === 0 && (
        <div className="devtools-panel !text-xs text-slate-400">
          No lore facts found. Create some lore in a game session to test consistency validation.
        </div>
      )}
    </div>
  );
};