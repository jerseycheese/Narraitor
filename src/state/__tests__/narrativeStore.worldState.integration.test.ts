import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';

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
  beforeEach(() => {
    jest.useFakeTimers();
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
    const characterId = 'character-hero';
    const npcId = 'npc-guard';

    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });

    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'The guard eyes you suspiciously.',
      type: 'scene',
      metadata: { tags: [], characterIds: [characterId] },
      timestamp: new Date(),
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

    const eventDescriptions = worldState.majorEvents.map(event => event.description);
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
});
