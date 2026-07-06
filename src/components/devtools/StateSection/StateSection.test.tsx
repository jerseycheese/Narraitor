import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateSection } from './StateSection';

// Mock the individual stores. StateSection reads each store through its hook
// (e.g. useWorldStore()), so the mock's call signature must return the state.
jest.mock('@/state/worldStore', () => {
  const state = {
    worlds: { 'world-1': { id: 'world-1', name: 'Test World' } },
    currentWorld: 'world-1'
  };
  return { useWorldStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/characterStore', () => {
  const state = { characters: {} };
  return { useCharacterStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/npcStore', () => {
  const state = { npcs: {} };
  return { useNPCStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/narrativeStore', () => {
  const state = { segments: [] };
  return { useNarrativeStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/journalStore', () => {
  const state = { entries: [] };
  return { useJournalStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/sessionStore', () => {
  const state = { sessions: {} };
  return { useSessionStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/aiContextStore', () => {
  const state = { contexts: {} };
  return { useAiContextStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/loreStore', () => {
  const state = { lore: [] };
  return { useLoreStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/navigationStore', () => {
  const state = { currentPath: '/' };
  return { useNavigationStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/goalStore', () => {
  const state = { goals: [] };
  return { useGoalStore: Object.assign(() => state, { getState: () => state }) };
});

jest.mock('@/state/inventoryStore', () => {
  const state = { items: {} };
  return { useInventoryStore: Object.assign(() => state, { getState: () => state }) };
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
  it('renders a section per store', () => {
    render(<StateSection />);

    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();

    // A titled section is rendered for each store.
    expect(screen.getByText(/useWorldStore/)).toBeInTheDocument();
  });

  it('renders the current store state, not an empty snapshot', () => {
    render(<StateSection />);

    // The value read from the store hook reaches the viewer — this is the live
    // path that the old useMemo([]) snapshot froze.
    expect(screen.getByText(/Test World/)).toBeInTheDocument();
  });
});
