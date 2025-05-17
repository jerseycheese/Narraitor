'use client';

import React, { useMemo } from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { JsonViewer } from '../JsonViewer';

// Import all stores
import * as stores from '@/state';

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
    
    // Extract the state from each store
    Object.entries(stores).forEach(([name, store]) => {
      // Skip non-store exports like 'persistConfig'
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
    <div data-testid="devtools-state-section" className="space-y-2">
      <h2 className="text-sm font-bold mb-2">Application State</h2>
      
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
        <div className="text-sm text-gray-500 italic">
          No stores available
        </div>
      )}
    </div>
  );
};