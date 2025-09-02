'use client';

import React, { useState, useMemo } from 'react';
import { useLoreStore } from '@/state/loreStore';
import { generateConsistencyInstructions } from '@/lib/ai/consistencyInstructions';
import { buildLoreContext } from '@/lib/lore/loreContext';
import { JsonViewer } from '@/components/devtools/JsonViewer';
import { DevToolsSection } from '@/components/devtools/shared/DevToolsSection';

/**
 * Consistency Validation Debug Section
 * 
 * A comprehensive debugging interface for the AI consistency validation system.
 * This DevTools-only component provides real-time analysis of how lore facts
 * are processed and converted into consistency instructions for narrative generation.
 * 
 * ## Features
 * - **World Selection**: Choose from available worlds with lore data
 * - **Live Lore Analysis**: Real-time preview of lore context building from facts
 * - **Instruction Generation**: Generated consistency instructions preview
 * - **Categorization Viewer**: Visual breakdown of lore into categories (characters, locations, etc.)
 * - **Importance Ranking**: Validation of lore fact importance rankings
 * - **Statistics Dashboard**: Overview metrics for lore fact analysis
 * 
 * ## Usage
 * 1. Select a world from the dropdown (only worlds with lore facts are shown)
 * 2. Review the lore statistics for overview metrics
 * 3. Examine the generated consistency instructions
 * 4. Inspect the structured lore context and categorization details
 * 
 * ## Integration
 * - Uses `useLoreStore` to access stored lore facts
 * - Integrates with `buildLoreContext` for lore processing
 * - Calls `generateConsistencyInstructions` for live instruction preview
 * - Utilizes `JsonViewer` for structured data display
 * 
 * @example
 * ```tsx
 * // Used within DevToolsPanel
 * <CollapsibleSection title="Consistency Validation" initialCollapsed={true}>
 *   <ConsistencyValidationSection />
 * </CollapsibleSection>
 * ```
 * 
 * @since 1.0.0 - Issue #184: AI Consistency Validation System
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
      <DevToolsSection>
        <label className="block text-xs text-gray-100 mb-1">
          Select World for Consistency Analysis:
        </label>
        <select
          value={selectedWorldId}
          onChange={(e) => setSelectedWorldId(e.target.value)}
          className="w-full bg-gray-900 text-gray-100 border border-gray-500 rounded px-2 py-1 text-xs"
        >
          <option value="">-- Select a World --</option>
          {availableWorldIds.map(worldId => (
            <option key={worldId} value={worldId}>
              {worldId}
            </option>
          ))}
        </select>
      </DevToolsSection>

      {selectedWorldId && (
        <>
          {/* Lore Statistics */}
          <DevToolsSection title="Lore Statistics">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-100">
              <div>Total Facts: {loreStats.totalFacts}</div>
              <div>High Importance: {loreStats.highImportance}</div>
              <div>Characters: {loreStats.characters}</div>
              <div>Locations: {loreStats.locations}</div>
              <div>World Rules: {loreStats.worldRules}</div>
              <div>Historical Events: {loreStats.historicalEvents}</div>
            </div>
          </DevToolsSection>

          {/* Generated Consistency Instructions */}
          <DevToolsSection title="Generated Consistency Instructions">
            <div className="bg-gray-900 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-gray-100">
              {consistencyInstructions || 'No instructions generated'}
            </div>
          </DevToolsSection>

          {/* Structured Lore Context */}
          <DevToolsSection title="Structured Lore Context">
            <div className="max-h-48 overflow-y-auto">
              <JsonViewer 
                data={loreContext} 
                className="bg-gray-900"
              />
            </div>
          </DevToolsSection>

          {/* Raw Lore Facts */}
          <DevToolsSection title={`Raw Lore Facts (${worldLoreFacts.length})`}>
            <div className="max-h-48 overflow-y-auto">
              <JsonViewer 
                data={worldLoreFacts} 
                className="bg-gray-900"
              />
            </div>
          </DevToolsSection>

          {/* Categorization Breakdown */}
          <DevToolsSection title="Categorization Details">
            <div className="space-y-2 text-xs">
              {loreContext.characters.length > 0 && (
                <div>
                  <div className="font-medium text-gray-50">Characters:</div>
                  {loreContext.characters.map((char, idx) => (
                    <div key={idx} className="ml-2 text-gray-100">
                      {char.name} - {char.importance} importance - Traits: {char.traits.join(', ')}
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.locations.length > 0 && (
                <div>
                  <div className="font-medium text-gray-50">Locations:</div>
                  {loreContext.locations.map((loc, idx) => (
                    <div key={idx} className="ml-2 text-gray-100">
                      {loc.name} ({loc.type}) - {loc.importance} importance
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.worldRules.length > 0 && (
                <div>
                  <div className="font-medium text-gray-50">World Rules:</div>
                  {loreContext.worldRules.map((rule, idx) => (
                    <div key={idx} className="ml-2 text-gray-100">
                      {rule.rule} - {rule.importance} importance
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.historicalEvents.length > 0 && (
                <div>
                  <div className="font-medium text-gray-50">Historical Events:</div>
                  {loreContext.historicalEvents.map((event, idx) => (
                    <div key={idx} className="ml-2 text-gray-100">
                      {event.event} - {event.importance} importance
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DevToolsSection>
        </>
      )}

      {!selectedWorldId && availableWorldIds.length === 0 && (
        <div className="text-xs text-gray-200">
          No lore facts found. Create some lore in a game session to test consistency validation.
        </div>
      )}
    </div>
  );
};