'use client';

import React, { useState, useMemo } from 'react';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/worldStore';
import { useContinuityStore } from '@/state/continuityStore';
import { generateConsistencyInstructions } from '@/lib/ai/consistencyInstructions';
import { buildLoreContext } from '@/lib/lore/loreContext';
import { JsonViewer } from '@/components/devtools/JsonViewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { DevToolsSection } from '@/components/devtools/shared/DevToolsSection';
import type { ContinuityStatus } from '@/types/continuity.types';

const CONTINUITY_BADGE_VARIANTS: Record<
  ContinuityStatus,
  'success-static' | 'info-static' | 'warning-static'
> = {
  clean: 'success-static',
  corrected: 'info-static',
  flagged: 'warning-static',
};

/**
 * Consistency Validation Debug Section
 * 
 * A debugging interface for the AI consistency validation system.
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
 * ```tsx * // Used within DevToolsPanel * <CollapsibleSection title="Consistency Validation" initialCollapsed={true}> * <ConsistencyValidationSection /> * </CollapsibleSection> *```
 * 
 * @since 1.0.0 - Issue #184: AI Consistency Validation System
 */
export const ConsistencyValidationSection = () => {
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const { facts, getFacts } = useLoreStore();
  const { worlds } = useWorldStore();
  const { results: continuityResults, clear: clearContinuityResults } = useContinuityStore();

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
    <div>
      {/* Runtime continuity guardrail results (#409/#412) */}
      <DevToolsSection title="Runtime Validation" className="devtools-continuity-validation">
        <div data-testid="devtools-continuity-validation">
          {continuityResults.length === 0 ? (
            <p className="devtools-continuity-validation-empty">
              No segments validated yet this session.
            </p>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearContinuityResults}
                data-testid="continuity-validation-clear"
              >
                Clear
              </Button>
              {[...continuityResults].reverse().map((result) => (
                <div
                  key={result.id}
                  className="devtools-continuity-validation-entry"
                  data-testid={`continuity-validation-result-${result.id}`}
                >
                  <div>
                    <Badge variant={CONTINUITY_BADGE_VARIANTS[result.status]} size="sm">
                      {result.status}
                    </Badge>{' '}
                    <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                    {' — '}
                    <span>
                      detection {result.detectionMs}ms
                      {result.correctionMs !== undefined
                        ? `, correction ${result.correctionMs}ms`
                        : ''}
                    </span>
                  </div>
                  {result.issues.length > 0 && (
                    <div>
                      Issues:{' '}
                      {result.issues
                        .map((issue) => `${issue.entity} (${issue.type})`)
                        .join(', ')}
                    </div>
                  )}
                  <CollapsibleSection title="Details" initialCollapsed={true}>
                    <JsonViewer data={result} />
                  </CollapsibleSection>
                </div>
              ))}
            </>
          )}
        </div>
      </DevToolsSection>

      {/* World Selection */}
      <DevToolsSection>
        <label>
          Select World for Consistency Analysis:
        </label>
        <Select 
          value={selectedWorldId} 
          onChange={(e) => setSelectedWorldId(e.target.value)}
          
        >
          <option value="">-- Select a World --</option>
          {availableWorldIds.map(worldId => (
            <option key={worldId} value={worldId}>
              {worlds[worldId]?.name || worldId}
            </option>
          ))}
        </Select>
      </DevToolsSection>

      {selectedWorldId && (
        <>
          {/* Lore Statistics */}
          <DevToolsSection title="Lore Statistics">
            <div>
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
            <div>
              {consistencyInstructions || 'No instructions generated'}
            </div>
          </DevToolsSection>

          {/* Structured Lore Context */}
          <DevToolsSection title="Structured Lore Context">
            <div>
              <JsonViewer 
                data={loreContext} 
                
              />
            </div>
          </DevToolsSection>

          {/* Raw Lore Facts */}
          <DevToolsSection title={`Raw Lore Facts (${worldLoreFacts.length})`}>
            <div>
              <JsonViewer 
                data={worldLoreFacts} 
                
              />
            </div>
          </DevToolsSection>

          {/* Categorization Breakdown */}
          <DevToolsSection title="Categorization Details">
            <div>
              {loreContext.characters.length > 0 && (
                <div>
                  <div>Characters:</div>
                  {loreContext.characters.map((char, idx) => (
                    <div key={idx} >
                      {char.name} - {char.importance} importance - Traits: {char.traits.join(', ')}
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.locations.length > 0 && (
                <div>
                  <div>Locations:</div>
                  {loreContext.locations.map((loc, idx) => (
                    <div key={idx} >
                      {loc.name} ({loc.type}) - {loc.importance} importance
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.worldRules.length > 0 && (
                <div>
                  <div>World Rules:</div>
                  {loreContext.worldRules.map((rule, idx) => (
                    <div key={idx} >
                      {rule.rule} - {rule.importance} importance
                    </div>
                  ))}
                </div>
              )}
              
              {loreContext.historicalEvents.length > 0 && (
                <div>
                  <div>Historical Events:</div>
                  {loreContext.historicalEvents.map((event, idx) => (
                    <div key={idx} >
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
        <div>
          No lore facts found. Create some lore in a game session to test consistency validation.
        </div>
      )}
    </div>
  );
};