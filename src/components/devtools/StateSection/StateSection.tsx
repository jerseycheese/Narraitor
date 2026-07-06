'use client';

import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { JsonViewer } from '../JsonViewer';

// Import all stores
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNPCStore } from '@/state/npcStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import { useAiContextStore } from '@/state/aiContextStore';
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
 * Displays the live state of every Zustand store in collapsible sections.
 * Each store is read through its hook, so the inspector re-renders as state
 * changes instead of freezing on a mount-time snapshot.
 */
export const StateSection = ({ defaultCollapsed = false }: StateSectionProps) => {
  // Subscribe to every store so the view reflects current state, not a snapshot.
  const storeStates: Record<string, unknown> = {
    useWorldStore: useWorldStore(),
    useCharacterStore: useCharacterStore(),
    useNPCStore: useNPCStore(),
    useNarrativeStore: useNarrativeStore(),
    useJournalStore: useJournalStore(),
    useSessionStore: useSessionStore(),
    useAiContextStore: useAiContextStore(),
    useLoreStore: useLoreStore(),
    useNavigationStore: useNavigationStore(),
    useGoalStore: useGoalStore(),
    useInventoryStore: useInventoryStore(),
  };

  return (
    <div data-testid="devtools-state-section">
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
    </div>
  );
};
