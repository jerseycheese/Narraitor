import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateSection } from './StateSection';

// Mock the individual stores
jest.mock('@/state/worldStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({
      worlds: { 'world-1': { id: 'world-1', name: 'Test World' } },
      currentWorld: 'world-1'
    })
  });
  return { useWorldStore: mockStore };
});

jest.mock('@/state/characterStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ characters: {} })
  });
  return { useCharacterStore: mockStore };
});

jest.mock('@/state/npcStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ npcs: {} })
  });
  return { useNPCStore: mockStore };
});

jest.mock('@/state/narrativeStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ segments: [] })
  });
  return { useNarrativeStore: mockStore };
});

jest.mock('@/state/journalStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ entries: [] })
  });
  return { useJournalStore: mockStore };
});

jest.mock('@/state/sessionStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ sessions: {} })
  });
  return { useSessionStore: mockStore };
});

jest.mock('@/state/aiContextStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ contexts: {} })
  });
  return {
    aiContextStore: mockStore,
    useAiContextStore: mockStore
  };
});

jest.mock('@/state/loreStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ lore: [] })
  });
  return { useLoreStore: mockStore };
});

jest.mock('@/state/navigationStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ currentPath: '/' })
  });
  return { useNavigationStore: mockStore };
});

jest.mock('@/state/goalStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ goals: [] })
  });
  return { useGoalStore: mockStore };
});

jest.mock('@/state/inventoryStore', () => {
  const mockStore = Object.assign(() => {}, {
    getState: jest.fn().mockReturnValue({ items: {} })
  });
  return { useInventoryStore: mockStore };
});

// Mock the CollapsibleSection component
jest.mock('@/components/ui/CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div data-testid="collapsible-section-title">{title}
      <div data-testid="collapsible-section-content">{children}</div>
    </div>
  )
}));

// Mock the JsonViewer component
jest.mock('../JsonViewer', () => ({
  JsonViewer: ({ data }: { data: unknown }) => (
    <pre data-testid="json-viewer">{JSON.stringify(data)}</pre>
  )
}));

describe('StateSection', () => {
  it('renders all store states', () => {
    render(<StateSection />);

    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();

    // Check for world store state
    expect(screen.getByText(/useWorldStore/)).toBeInTheDocument();
  });
});
