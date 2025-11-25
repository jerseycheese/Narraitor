import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';
import { useCharacterStore } from '../characterStore';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

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

describe('Narrative store world state integration', () => {
  // Increase timeout for these async tests
  jest.setTimeout(30000);

  beforeEach(() => {
    // Don't use fake timers - these tests need real async behavior for fetch
    jest.useRealTimers();
    jest.setSystemTime(new Date('2025-02-01T12:00:00.000Z'));
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();
    resetSessionStore();
  });

  afterEach(() => {
    jest.useRealTimers();
    useNarrativeStore.getState().reset();
    useWorldStore.getState().reset();
    resetSessionStore();
  });

  it('updates world state when a decision with consequences is selected', () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Test Realm',
      description: 'A realm for integration tests',
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

    const sessionId = 'session-integration';
    const npcId = 'npc-guard';

    // Create character in store
    const characterId = useCharacterStore.getState().createCharacter({
      name: 'Test Hero',
      worldId,
      attributes: [],
      skills: [],
      storyGoals: [],
    });

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    const segmentTimestamp = new Date();
    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'The guard eyes you suspiciously.',
      type: 'scene',
      metadata: { tags: [], characterIds: [characterId] },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });

    const optionId = 'option-charm';
    const decisionId = useNarrativeStore.getState().addDecision(sessionId, {
      prompt: 'How do you convince the guard?',
      options: [
        {
          id: optionId,
          text: 'Appeal to the guard’s loyalty.',
          alignment: 'lawful',
        },
      ],
      consequences: [
        {
          type: 'relationship',
          action: 'add',
          targetId: npcId,
          value: 10,
          description: 'The guard now trusts you more.',
        },
        {
          type: 'narrative',
          action: 'add',
          targetId: 'event',
          value: 'The kingdom celebrates your diplomatic victory.',
        },
      ],
    });

    useNarrativeStore.getState().selectDecisionOption(decisionId, optionId, characterId);

    const worldState = useWorldStore.getState().getWorldState(worldId);
    expect(worldState.npcRelationships[npcId]).toBeDefined();
    expect(worldState.npcRelationships[npcId].trust).toBe(60);

    const eventDescriptions = worldState.majorEvents?.map(event => event.description) || [];
    expect(eventDescriptions).toContain('The kingdom celebrates your diplomatic victory.');
  });

  it('marks session lifecycle status as ended when markSessionEnded is called', () => {
    const worldId = 'existing-world';
    const sessionId = 'session-ending';

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId: 'character-x',
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    useNarrativeStore.getState().markSessionEnded(sessionId);

    const lifecycle = useSessionStore.getState().getSessionLifecycle(sessionId);
    expect(lifecycle?.status).toBe('ended');
  });

  it('creates checkpoint from opening scene ensuring Story So Far has content', async () => {
    // Mock fetch for validation API
    global.fetch = jest.fn();

    const worldId = useWorldStore.getState().createWorld({
      name: 'Adventure World',
      description: 'A world for testing checkpoint creation',
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

    const sessionId = 'session-checkpoint-flow';

    // Create character in store
    const characterId = useCharacterStore.getState().createCharacter({
      name: 'Test Adventurer',
      worldId,
      attributes: [],
      skills: [],
      storyGoals: [],
    });

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    // Step 1: Add opening segment (no majorEvent from AI)
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You awaken in a dimly lit chamber. Ancient runes glow faintly on the walls.',
      type: 'scene',
      metadata: {
        tags: ['intro'],
        characterIds: [characterId],
        location: 'Ancient Chamber',
      },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    // Allow async operations to complete (needs time for dynamic imports + async processing)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify checkpoint was created for opening scene
    let worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1);
    expect(worldState?.majorEvents?.[0]?.description).toBe('Story begins at Ancient Chamber');
    expect(global.fetch).not.toHaveBeenCalled(); // No validation for first segment

    // Step 2: Mock validation API to reject trivial event
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSignificant: false,
        reason: 'Walking is not a significant event',
      }),
    });

    // Add second segment with trivial event
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You walk across the chamber, your footsteps echoing.',
      type: 'scene',
      metadata: {
        tags: [],
        characterIds: [characterId],
        location: 'Ancient Chamber',
        majorEvent: 'Character walks across the chamber',
      },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    // Allow async operations to complete (needs time for dynamic imports + async processing)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify validation was called and trivial event was filtered out
    expect(global.fetch).toHaveBeenCalledTimes(1);
    worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1); // Still only the opening event

    // Step 3: Mock validation API to accept significant event
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSignificant: true,
        reason: 'Discovering ancient artifacts is significant',
      }),
    });

    // Add third segment with significant event
    await useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You discover an ancient tome containing forbidden knowledge.',
      type: 'scene',
      metadata: {
        tags: [],
        characterIds: [characterId],
        location: 'Ancient Chamber',
        majorEvent: 'Character discovers the Tome of Forbidden Knowledge',
      },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    // Allow async operations to complete (needs time for dynamic imports + async processing)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify significant event created a checkpoint
    expect(global.fetch).toHaveBeenCalledTimes(2);
    worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(2);
    // Events are in reverse chronological order (newest first)
    expect(worldState?.majorEvents?.[0]?.description).toBe('Character discovers the Tome of Forbidden Knowledge');
    expect(worldState?.majorEvents?.[1]?.description).toBe('Story begins at Ancient Chamber');

    jest.restoreAllMocks();
  });
});
