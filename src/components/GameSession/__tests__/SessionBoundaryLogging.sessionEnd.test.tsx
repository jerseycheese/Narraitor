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

describe('Session Boundary Logging - Session End', () => {
  const mockSessionCallbacks = {
    onSessionEnd: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupSessionStoreStatics();
    setupMockStores();
  });

  it('creates session end journal entry with duration when session ends', () => {
    const sessionStartTime = new Date('2024-01-15T10:30:00Z');
    const sessionEndTime = new Date('2024-01-15T11:15:00Z');
    const expectedDuration = sessionEndTime.getTime() - sessionStartTime.getTime();

    const mockAddEntry = jest.fn().mockReturnValue('session-end-entry');
    const mockEndSession = jest.fn();

    setupMockStores({
      id: 'test-session-456',
      status: 'active',
      worldId: 'test-world',
      characterId: 'test-character',
      currentSceneId: 'some-scene',
      endSession: mockEndSession
    }, {
      addEntry: mockAddEntry
    });

    const TestSessionEndHandler = () => {
      const sessionStore = useSessionStore();
      const journalStore = useJournalStore();

      const handleSessionEnd = () => {
        if (sessionStore.id) {
          journalStore.addEntry(sessionStore.id, {
            worldId: sessionStore.worldId!,
            characterId: sessionStore.characterId!,
            type: 'session_end',
            title: 'Chapter Closes',
            content: 'Session completed after 45 minutes',
            significance: 'minor',
            relatedEntities: [],
            updatedAt: sessionEndTime.toISOString(),
            isRead: false,
            metadata: {
              tags: ['system', 'session'],
              automaticEntry: true,
              sessionStartTime: sessionStartTime.toISOString(),
              sessionDuration: expectedDuration
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

    expect(mockAddEntry).toHaveBeenCalledWith('test-session-456', {
      worldId: 'test-world',
      characterId: 'test-character',
      type: 'session_end',
      title: 'Chapter Closes',
      content: 'Session completed after 45 minutes',
      significance: 'minor',
      relatedEntities: [],
      updatedAt: sessionEndTime.toISOString(),
      isRead: false,
      metadata: {
        tags: ['system', 'session'],
        automaticEntry: true,
        sessionStartTime: sessionStartTime.toISOString(),
        sessionDuration: expectedDuration
      }
    });

    expect(mockEndSession).toHaveBeenCalled();
    expect(mockSessionCallbacks.onSessionEnd).toHaveBeenCalled();
  });
});
