'use client';

import React, { useMemo } from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { JsonViewer } from '../JsonViewer';

// Import all stores
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNPCStore } from '@/state/npcStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import { aiContextStore, useAiContextStore } from '@/state/aiContextStore';
import { useLoreStore } from '@/state/loreStore';
import { useNavigationStore } from '@/state/navigationStore';
import { useGoalStore } from '@/state/goalStore';
import { useInventoryStore } from '@/state/inventoryStore';

/**
 * StateSection props
 */
interface StateSectionProps {
  /** Whether sections should be collapsed by default */
  defaultCollapsed?: boolean;
}

/**
 * StateSection Component
 * 
 * Displays the current state of all Zustand stores in collapsible sections.
 * Each store's state is shown using the JsonViewer component.
 */
export const StateSection = ({ defaultCollapsed = false }: StateSectionProps) => {
  // Get all store states
  const storeStates = useMemo(() => {
    // Create an object to hold all store states
    const states: Record<string, unknown> = {};

    // Map of store names to store instances
    const storeMap = {
      useWorldStore,
      useCharacterStore,
      useNPCStore,
      useNarrativeStore,
      useJournalStore,
      useSessionStore,
      aiContextStore,
      useAiContextStore,
      useLoreStore,
      useNavigationStore,
      useGoalStore,
      useInventoryStore,
    };

    // Extract the state from each store
    Object.entries(storeMap).forEach(([name, store]) => {
      if (typeof store === 'function' && store.getState) {
        try {
          states[name] = store.getState();
        } catch (err) {
          // Use a generic message to capture any errors accessing store state
          states[name] = { error: `Error accessing store state: ${err instanceof Error ? err.message : 'Unknown error'}` };
        }
      }
    });

    return states;
  }, []);

  return (
    <div data-testid="devtools-state-section" className="space-y-3">
      
      {Object.entries(storeStates).map(([storeName, storeState]) => (
        <CollapsibleSection 
          key={storeName}
          title={storeName}
          initialCollapsed={defaultCollapsed}
          data-testid={`store-section-${storeName}`}
        >
          <JsonViewer data={storeState} />
        </CollapsibleSection>
      ))}
      
      {Object.keys(storeStates).length === 0 && (
        <div className="text-sm text-gray-200 italic">
          No stores available
        </div>
      )}
    </div>
  );
};
