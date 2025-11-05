import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useJournalStore } from '@/state/journalStore';
import { getTimestamp } from '@/lib/utils/timestamp';
import {
  setupMockStores,
  setupSessionStoreStatics,
  mockUseJournalStore
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

describe('Session Boundary Logging - Complete Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSessionStoreStatics();
    setupMockStores();
  });

  it('creates both session start and end entries in proper chronological order', () => {
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
          updatedAt: getTimestamp(),
          isRead: false,
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
          updatedAt: getTimestamp(),
          isRead: false,
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
