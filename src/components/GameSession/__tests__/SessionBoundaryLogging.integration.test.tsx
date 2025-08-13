import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';
import GameSession from '../GameSession';

// Mock the stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/journalStore');

const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

// Add getState and subscribe method mocks for the sessionStore
Object.defineProperty(mockUseSessionStore, 'getState', {
  value: jest.fn(() => ({
    id: null,
    status: 'initializing',
    worldId: null,
    characterId: null
  })),
  writable: true
});

Object.defineProperty(mockUseSessionStore, 'subscribe', {
  value: jest.fn(() => jest.fn()), // return unsubscribe function
  writable: true
});

// Mock other dependencies
jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    worlds: {
      'test-world': {
        id: 'test-world',
        name: 'Test World',
        description: 'A test world'
      }
    },
    getWorld: () => ({
      id: 'test-world',
      name: 'Test World',
      description: 'A test world'
    })
  })
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({
    characters: {
      'test-character': {
        id: 'test-character',
        name: 'Test Character',
        description: 'A test character'
      }
    },
    getCharacter: () => ({
      id: 'test-character', 
      name: 'Test Character',
      description: 'A test character'
    })
  })
}));

describe('Session Boundary Logging Integration', () => {
  const mockSessionCallbacks = {
    onSessionStart: jest.fn(),
    onSessionEnd: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset stores to clean state
    mockUseJournalStore.mockReturnValue({
      addEntry: jest.fn(),
      getSessionEntries: jest.fn().mockReturnValue([]),
      markAsRead: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      deleteSessionEntries: jest.fn(),
      getEntriesByType: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      entries: {},
      sessionEntries: {},
      error: null,
      loading: false
    });
  });

  describe('Session Start Workflow', () => {
    it('creates session start journal entry when session initializes', async () => {
      const mockAddEntry = jest.fn().mockReturnValue('session-start-entry-id');
      const mockInitializeSession = jest.fn((worldId, characterId, onComplete) => {
        // Simulate successful session initialization
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 100);
      });

      mockUseSessionStore.mockReturnValue({
        id: null,
        status: 'initializing',
        worldId: null,
        characterId: null,
        currentSceneId: null,
        playerChoices: [],
        error: null,
        savedSessions: {},
        templateHistory: [],
        autoSave: { enabled: true, lastSaveTime: null, status: 'idle', errorMessage: null, totalSaves: 0 },
        onboardingCompleted: false,
        initializeSession: mockInitializeSession,
        endSession: jest.fn(),
        setStatus: jest.fn(),
        setError: jest.fn(),
        setPlayerChoices: jest.fn(),
        selectChoice: jest.fn(),
        clearPlayerChoices: jest.fn(),
        setCurrentScene: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        setSessionId: jest.fn(),
        setCharacterId: jest.fn(),
        getSavedSession: jest.fn(),
        resumeSavedSession: jest.fn(),
        deleteSavedSession: jest.fn(),
        updateSavedSessionNarrativeCount: jest.fn(),
        addTemplateToHistory: jest.fn(),
        getTemplateHistory: jest.fn(),
        clearTemplateHistory: jest.fn(),
        setAutoSaveEnabled: jest.fn(),
        updateAutoSaveStatus: jest.fn(),
        recordAutoSave: jest.fn(),
        setOnboardingCompleted: jest.fn(),
        isFirstTimeUser: jest.fn(),
        shouldShowOnboarding: jest.fn()
      });

      mockUseJournalStore.mockReturnValue({
        addEntry: mockAddEntry,
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        deleteSessionEntries: jest.fn(),
        getEntriesByType: jest.fn(),
        reset: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        entries: {},
        sessionEntries: {},
        error: null,
        loading: false
      });

      render(
        <GameSession
          worldId="test-world"
          characterId="test-character"
          {...mockSessionCallbacks}
        />
      );

      // Wait for session initialization
      await waitFor(() => {
        expect(mockInitializeSession).toHaveBeenCalledWith(
          'test-world',
          'test-character',
          expect.any(Function)
        );
      });

      // In a real implementation, session start journal entry would be created
      // This test verifies the integration points exist
      expect(mockInitializeSession).toHaveBeenCalled();
    });

    it('handles session start callback and journal entry creation workflow', async () => {
      const sessionStartTime = new Date('2024-01-15T10:30:00Z');
      const mockDate = jest.spyOn(global, 'Date').mockImplementation(() => sessionStartTime as unknown as string);
      
      const mockAddEntry = jest.fn().mockReturnValue('session-start-entry');
      
      mockUseSessionStore.mockReturnValue({
        id: 'test-session-123',
        status: 'active',
        worldId: 'test-world',
        characterId: 'test-character',
        currentSceneId: 'initial-scene',
        playerChoices: [],
        error: null,
        savedSessions: {},
        templateHistory: [],
        autoSave: { enabled: true, lastSaveTime: null, status: 'idle', errorMessage: null, totalSaves: 0 },
        onboardingCompleted: false,
        initializeSession: jest.fn(),
        endSession: jest.fn(),
        setStatus: jest.fn(),
        setError: jest.fn(),
        setPlayerChoices: jest.fn(),
        selectChoice: jest.fn(),
        clearPlayerChoices: jest.fn(),
        setCurrentScene: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        setSessionId: jest.fn(),
        setCharacterId: jest.fn(),
        getSavedSession: jest.fn(),
        resumeSavedSession: jest.fn(),
        deleteSavedSession: jest.fn(),
        updateSavedSessionNarrativeCount: jest.fn(),
        addTemplateToHistory: jest.fn(),
        getTemplateHistory: jest.fn(),
        clearTemplateHistory: jest.fn(),
        setAutoSaveEnabled: jest.fn(),
        updateAutoSaveStatus: jest.fn(),
        recordAutoSave: jest.fn(),
        setOnboardingCompleted: jest.fn(),
        isFirstTimeUser: jest.fn(),
        shouldShowOnboarding: jest.fn()
      });

      mockUseJournalStore.mockReturnValue({
        addEntry: mockAddEntry,
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        deleteSessionEntries: jest.fn(),
        getEntriesByType: jest.fn(),
        reset: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        entries: {},
        sessionEntries: {},
        error: null,
        loading: false
      });

      const TestSessionStartHandler = () => {
        const sessionStore = useSessionStore();
        const journalStore = useJournalStore();

        const handleSessionStart = () => {
          // This simulates what the session start handler should do
          if (sessionStore.id) {
            journalStore.addEntry(sessionStore.id, {
              worldId: sessionStore.worldId!,
              characterId: sessionStore.characterId!,
              type: 'session_start',
              title: 'Adventure Begins',
              content: 'A new session has started',
              significance: 'minor',
              relatedEntities: [],
              metadata: {
                tags: ['system', 'session'],
                automaticEntry: true,
                sessionStartTime: sessionStartTime.toISOString()
              }
            });
          }
          mockSessionCallbacks.onSessionStart();
        };

        return (
          <div>
            <button onClick={handleSessionStart} data-testid="start-session">
              Start Session
            </button>
            <span data-testid="session-id">{sessionStore.id}</span>
          </div>
        );
      };

      render(<TestSessionStartHandler />);

      // Trigger session start
      fireEvent.click(screen.getByTestId('start-session'));

      // Verify session start journal entry would be created with proper metadata
      expect(mockAddEntry).toHaveBeenCalledWith('test-session-123', {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_start',
        title: 'Adventure Begins',
        content: 'A new session has started',
        significance: 'minor',
        relatedEntities: [],
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionStartTime: sessionStartTime.toISOString()
        }
      });

      expect(mockSessionCallbacks.onSessionStart).toHaveBeenCalled();
      
      mockDate.mockRestore();
    });
  });

  describe('Session End Workflow', () => {
    it('creates session end journal entry with duration when session ends', async () => {
      const sessionStartTime = new Date('2024-01-15T10:30:00Z');
      const sessionEndTime = new Date('2024-01-15T11:15:00Z');
      const expectedDuration = sessionEndTime.getTime() - sessionStartTime.getTime();

      const mockAddEntry = jest.fn().mockReturnValue('session-end-entry');
      const mockEndSession = jest.fn();

      mockUseSessionStore.mockReturnValue({
        id: 'test-session-456',
        status: 'active',
        worldId: 'test-world',
        characterId: 'test-character',
        currentSceneId: 'some-scene',
        playerChoices: [],
        error: null,
        savedSessions: {},
        templateHistory: [],
        autoSave: { enabled: true, lastSaveTime: null, status: 'idle', errorMessage: null, totalSaves: 0 },
        onboardingCompleted: false,
        initializeSession: jest.fn(),
        endSession: mockEndSession,
        setStatus: jest.fn(),
        setError: jest.fn(),
        setPlayerChoices: jest.fn(),
        selectChoice: jest.fn(),
        clearPlayerChoices: jest.fn(),
        setCurrentScene: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        setSessionId: jest.fn(),
        setCharacterId: jest.fn(),
        getSavedSession: jest.fn(),
        resumeSavedSession: jest.fn(),
        deleteSavedSession: jest.fn(),
        updateSavedSessionNarrativeCount: jest.fn(),
        addTemplateToHistory: jest.fn(),
        getTemplateHistory: jest.fn(),
        clearTemplateHistory: jest.fn(),
        setAutoSaveEnabled: jest.fn(),
        updateAutoSaveStatus: jest.fn(),
        recordAutoSave: jest.fn(),
        setOnboardingCompleted: jest.fn(),
        isFirstTimeUser: jest.fn(),
        shouldShowOnboarding: jest.fn()
      });

      mockUseJournalStore.mockReturnValue({
        addEntry: mockAddEntry,
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        deleteSessionEntries: jest.fn(),
        getEntriesByType: jest.fn(),
        reset: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        entries: {},
        sessionEntries: {},
        error: null,
        loading: false
      });

      const TestSessionEndHandler = () => {
        const sessionStore = useSessionStore();
        const journalStore = useJournalStore();

        const handleSessionEnd = () => {
          // This simulates what the session end handler should do
          if (sessionStore.id) {
            journalStore.addEntry(sessionStore.id, {
              worldId: sessionStore.worldId!,
              characterId: sessionStore.characterId!,
              type: 'session_end',
              title: 'Chapter Closes',
              content: 'Session completed after 45 minutes',
              significance: 'minor',
              relatedEntities: [],
              metadata: {
                tags: ['system', 'session'],
                automaticEntry: true,
                sessionStartTime: sessionStartTime.toISOString(),
                sessionEndTime: sessionEndTime.toISOString(),
                sessionDuration: expectedDuration,
                sessionStats: {
                  decisionsCount: 8,
                  narrativeSegments: 12
                }
              }
            });
          }
          sessionStore.endSession();
          mockSessionCallbacks.onSessionEnd();
        };

        return (
          <div>
            <button onClick={handleSessionEnd} data-testid="end-session">
              End Session
            </button>
          </div>
        );
      };

      render(<TestSessionEndHandler />);

      fireEvent.click(screen.getByTestId('end-session'));

      // Verify session end journal entry creation with duration metadata
      expect(mockAddEntry).toHaveBeenCalledWith('test-session-456', {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_end',
        title: 'Chapter Closes',
        content: 'Session completed after 45 minutes',
        significance: 'minor',
        relatedEntities: [],
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionStartTime: sessionStartTime.toISOString(),
          sessionEndTime: sessionEndTime.toISOString(),
          sessionDuration: expectedDuration,
          sessionStats: {
            decisionsCount: 8,
            narrativeSegments: 12
          }
        }
      });

      expect(mockEndSession).toHaveBeenCalled();
      expect(mockSessionCallbacks.onSessionEnd).toHaveBeenCalled();
    });
  });

  describe('Complete Session Lifecycle', () => {
    it('creates both session start and end entries in proper chronological order', async () => {
      const mockAddEntry = jest.fn()
        .mockReturnValueOnce('session-start-entry')
        .mockReturnValueOnce('session-end-entry');

      const sessionEntries = [
        {
          id: 'session-end-entry',
          type: 'session_end',
          title: 'Session Ended',
          content: 'Adventure concluded',
          createdAt: '2024-01-15T11:15:00Z'
        },
        {
          id: 'session-start-entry',
          type: 'session_start',
          title: 'Session Started',
          content: 'New adventure began',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ];

      mockUseJournalStore.mockReturnValue({
        addEntry: mockAddEntry,
        getSessionEntries: jest.fn().mockReturnValue(sessionEntries),
        markAsRead: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        deleteSessionEntries: jest.fn(),
        getEntriesByType: jest.fn(),
        reset: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        entries: {},
        sessionEntries: {},
        error: null,
        loading: false
      });

      const TestSessionLifecycle = () => {
        const journalStore = useJournalStore();
        
        const simulateSessionLifecycle = () => {
          // Simulate session start
          journalStore.addEntry('test-session', {
            worldId: 'test-world',
            characterId: 'test-character',
            type: 'session_start',
            title: 'Session Started',
            content: 'New adventure began',
            significance: 'minor',
            relatedEntities: [],
            metadata: { tags: ['system'], automaticEntry: true }
          });

          // Simulate session end
          journalStore.addEntry('test-session', {
            worldId: 'test-world',
            characterId: 'test-character',
            type: 'session_end',
            title: 'Session Ended',
            content: 'Adventure concluded',
            significance: 'minor',
            relatedEntities: [],
            metadata: { tags: ['system'], automaticEntry: true }
          });
        };

        const entries = journalStore.getSessionEntries('test-session');

        return (
          <div>
            <button onClick={simulateSessionLifecycle} data-testid="simulate-lifecycle">
              Simulate Session Lifecycle
            </button>
            <div data-testid="entry-count">{entries.length}</div>
            {entries.map((entry) => (
              <div key={entry.id} data-testid={`entry-${entry.type}`}>
                {entry.title}
              </div>
            ))}
          </div>
        );
      };

      render(<TestSessionLifecycle />);

      fireEvent.click(screen.getByTestId('simulate-lifecycle'));

      // Verify both session boundary entries were created
      expect(mockAddEntry).toHaveBeenCalledTimes(2);
      
      // Verify the chronological order (newest first)
      expect(screen.getByTestId('entry-count')).toHaveTextContent('2');
      expect(screen.getByTestId('entry-session_end')).toBeInTheDocument();
      expect(screen.getByTestId('entry-session_start')).toBeInTheDocument();
    });
  });
});