import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';
import { useCharacterStore } from '../characterStore';
import { createTestCharacterData } from './characterStore.testHelpers';
import { extractWorldStateImpacts } from '../narrativeStore.worldStateImpacts';
import type { Decision } from '../../types/narrative.types';
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
    const characterId = useCharacterStore
      .getState()
      .createCharacter(createTestCharacterData({ worldId }));
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
      metadata: { tags: [], characterIds: [characterId, npcId] },
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
    useNarrativeStore
      .getState()
      .selectDecisionOption(decisionId, optionId, characterId);
    const worldState = useWorldStore.getState().getWorldState(worldId);
    expect(worldState.npcRelationships[npcId]).toBeDefined();
    expect(worldState.npcRelationships[npcId].trust).toBe(60);
    const eventDescriptions =
      worldState.majorEvents?.map((event) => event.description) || [];
    expect(eventDescriptions).toContain(
      'The kingdom celebrates your diplomatic victory.'
    );
  });
  it('applies option-level trust deltas and alignment shifts from one selection', () => {
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
    const sessionId = 'session-consequences';
    const npcId = 'npc-marta';
    const characterId = useCharacterStore
      .getState()
      .createCharacter(createTestCharacterData({ worldId }));
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
      content: 'Marta slides the ledger across the table.',
      type: 'scene',
      metadata: { tags: [], characterIds: [characterId, npcId] },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });
    const optionId = 'option-betray';
    const decisionId = useNarrativeStore.getState().addDecision(sessionId, {
      prompt: 'What do you do with the ledger?',
      options: [
        {
          id: optionId,
          text: 'Pocket the ledger while Marta is distracted.',
          alignment: 'chaotic',
          consequences: [
            {
              type: 'relationship',
              action: 'modify',
              targetId: npcId,
              value: { trustDelta: -15 },
            },
            {
              type: 'alignment',
              action: 'add',
              targetId: 'player-alignment',
              value: -8,
            },
          ],
        },
      ],
    });

    useNarrativeStore
      .getState()
      .selectDecisionOption(decisionId, optionId, characterId);

    const worldState = useWorldStore.getState().getWorldState(worldId);
    // Trust starts at the default 50 and the delta lands on top
    expect(worldState.npcRelationships[npcId].trust).toBe(35);
    expect(
      useCharacterStore.getState().characters[characterId].alignment
    ).toBe(-8);
  });
  it('writes nothing when the selected option has no consequences', () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Quiet Realm',
      description: 'No consequences here',
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
    const sessionId = 'session-quiet';
    const characterId = useCharacterStore
      .getState()
      .createCharacter(createTestCharacterData({ worldId }));
    const segmentTimestamp = new Date();
    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'A quiet moment passes.',
      type: 'scene',
      metadata: { tags: [], characterIds: [characterId] },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });
    const optionId = 'option-wait';
    const decisionId = useNarrativeStore.getState().addDecision(sessionId, {
      prompt: 'What now?',
      options: [{ id: optionId, text: 'Wait quietly.', alignment: 'neutral' }],
    });

    useNarrativeStore
      .getState()
      .selectDecisionOption(decisionId, optionId, characterId);

    const worldState = useWorldStore.getState().getWorldState(worldId);
    expect(Object.keys(worldState.npcRelationships)).toHaveLength(0);
    expect(
      useCharacterStore.getState().characters[characterId].alignment
    ).toBeUndefined();
  });
  it('drops relationship deltas for NPCs not present in the latest segment', () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Presence Test Realm',
      description: 'A realm for presence-gate tests',
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
    const sessionId = 'session-presence-gate';
    const presentNpcId = 'npc-present';
    const absentNpcId = 'npc-absent';
    const characterId = useCharacterStore
      .getState()
      .createCharacter(createTestCharacterData({ worldId }));
    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: new Date().toISOString(),
    });
    // Only npc-present is in the scene; npc-absent is not.
    const segmentTimestamp = new Date();
    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'The present NPC watches you from the corner.',
      type: 'scene',
      metadata: { tags: [], characterIds: [characterId, presentNpcId] },
      timestamp: segmentTimestamp,
      updatedAt: segmentTimestamp.toISOString(),
    });
    const optionId = 'option-act';
    const decisionId = useNarrativeStore.getState().addDecision(sessionId, {
      prompt: 'What do you do?',
      options: [
        {
          id: optionId,
          text: 'Do something notable.',
          alignment: 'neutral',
          consequences: [
            {
              type: 'relationship',
              action: 'add',
              targetId: presentNpcId,
              value: 12,
            },
            {
              type: 'relationship',
              action: 'add',
              targetId: absentNpcId,
              value: 8,
            },
          ],
        },
      ],
    });

    useNarrativeStore
      .getState()
      .selectDecisionOption(decisionId, optionId, characterId);

    const worldState = useWorldStore.getState().getWorldState(worldId);
    // Present NPC trust should move (default 50 + 12 = 62)
    expect(worldState.npcRelationships[presentNpcId]).toBeDefined();
    expect(worldState.npcRelationships[presentNpcId].trust).toBe(62);
    // Absent NPC should get nothing
    expect(worldState.npcRelationships[absentNpcId]).toBeUndefined();
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
    const characterId = useCharacterStore
      .getState()
      .createCharacter(createTestCharacterData({ worldId }));
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
      content:
        'You awaken in a dimly lit chamber. Ancient runes glow faintly on the walls.',
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
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Verify checkpoint was created for opening scene
    let worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(1);
    expect(worldState?.majorEvents?.[0]?.description).toBe(
      'Story begins at Ancient Chamber'
    );
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
    await new Promise((resolve) => setTimeout(resolve, 500));
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
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Verify significant event created a checkpoint
    expect(global.fetch).toHaveBeenCalledTimes(2);
    worldState = useWorldStore.getState().worldStates[worldId];
    expect(worldState?.majorEvents).toHaveLength(2);
    // Events are in reverse chronological order (newest first)
    expect(worldState?.majorEvents?.[0]?.description).toBe(
      'Character discovers the Tome of Forbidden Knowledge'
    );
    expect(worldState?.majorEvents?.[1]?.description).toBe(
      'Story begins at Ancient Chamber'
    );
    jest.restoreAllMocks();
  });
});

describe('extractWorldStateImpacts major-event detection', () => {
  const buildDecision = (prompt: string, optionText: string): Decision => ({
    id: 'decision-1',
    prompt,
    options: [{ id: 'option-1', text: optionText }],
  });

  it('reads the same major events out of a decision whatever genre its prose wears', () => {
    const fantasy = buildDecision(
      'The square fills as word spreads. What do you do?',
      "Join the kingdom's celebration in the square."
    );
    const civic = buildDecision(
      'The square fills as word spreads. What do you do?',
      "Join the borough's ribbon-cutting in the square."
    );

    const fantasyEvents = extractWorldStateImpacts(
      fantasy,
      fantasy.options[0],
      'character-1'
    ).events.map((event) => event.description);
    const civicEvents = extractWorldStateImpacts(
      civic,
      civic.options[0],
      'character-1'
    ).events.map((event) => event.description);

    expect(fantasyEvents).toEqual(civicEvents);
  });

  it('still records an event a consequence explicitly declares', () => {
    const decision: Decision = {
      id: 'decision-2',
      prompt: 'The council calls the vote. How do you argue?',
      options: [{ id: 'option-1', text: 'Read the inspection report aloud.' }],
      consequences: [
        {
          type: 'narrative',
          action: 'add',
          targetId: 'event',
          value: 'The council dissolved the water board.',
        },
      ],
    };

    const { events } = extractWorldStateImpacts(
      decision,
      decision.options[0],
      'character-1'
    );

    expect(events.map((event) => event.description)).toEqual([
      'The council dissolved the water board.',
    ]);
  });
});
