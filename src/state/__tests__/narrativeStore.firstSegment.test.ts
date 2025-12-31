import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';
import { useCharacterStore } from '../characterStore';
import { createTestCharacterData } from './characterStore.testHelpers';

const resetSessionStore = () => {
  useSessionStore.setState(() => ({
    id: null,
    status: 'initializing',
    currentSceneId: null,
    playerChoices: [],
    error: null,
    worldId: null,
    characterId: null,
    savedSessions: {},
    sessionLifecycle: {},
    templateHistory: [],
    autoSave: {
      enabled: true,
      lastSaveTime: null,
      status: 'idle',
      errorMessage: null,
      totalSaves: 0,
    },
    onboardingCompleted: false,
    narrativeHeight: 600,
  }));
};

describe('First segment checkpoint creation', () => {
  // Increase timeout for these async tests
  jest.setTimeout(30000);

  beforeEach(() => {
    // Don't use fake timers - these tests need real async behavior for fetch
    jest.useRealTimers();
    jest.setSystemTime(new Date('2025-02-01T12:00:00.000Z'));
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();
    resetSessionStore();

    // Mock fetch for validation API
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    useNarrativeStore.getState().reset();
    useWorldStore.getState().reset();
    resetSessionStore();
    jest.restoreAllMocks();
  });

  it('creates checkpoint for first segment even without AI majorEvent', async () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
        attributes: [],
        skills: [],
    
        settings: {
        maxAttributes: 5,
        maxSkills: 5,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    const sessionId = 'session-first-test';

    // Create character in store
    const characterId = useCharacterStore.getState().createCharacter(
      createTestCharacterData({ worldId })
    );

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    const segmentTimestamp = new Date();

    // Add first segment WITHOUT majorEvent in metadata
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You find yourself in a bustling tavern. The smell of ale and roasted meat fills the air.',
      type: 'scene',
      metadata: {
        tags: ['intro'],
        characterIds: [characterId],
        location: 'The Prancing Pony Tavern',
        // Note: NO majorEvent here
      },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });

    // Allow async operations to complete (needs time for dynamic imports + async processing)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify a major event was created in world state
    const worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1);
    expect(worldState?.majorEvents?.[0]?.description).toBe('Story begins at The Prancing Pony Tavern');

    // Verify validation API was NOT called for first segment
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses AI majorEvent for first segment if provided', async () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'sci-fi',
        attributes: [],
        skills: [],
    
        settings: {
        maxAttributes: 5,
        maxSkills: 5,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    const sessionId = 'session-ai-event';

    // Create character in store
    const characterId = useCharacterStore.getState().createCharacter(
      createTestCharacterData({ worldId })
    );

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    const segmentTimestamp = new Date();
    const aiMajorEvent = 'Your ship crashes on an uncharted planet';

    // Add first segment WITH AI-provided majorEvent
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'Alarms blare as your ship spirals toward the planet surface.',
      type: 'scene',
      metadata: {
        tags: ['intro'],
        characterIds: [characterId],
        location: 'Crashed Starship',
        majorEvent: aiMajorEvent,
      },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify AI's major event was used
    const worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1);
    expect(worldState?.majorEvents?.[0]?.description).toBe(aiMajorEvent);

    // Verify validation API was NOT called for first segment
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates subsequent segments normally', async () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
        attributes: [],
        skills: [],
    
        settings: {
        maxAttributes: 5,
        maxSkills: 5,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    const sessionId = 'session-validation';

    // Create character in store
    const characterId = useCharacterStore.getState().createCharacter(
      createTestCharacterData({ worldId })
    );

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    const segmentTimestamp = new Date();

    // Add first segment (checkpoint created, no validation)
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'Opening scene',
      type: 'scene',
      metadata: {
        tags: ['intro'],
        characterIds: [characterId],
        location: 'Tavern',
      },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify first segment created event WITHOUT validation
    expect(global.fetch).not.toHaveBeenCalled();
    const worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1);

    // Mock validation API to reject trivial event
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSignificant: false,
        reason: 'This is a trivial movement event',
      }),
    });

    // Add second segment with trivial majorEvent
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You walk to the bar.',
      type: 'scene',
      metadata: {
        tags: [],
        characterIds: [characterId],
        location: 'Tavern',
        majorEvent: 'Character walks to the bar',
      },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify validation API WAS called for second segment
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/narrative/validate-event-significance',
      expect.objectContaining({
        method: 'POST',
      })
    );

    // Verify trivial event was filtered out (still only 1 major event)
    const updatedWorldState = useWorldStore.getState().worldStates[worldId];
    expect(updatedWorldState?.majorEvents).toHaveLength(1);
  });

  it('creates default opening event when no location provided', async () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
        attributes: [],
        skills: [],
    
        settings: {
        maxAttributes: 5,
        maxSkills: 5,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    const sessionId = 'session-no-location';

    // Create character in store
    const characterId = useCharacterStore.getState().createCharacter(
      createTestCharacterData({ worldId })
    );

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    // Add first segment without location or majorEvent
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'A mysterious beginning...',
      type: 'scene',
      metadata: {
        tags: ['intro'],
        characterIds: [characterId],
        // No location, no majorEvent
      },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify default opening event was created
    const worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1);
    expect(worldState?.majorEvents?.[0]?.description).toBe('Your adventure begins');
  });
});
