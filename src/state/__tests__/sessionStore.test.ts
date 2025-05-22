import { sessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    sessionStore.getState().endSession();
  });

  it('initializes with default state', () => {
    // Reset to a fresh store state
    sessionStore.setState({
      status: 'initializing',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: null,
    });
    
    const state = sessionStore.getState();
    expect(state).toMatchObject({
      status: 'initializing',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: null,
    });
  });

  it('initializes a session with the given worldId', async () => {
    // Arrange
    const worldId = 'test-world-id';
    const onComplete = jest.fn();
    
    // Act
    await sessionStore.getState().initializeSession(worldId, onComplete);
    
    // Assert - after initialization
    const state = sessionStore.getState();
    expect(state.status).toBe('active');
    expect(state.worldId).toBe(worldId);
    expect(state.currentSceneId).toBe('initial-scene');
    expect(state.playerChoices).toHaveLength(0); // Empty initially - populated by AI choice generator
    expect(onComplete).toHaveBeenCalled();
  });

  it('allows ending a session', async () => {
    // Arrange - initialize a session first
    const worldId = 'test-world-id';
    await sessionStore.getState().initializeSession(worldId);
    
    // Act - end the session
    sessionStore.getState().endSession();
    
    // Assert
    const state = sessionStore.getState();
    expect(state.status).toBe('initializing');
    expect(state.worldId).toBe(null);
    expect(state.currentSceneId).toBe(null);
    expect(state.playerChoices).toHaveLength(0);
  });

  it('allows setting session status', () => {
    // Arrange
    const store = sessionStore.getState();
    
    // Act
    store.setStatus('loading');
    
    // Assert
    expect(sessionStore.getState().status).toBe('loading');
    
    // Act again
    store.setStatus('paused');
    
    // Assert again
    expect(sessionStore.getState().status).toBe('paused');
  });

  it('allows setting error message', () => {
    // Arrange
    const store = sessionStore.getState();
    const errorMessage = 'Test error message';
    
    // Act
    store.setError(errorMessage);
    
    // Assert
    expect(sessionStore.getState().error).toBe(errorMessage);
  });

  it('allows setting player choices', () => {
    // Arrange
    const store = sessionStore.getState();
    const playerChoices = [
      { id: 'choice-1', text: 'Option 1', isSelected: false },
      { id: 'choice-2', text: 'Option 2', isSelected: false },
    ];
    
    // Act
    store.setPlayerChoices(playerChoices);
    
    // Assert
    expect(sessionStore.getState().playerChoices).toEqual(playerChoices);
  });

  it('allows selecting a player choice', async () => {
    // Arrange - initialize a session and set up player choices
    await sessionStore.getState().initializeSession('test-world-id');
    
    const testChoices = [
      { id: 'choice-1', text: 'Option 1', isSelected: false },
      { id: 'choice-2', text: 'Option 2', isSelected: false },
    ];
    sessionStore.getState().setPlayerChoices(testChoices);
    
    // Act - select a choice
    sessionStore.getState().selectChoice('choice-1');
    
    // Assert
    const state = sessionStore.getState();
    expect(state.playerChoices[0].isSelected).toBe(true);
    expect(state.playerChoices[1].isSelected).toBe(false);
    
    // Act again - select a different choice
    sessionStore.getState().selectChoice('choice-2');
    
    // Assert again
    const updatedState = sessionStore.getState();
    expect(updatedState.playerChoices[0].isSelected).toBe(false);
    expect(updatedState.playerChoices[1].isSelected).toBe(true);
  });

  it('allows clearing player choices', async () => {
    // Arrange - initialize a session first to get default choices
    await sessionStore.getState().initializeSession('test-world-id');
    
    // Act - clear the choices
    sessionStore.getState().clearPlayerChoices();
    
    // Assert
    expect(sessionStore.getState().playerChoices).toHaveLength(0);
  });

  it('allows setting current scene', () => {
    // Arrange
    const store = sessionStore.getState();
    const sceneId = 'new-scene-id';
    
    // Act
    store.setCurrentScene(sceneId);
    
    // Assert
    expect(sessionStore.getState().currentSceneId).toBe(sceneId);
  });

  it('allows pausing and resuming a session', async () => {
    // Arrange - initialize a session first
    await sessionStore.getState().initializeSession('test-world-id');
    
    // Act - pause the session
    sessionStore.getState().pauseSession();
    
    // Assert
    expect(sessionStore.getState().status).toBe('paused');
    
    // Act again - resume the session
    sessionStore.getState().resumeSession();
    
    // Assert again
    expect(sessionStore.getState().status).toBe('active');
  });
});
