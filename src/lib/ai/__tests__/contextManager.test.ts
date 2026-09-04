import { buildEndingContext } from '../contextManager';
import {
  createMockWorld,
  createMockNarrativeSegment,
  createMockJournalEntry,
} from '@/lib/test-utils/testDataFactory';
import type { EndingGenerationRequest } from '@/types/narrative.types';
import type { StoreCharacter } from '@/state/characterStore';
import type { SavedSessionInfo } from '@/types/game.types';

jest.mock('@/state/worldStore', () => ({
  useWorldStore: { getState: jest.fn() },
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: { getState: jest.fn() },
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: { getState: jest.fn() },
}));

jest.mock('@/state/journalStore', () => ({
  useJournalStore: { getState: jest.fn() },
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: { getState: jest.fn() },
}));

const { useWorldStore } = jest.requireMock('@/state/worldStore');
const { useCharacterStore } = jest.requireMock('@/state/characterStore');
const { useNarrativeStore } = jest.requireMock('@/state/narrativeStore');
const { useJournalStore } = jest.requireMock('@/state/journalStore');
const { useSessionStore } = jest.requireMock('@/state/sessionStore');

const mockWorldStoreGetState = useWorldStore.getState as jest.Mock;
const mockCharacterStoreGetState = useCharacterStore.getState as jest.Mock;
const mockNarrativeStoreGetState = useNarrativeStore.getState as jest.Mock;
const mockJournalStoreGetState = useJournalStore.getState as jest.Mock;
const mockSessionStoreGetState = useSessionStore.getState as jest.Mock;

describe('buildEndingContext', () => {
  const request: EndingGenerationRequest = {
    sessionId: 'session-1',
    characterId: 'character-1',
    worldId: 'world-1',
    endingType: 'story-complete',
    desiredTone: 'triumphant',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pulls world and character from the stores when not provided in the request', async () => {
    const world = createMockWorld({ id: request.worldId });
    const character: StoreCharacter = {
      id: request.characterId,
      name: 'Test Character',
      description: 'A test character from the store',
      worldId: request.worldId,
      level: 1,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: {
        history: 'Some backstory',
        personality: 'Curious',
        goals: [],
        fears: [],
        relationships: [],
        physicalDescription: undefined,
        isKnownFigure: false,
        knownFigureType: undefined,
      },
      isPlayer: true,
      status: {
        conditions: [],
        location: undefined,
      },
      inventory: {
        characterId: request.characterId,
        items: [],
        capacity: 10,
        categories: [],
        itemOrder: [],
      },
      portrait: undefined,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockWorldStoreGetState.mockReturnValue({ worlds: { [world.id]: world } });
    mockCharacterStoreGetState.mockReturnValue({
      characters: { [character.id]: character },
    });
    mockNarrativeStoreGetState.mockReturnValue({ segments: {} });
    mockJournalStoreGetState.mockReturnValue({ entries: {} });
    mockSessionStoreGetState.mockReturnValue({ savedSessions: {} });

    const context = await buildEndingContext(request);

    expect(context.world).toEqual(world);
    expect(context.character).toEqual(character);
    expect(context.narrativeSegments).toHaveLength(0);
    expect(context.journalEntries).toEqual([]);
  });

  it('sorts session segments chronologically and filters by session', async () => {
    const world = createMockWorld({ id: request.worldId });
    const character = {
      id: request.characterId,
      name: 'Chrono Knight',
      description: 'Keeps track of time',
      worldId: request.worldId,
      level: 3,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: {
        history: 'Time traveler',
        personality: 'Precise',
        goals: [],
        fears: [],
        relationships: [],
        physicalDescription: undefined,
        isKnownFigure: false,
        knownFigureType: undefined,
      },
      isPlayer: false,
      status: {
        conditions: [],
        location: 'Clocktower',
      },
      inventory: {
        characterId: request.characterId,
        items: [],
        capacity: 20,
        categories: [],
        itemOrder: [],
      },
      portrait: undefined,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as StoreCharacter;
    const older = createMockNarrativeSegment({
      id: 'seg-1',
      sessionId: request.sessionId,
      timestamp: new Date('2024-01-01T10:00:00Z'),
      content: 'older',
    });
    const newer = createMockNarrativeSegment({
      id: 'seg-2',
      sessionId: request.sessionId,
      timestamp: new Date('2024-01-01T11:00:00Z'),
      content: 'newer',
    });
    const otherSession = createMockNarrativeSegment({
      id: 'seg-3',
      sessionId: 'session-2',
      timestamp: new Date('2024-01-01T09:00:00Z'),
    });

    mockWorldStoreGetState.mockReturnValue({ worlds: { [world.id]: world } });
    mockCharacterStoreGetState.mockReturnValue({
      characters: { [character.id]: character },
    });
    mockNarrativeStoreGetState.mockReturnValue({
      segments: {
        [older.id]: older,
        [newer.id]: newer,
        [otherSession.id]: otherSession,
      },
    });
    mockJournalStoreGetState.mockReturnValue({ entries: {} });
    mockSessionStoreGetState.mockReturnValue({ savedSessions: {} });

    const context = await buildEndingContext(request);

    expect(context.narrativeSegments).toEqual([older, newer]);
  });

  it('includes journal entries and session start time when available', async () => {
    const world = createMockWorld({ id: request.worldId });
    const character = {
      id: request.characterId,
      name: 'Journal Keeper',
      description: 'Records everything',
      worldId: request.worldId,
      level: 5,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: {
        history: 'Chronicler of events',
        personality: 'Observant',
        goals: [],
        fears: [],
        relationships: [],
        physicalDescription: undefined,
        isKnownFigure: false,
        knownFigureType: undefined,
      },
      isPlayer: true,
      status: {
        conditions: [],
        location: 'Library',
      },
      inventory: {
        characterId: request.characterId,
        items: [],
        capacity: 30,
        categories: [],
        itemOrder: [],
      },
      portrait: undefined,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as StoreCharacter;
    const matchingEntry = createMockJournalEntry({
      id: 'journal-1',
      sessionId: request.sessionId,
    });
    const otherEntry = createMockJournalEntry({
      id: 'journal-2',
      sessionId: 'session-2',
    });
    const session: SavedSessionInfo = {
      id: request.sessionId,
      worldId: request.worldId,
      characterId: request.characterId,
      lastPlayed: '2024-01-01T09:30:00Z',
      narrativeCount: 5,
    };

    mockWorldStoreGetState.mockReturnValue({ worlds: { [world.id]: world } });
    mockCharacterStoreGetState.mockReturnValue({
      characters: { [character.id]: character },
    });
    mockNarrativeStoreGetState.mockReturnValue({ segments: {} });
    mockJournalStoreGetState.mockReturnValue({
      entries: {
        [matchingEntry.id]: matchingEntry,
        [otherEntry.id]: otherEntry,
      },
    });
    mockSessionStoreGetState.mockReturnValue({
      savedSessions: { [session.id]: session },
    });

    const context = await buildEndingContext(request);

    expect(context.journalEntries).toEqual([matchingEntry]);
    expect(context.sessionStartTime).toEqual(new Date(session.lastPlayed));
  });

  it('throws when the world cannot be resolved', async () => {
    mockWorldStoreGetState.mockReturnValue({ worlds: {} });
    mockCharacterStoreGetState.mockReturnValue({ characters: {} });
    mockNarrativeStoreGetState.mockReturnValue({ segments: {} });
    mockJournalStoreGetState.mockReturnValue({ entries: {} });
    mockSessionStoreGetState.mockReturnValue({ savedSessions: {} });

    await expect(buildEndingContext(request)).rejects.toThrow(
      `World not found: ${request.worldId}`
    );
  });

  it('throws when the character cannot be resolved', async () => {
    const world = createMockWorld({ id: request.worldId });

    mockWorldStoreGetState.mockReturnValue({ worlds: { [world.id]: world } });
    mockCharacterStoreGetState.mockReturnValue({ characters: {} });
    mockNarrativeStoreGetState.mockReturnValue({ segments: {} });
    mockJournalStoreGetState.mockReturnValue({ entries: {} });
    mockSessionStoreGetState.mockReturnValue({ savedSessions: {} });

    await expect(buildEndingContext(request)).rejects.toThrow(
      `Character not found: ${request.characterId}`
    );
  });
});
