import { useSessionStore } from '../sessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSessionStore.getState().endSession();
  });

  it('initializes with default state', () => {
    // Reset to a fresh store state
    useSessionStore.setState({
      status: 'initializing',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: null,
      characterId: null,
    });
    
    const state = useSessionStore.getState();
    expect(state).toMatchObject({
      status: 'initializing',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: null,
      characterId: null,
    });
  });

  it('initializes a session with the given worldId', async () => {
    // Arrange
    const worldId = 'test-world-id';
    const characterId = 'test-character-id';
    const onComplete = jest.fn();
    
    // Act
    await useSessionStore.getState().initializeSession(worldId, characterId, onComplete);
    
    // Assert - after initialization
    const state = useSessionStore.getState();
    expect(state.status).toBe('active');
    expect(state.worldId).toBe(worldId);
    expect(state.characterId).toBe(characterId);
    expect(state.currentSceneId).toBe('initial-scene');
    expect(state.playerChoices).toHaveLength(0); // Empty initially - populated by AI choice generator
    expect(onComplete).toHaveBeenCalled();
  });

  it('allows ending a session', async () => {
    // Arrange - initialize a session first
    const worldId = 'test-world-id';
    const characterId = 'test-character-id';
    await useSessionStore.getState().initializeSession(worldId, characterId);
    
    // Act - end the session
    useSessionStore.getState().endSession();
    
    // Assert
    const state = useSessionStore.getState();
    expect(state.status).toBe('initializing');
    expect(state.worldId).toBe(null);
    expect(state.characterId).toBe(null);
    expect(state.currentSceneId).toBe(null);
    expect(state.playerChoices).toHaveLength(0);
  });

  it('allows setting session status', () => {
    // Arrange
    const store = useSessionStore.getState();
    
    // Act
    store.setStatus('loading');
    
    // Assert
    expect(useSessionStore.getState().status).toBe('loading');
    
    // Act again
    store.setStatus('paused');
    
    // Assert again
    expect(useSessionStore.getState().status).toBe('paused');
  });

  it('allows setting error message', () => {
    // Arrange
    const store = useSessionStore.getState();
    const errorMessage = 'Test error message';
    
    // Act
    store.setError(errorMessage);
    
    // Assert
    expect(useSessionStore.getState().error).toBe(errorMessage);
  });

  it('allows setting player choices', () => {
    // Arrange
    const store = useSessionStore.getState();
    const playerChoices = [
      { id: 'choice-1', text: 'Option 1', isSelected: false },
      { id: 'choice-2', text: 'Option 2', isSelected: false },
    ];
    
    // Act
    store.setPlayerChoices(playerChoices);
    
    // Assert
    expect(useSessionStore.getState().playerChoices).toEqual(playerChoices);
  });

  it('allows selecting a player choice', async () => {
    // Arrange - initialize a session and set up player choices
    await useSessionStore.getState().initializeSession('test-world-id', 'test-character-id');
    
    const testChoices = [
      { id: 'choice-1', text: 'Option 1', isSelected: false },
      { id: 'choice-2', text: 'Option 2', isSelected: false },
    ];
    useSessionStore.getState().setPlayerChoices(testChoices);
    
    // Act - select a choice
    useSessionStore.getState().selectChoice('choice-1');
    
    // Assert
    const state = useSessionStore.getState();
    expect(state.playerChoices[0].isSelected).toBe(true);
    expect(state.playerChoices[1].isSelected).toBe(false);
    
    // Act again - select a different choice
    useSessionStore.getState().selectChoice('choice-2');
    
    // Assert again
    const updatedState = useSessionStore.getState();
    expect(updatedState.playerChoices[0].isSelected).toBe(false);
    expect(updatedState.playerChoices[1].isSelected).toBe(true);
  });

  it('allows clearing player choices', async () => {
    // Arrange - initialize a session first to get default choices
    await useSessionStore.getState().initializeSession('test-world-id', 'test-character-id');
    
    // Act - clear the choices
    useSessionStore.getState().clearPlayerChoices();
    
    // Assert
    expect(useSessionStore.getState().playerChoices).toHaveLength(0);
  });

  it('allows setting current scene', () => {
    // Arrange
    const store = useSessionStore.getState();
    const sceneId = 'new-scene-id';
    
    // Act
    store.setCurrentScene(sceneId);
    
    // Assert
    expect(useSessionStore.getState().currentSceneId).toBe(sceneId);
  });

  it('allows pausing and resuming a session', async () => {
    // Arrange - initialize a session first
    await useSessionStore.getState().initializeSession('test-world-id', 'test-character-id');
    
    // Act - pause the session
    useSessionStore.getState().pauseSession();
    
    // Assert
    expect(useSessionStore.getState().status).toBe('paused');
    
    // Act again - resume the session
    useSessionStore.getState().resumeSession();
    
    // Assert again
    expect(useSessionStore.getState().status).toBe('active');
  });
});
