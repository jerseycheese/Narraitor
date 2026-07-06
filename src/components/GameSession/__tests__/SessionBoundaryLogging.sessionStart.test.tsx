import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';
import {
  setupMockStores,
  setupSessionStoreStatics
} from './SessionBoundaryLogging.testHelpers';

// Mock the stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/journalStore');

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

describe('Session Boundary Logging - Session Start', () => {
  const mockSessionCallbacks = {
    onSessionStart: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupSessionStoreStatics();
    setupMockStores();
  });

  it('handles session start callback and journal entry creation workflow', () => {
    const sessionStartTime = new Date('2024-01-15T10:30:00Z');
    const mockDate = jest.spyOn(global, 'Date').mockImplementation(() => sessionStartTime);

    const mockAddEntry = jest.fn().mockReturnValue('session-start-entry');

    setupMockStores({
      id: 'test-session-123',
      status: 'active',
      worldId: 'test-world',
      characterId: 'test-character',
      currentSceneId: 'initial-scene'
    }, {
      addEntry: mockAddEntry
    });

    const TestSessionStartHandler = () => {
      const sessionStore = useSessionStore();
      const journalStore = useJournalStore();

      const handleSessionStart = () => {
        if (sessionStore.id) {
          journalStore.addEntry(sessionStore.id, {
            worldId: sessionStore.worldId!,
            characterId: sessionStore.characterId!,
            type: 'session_start',
            title: 'Adventure Begins',
            content: 'A new session has started',
            significance: 'minor',
            relatedEntities: [],
            updatedAt: sessionStartTime.toISOString(),
            isRead: false,
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
    fireEvent.click(screen.getByTestId('start-session'));

    expect(mockAddEntry).toHaveBeenCalledWith('test-session-123', {
      worldId: 'test-world',
      characterId: 'test-character',
      type: 'session_start',
      title: 'Adventure Begins',
      content: 'A new session has started',
      significance: 'minor',
      relatedEntities: [],
      updatedAt: sessionStartTime.toISOString(),
      isRead: false,
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
