import { renderHook } from '@testing-library/react';
import { useTermDefinitions } from '../useTermDefinitions';
import { useLoreStore } from '@/state/loreStore';
import type { LoreFact } from '@/types/lore.types';

// Mock the lore store
jest.mock('@/state/loreStore');

const mockGetFacts = jest.fn();
(useLoreStore as unknown as jest.Mock).mockImplementation((selector: (state: { getFacts: typeof mockGetFacts }) => unknown) =>
  selector({ getFacts: mockGetFacts })
);

const baseFact: LoreFact = {
  id: 'fact-1',
  key: 'world-1:character_aria',
  value: 'Aria',
  category: 'characters',
  source: 'narrative',
  worldId: 'world-1',
  aliases: ['The Silver Mage'],
  visibility: 'world-shared',
  metadata: {
    description: 'A powerful mage from the Northern Tower.',
    type: 'protagonist',
    importance: 'high',
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

beforeEach(() => {
  mockGetFacts.mockReset();
});

describe('useTermDefinitions', () => {
  it('returns empty when no worldId provided', () => {
    const { result } = renderHook(() => useTermDefinitions(undefined));
    expect(result.current.termNames).toEqual([]);
    expect(result.current.getDefinition('Aria')).toBeNull();
  });

  it('extracts term names from facts with descriptions', () => {
    mockGetFacts.mockReturnValue([baseFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    expect(result.current.termNames).toContain('Aria');
    expect(result.current.termNames).toContain('The Silver Mage');
  });

  it('excludes facts without metadata.description', () => {
    const noDescFact: LoreFact = {
      ...baseFact,
      id: 'fact-2',
      value: 'Bob',
      metadata: { type: 'npc' },
    };
    mockGetFacts.mockReturnValue([noDescFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    expect(result.current.termNames).toEqual([]);
  });

  it('excludes non-definable categories (rules)', () => {
    const rulesFact: LoreFact = {
      ...baseFact,
      id: 'fact-3',
      category: 'rules',
      value: 'Magic costs stamina',
      metadata: { description: 'A world rule' },
    };
    mockGetFacts.mockReturnValue([rulesFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    expect(result.current.termNames).toEqual([]);
  });

  it('looks up definition by canonical name (case-insensitive)', () => {
    mockGetFacts.mockReturnValue([baseFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    const def = result.current.getDefinition('aria');
    expect(def).not.toBeNull();
    expect(def?.name).toBe('Aria');
    expect(def?.description).toBe('A powerful mage from the Northern Tower.');
  });

  it('looks up definition by alias (case-insensitive)', () => {
    mockGetFacts.mockReturnValue([baseFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    const def = result.current.getDefinition('the silver mage');
    expect(def).not.toBeNull();
    expect(def?.name).toBe('Aria');
  });

  it('returns null for unknown terms', () => {
    mockGetFacts.mockReturnValue([baseFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    expect(result.current.getDefinition('Unknown Character')).toBeNull();
  });

  it('respects session-private visibility scoping', () => {
    const privateFact: LoreFact = {
      ...baseFact,
      id: 'fact-4',
      value: 'Secret NPC',
      visibility: 'session-private',
      sessionId: 'session-A',
      metadata: { description: 'A secret character' },
    };
    mockGetFacts.mockReturnValue([privateFact]);

    // Different session — should not see it
    const { result: r1 } = renderHook(() => useTermDefinitions('world-1', 'session-B'));
    expect(r1.current.termNames).toEqual([]);

    // Same session — should see it
    const { result: r2 } = renderHook(() => useTermDefinitions('world-1', 'session-A'));
    expect(r2.current.termNames).toContain('Secret NPC');
  });

  it('includes location and event categories', () => {
    const locationFact: LoreFact = {
      ...baseFact,
      id: 'fact-5',
      category: 'locations',
      value: 'Northern Tower',
      aliases: [],
      metadata: { description: 'A tall tower in the north.' },
    };
    const eventFact: LoreFact = {
      ...baseFact,
      id: 'fact-6',
      category: 'events',
      value: 'The Great Siege',
      aliases: [],
      metadata: { description: 'A historic battle.' },
    };
    mockGetFacts.mockReturnValue([locationFact, eventFact]);
    const { result } = renderHook(() => useTermDefinitions('world-1'));

    expect(result.current.termNames).toContain('Northern Tower');
    expect(result.current.termNames).toContain('The Great Siege');
  });
});
