/**
 * Tests for Mock Store Factory Functions
 *
 * These tests verify that our typed mock factory functions create properly-structured
 * mock stores that can be used in component tests without type assertions.
 */

import {
  mockZustandStore,
  createMockCharacterStore,
  createMockSessionStore,
  createMockJournalStore,
  createMockNarrativeStore,
  createMockInventoryStore,
  createMockNPCStore,
} from '../mockStoreFactories';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';

// Mock the stores
jest.mock('@/state/characterStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/journalStore');
jest.mock('@/state/narrativeStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/npcStore');

describe('mockZustandStore', () => {
  it('creates a mock that supports selector pattern', () => {
    const mockState = createMockCharacterStore({ loading: true });
    const mockHook = jest.fn();

    mockZustandStore(mockHook, mockState);

    // Test that selector works
    const result = mockHook((state: typeof mockState) => state.loading);
    expect(result).toBe(true);
  });

  it('creates a mock that returns full state when no selector provided', () => {
    const mockState = createMockCharacterStore({ loading: true });
    const mockHook = jest.fn();

    mockZustandStore(mockHook, mockState);

    // Test that calling without selector returns full state
    const result = mockHook();
    expect(result).toMatchObject({ loading: true });
  });

  it('properly types the mock return value', () => {
    const mockHook = jest.fn();
    const mockState = createMockCharacterStore();

    const typedMock = mockZustandStore(mockHook, mockState);

    // This test verifies TypeScript compilation - if types are wrong, this won't compile
    expect(jest.isMockFunction(typedMock)).toBe(true);
  });
});

describe('createMockCharacterStore', () => {
  it('allows overriding store values', () => {
    const customCreate = jest.fn().mockReturnValue('custom-id');
    const mock = createMockCharacterStore({
      create: customCreate,
      loading: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characters: { 'char-1': { id: 'char-1' } as any },
    });

    expect(mock.create).toBe(customCreate);
    expect(mock.loading).toBe(true);
    expect(mock.characters).toHaveProperty('char-1');
  });

  it('returns properly typed CharacterStore', () => {
    const mock = createMockCharacterStore();

    // TypeScript compilation ensures type safety
    expect(mock).toBeDefined();
  });
});

describe('createMockSessionStore', () => {
  it('allows overriding store values', () => {
    const mock = createMockSessionStore({
      id: 'session-1',
      status: 'active',
    });

    expect(mock.id).toBe('session-1');
    expect(mock.status).toBe('active');
  });
});

describe('createMockJournalStore', () => {
  it('allows overriding store values', () => {
    const mock = createMockJournalStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries: { 'entry-1': {} as any },
      loading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    expect(mock.entries).toHaveProperty('entry-1');
    expect(mock.loading).toBe(false);
  });
});

describe('createMockNarrativeStore', () => {
  it('allows overriding store values', () => {
    const mock = createMockNarrativeStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      segments: { 'seg-1': {} as any },
      currentSegmentId: 'seg-1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    expect(mock.segments).toHaveProperty('seg-1');
    expect(mock.currentSegmentId).toBe('seg-1');
  });
});

describe('createMockInventoryStore', () => {
  it('allows overriding store values', () => {
    const addItemMock = jest.fn();
    const mock = createMockInventoryStore({
      addItem: addItemMock,
      loading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    expect(mock.addItem).toBe(addItemMock);
    expect(mock.loading).toBe(false);
  });
});

describe('createMockNPCStore', () => {
  it('allows overriding store values', () => {
    const mock = createMockNPCStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      npcs: { 'npc-1': {} as any },
      loading: false,
    });

    expect(mock.npcs).toHaveProperty('npc-1');
    expect(mock.loading).toBe(false);
  });
});

describe('Integration: Using mock factories in actual test scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('eliminates need for type assertions when mocking stores', () => {
    // OLD PATTERN (what we're replacing):
    // (useCharacterStore as unknown as jest.Mock).mockReturnValue({...})

    // NEW PATTERN (what we're testing):
    const mockState = createMockCharacterStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characters: { 'char-1': { id: 'char-1', name: 'Test' } as any },
      loading: false,
    });

    mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, mockState);

    // Verify the mock works as expected
    const result = (useCharacterStore as jest.MockedFunction<typeof useCharacterStore>)();
    expect(result.characters).toHaveProperty('char-1');
    expect(result.loading).toBe(false);
  });

  it('supports selector pattern used in components', () => {
    const mockState = createMockSessionStore({
      id: 'session-1',
      status: 'active',
    });

    mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, mockState);

    // Simulate component using selector
    const sessionId = (useSessionStore as jest.MockedFunction<typeof useSessionStore>)(
      (state) => state.id
    );

    expect(sessionId).toBe('session-1');
  });
});
