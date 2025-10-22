import { useSessionStore } from '../sessionStore';

describe('Session Persistence: savedSessions collection', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSessionStore.setState({
      id: null,
      status: 'initializing',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: null,
      characterId: null,
      savedSessions: {},
      templateHistory: [],
      autoSave: {
        enabled: true,
        lastSaveTime: null,
        status: 'idle',
        errorMessage: null,
        totalSaves: 0,
      },
      narrativeHeight: 600,
      onboardingCompleted: false,
    });
  });

  describe('updateSavedSessionNarrativeCount', () => {
    it('should create session entry in savedSessions when session has narrative content', async () => {
      // Arrange: Initialize a session
      const worldId = 'test-world-id';
      const characterId = 'test-character-id';
      await useSessionStore.getState().initializeSession(worldId, characterId);

      const sessionId = useSessionStore.getState().id;

      // Verify session not in savedSessions initially
      expect(useSessionStore.getState().savedSessions[sessionId!]).toBeUndefined();

      // Act: Update narrative count (simulating a narrative segment being added)
      useSessionStore.getState().updateSavedSessionNarrativeCount(sessionId!, 1);

      // Assert: Session should now be in savedSessions
      const savedSession = useSessionStore.getState().savedSessions[sessionId!];
      expect(savedSession).toBeDefined();
      expect(savedSession.id).toBe(sessionId);
      expect(savedSession.worldId).toBe(worldId);
      expect(savedSession.characterId).toBe(characterId);
      expect(savedSession.narrativeCount).toBe(1);
      expect(savedSession.lastPlayed).toBeDefined();
    });

    it('should update narrativeCount for existing saved session', () => {
      // Arrange: Create a session already in savedSessions
      const sessionId = 'test-session-id';
      const worldId = 'test-world-id';
      const characterId = 'test-character-id';

      useSessionStore.setState({
        savedSessions: {
          [sessionId]: {
            id: sessionId,
            worldId,
            characterId,
            lastPlayed: '2025-01-01T00:00:00.000Z',
            narrativeCount: 2,
          },
        },
      });

      // Act: Update narrative count
      useSessionStore.getState().updateSavedSessionNarrativeCount(sessionId, 3);

      // Assert: Count should be updated
      const savedSession = useSessionStore.getState().savedSessions[sessionId];
      expect(savedSession.narrativeCount).toBe(3);
      expect(savedSession.lastPlayed).not.toBe('2025-01-01T00:00:00.000Z'); // Should be updated
    });

    it('should not create session entry for non-active session', () => {
      // Arrange: No active session
      const randomSessionId = 'random-session-id';

      // Act: Try to update narrative count for non-existent session
      useSessionStore.getState().updateSavedSessionNarrativeCount(randomSessionId, 1);

      // Assert: Session should not be created
      expect(useSessionStore.getState().savedSessions[randomSessionId]).toBeUndefined();
    });

    it('should update lastPlayed timestamp when narrative count increases', () => {
      // Arrange: Create active session and add it to savedSessions
      const worldId = 'test-world-id';
      const characterId = 'test-character-id';
      useSessionStore.setState({
        id: 'test-session-id',
        worldId,
        characterId,
        status: 'active',
        savedSessions: {
          'test-session-id': {
            id: 'test-session-id',
            worldId,
            characterId,
            lastPlayed: '2025-01-01T00:00:00.000Z',
            narrativeCount: 1,
          },
        },
      });

      const oldTimestamp = useSessionStore.getState().savedSessions['test-session-id'].lastPlayed;

      // Wait a tick to ensure timestamp difference
      const delay = () => new Promise(resolve => setTimeout(resolve, 10));

      // Act: Update narrative count
      return delay().then(() => {
        useSessionStore.getState().updateSavedSessionNarrativeCount('test-session-id', 2);

        // Assert: Timestamp should be updated
        const savedSession = useSessionStore.getState().savedSessions['test-session-id'];
        expect(savedSession.lastPlayed).not.toBe(oldTimestamp);
        expect(savedSession.narrativeCount).toBe(2);
      });
    });
  });

  describe('Session persistence during gameplay', () => {
    it('should persist session when narrative content is added during normal gameplay', async () => {
      // This test verifies the core bug fix: sessions should appear in savedSessions
      // when users play through the game normally (without explicitly calling endSession)

      // Arrange: Initialize a session (like when user starts playing)
      const worldId = 'gameplay-world';
      const characterId = 'gameplay-character';
      await useSessionStore.getState().initializeSession(worldId, characterId);

      const sessionId = useSessionStore.getState().id;

      // Initially, savedSessions should be empty
      expect(Object.keys(useSessionStore.getState().savedSessions)).toHaveLength(0);

      // Act: Simulate narrative segment being added (this would happen when AI generates narrative)
      // The narrativeStore would call this when segments are added
      useSessionStore.getState().updateSavedSessionNarrativeCount(sessionId!, 1);

      // Assert: Session should now exist in savedSessions for "Continue Last Game"
      expect(Object.keys(useSessionStore.getState().savedSessions)).toHaveLength(1);
      const savedSession = useSessionStore.getState().savedSessions[sessionId!];
      expect(savedSession).toBeDefined();
      expect(savedSession.worldId).toBe(worldId);
      expect(savedSession.characterId).toBe(characterId);
      expect(savedSession.narrativeCount).toBe(1);
    });
  });
});
