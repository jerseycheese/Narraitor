import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalModal } from '../JournalModal';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';

// Mock the journal store
jest.mock('@/state/journalStore');

const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

describe('JournalModal - Session Boundary Display', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    sessionId: 'test-session'
  };

  const mockSessionStartEntry: JournalEntry = {
    id: 'session-start-1',
    sessionId: 'test-session',
    worldId: 'test-world',
    characterId: 'test-character',
    type: 'session_start',
    title: 'Adventure Begins',
    content: 'A new journey starts in the Kingdom of Eldara',
    significance: 'minor',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['system', 'session'],
      automaticEntry: true,
      sessionStartTime: '2024-01-15T10:30:00Z'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  };

  const mockSessionEndEntry: JournalEntry = {
    id: 'session-end-1',
    sessionId: 'test-session',
    worldId: 'test-world',
    characterId: 'test-character',
    type: 'session_end',
    title: 'Chapter Closes',
    content: 'Session completed after 45 minutes of adventure',
    significance: 'minor',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['system', 'session'],
      automaticEntry: true,
      sessionStartTime: '2024-01-15T10:30:00Z',
      sessionDuration: 2700000 // 45 minutes
    },
    createdAt: '2024-01-15T11:15:00Z',
    updatedAt: '2024-01-15T11:15:00Z'
  };

  const mockNarrativeEntry: JournalEntry = {
    id: 'narrative-1',
    sessionId: 'test-session',
    worldId: 'test-world',
    characterId: 'test-character',
    type: 'character_event',
    title: 'Ancient Discovery',
    content: 'Found mysterious ruins beneath the old oak tree',
    significance: 'major',
    isRead: false,
    relatedEntities: [
      { type: 'location', id: 'ruins-1', name: 'Ancient Ruins' }
    ],
    metadata: {
      tags: ['discovery', 'ruins'],
      automaticEntry: false
    },
    createdAt: '2024-01-15T10:45:00Z',
    updatedAt: '2024-01-15T10:45:00Z'
  };

  const setupMockStore = (entries: JournalEntry[], options: { markAsRead?: jest.Mock } = {}) => {
    mockUseJournalStore.mockReturnValue({
      getSessionEntries: jest.fn().mockReturnValue(entries),
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue(entries),
      markAsRead: options.markAsRead || jest.fn(),
      addEntry: jest.fn(),
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Start Entry Display', () => {
    it('displays session start entry with system indicators', () => {
      setupMockStore([mockSessionStartEntry]);

      render(<JournalModal {...defaultProps} />);

      expect(screen.getByText('Adventure Begins')).toBeInTheDocument();
      expect(screen.getByText('Minor')).toBeInTheDocument();
      
      const entryButton = screen.getByText('Adventure Begins');
      fireEvent.click(entryButton);
      
      expect(screen.getByText('System: Session Start')).toBeInTheDocument();
      
      expect(screen.getByText('system')).toBeInTheDocument();
      expect(screen.getByText('session')).toBeInTheDocument();
    });

    it('shows session start metadata when entry is selected', () => {
      setupMockStore([mockSessionStartEntry]);

      render(<JournalModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Adventure Begins'));

      expect(screen.getAllByText('A new journey starts in the Kingdom of Eldara')).toHaveLength(2); // List and detail views
      expect(screen.getByText('System: Session Start')).toBeInTheDocument();
    });
  });

  describe('Session End Entry Display', () => {
    it('displays session end entry with duration information', () => {
      setupMockStore([mockSessionEndEntry]);

      render(<JournalModal {...defaultProps} />);

      expect(screen.getByText('Chapter Closes')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Chapter Closes'));
      expect(screen.getByText('System: Session End')).toBeInTheDocument();
      expect(screen.getAllByText('Session completed after 45 minutes of adventure')).toHaveLength(2); // List and detail views
    });

    it('marks session end entry as read when selected', () => {
      const mockMarkAsRead = jest.fn();
      setupMockStore([mockSessionEndEntry], { markAsRead: mockMarkAsRead });

      render(<JournalModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Chapter Closes'));
      expect(mockMarkAsRead).toHaveBeenCalledWith('session-end-1');
    });
  });

  describe('Mixed Entry Types Display', () => {
    it('displays session boundary and narrative events with proper visual distinction', () => {
      const mixedEntries = [mockSessionEndEntry, mockNarrativeEntry, mockSessionStartEntry];
      
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue(mixedEntries),
        getSessionEntriesWithCharacter: jest.fn().mockReturnValue(mixedEntries),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
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

      render(<JournalModal {...defaultProps} />);

      expect(screen.getByText('Chapter Closes')).toBeInTheDocument();
      expect(screen.getByText('Ancient Discovery')).toBeInTheDocument();
      expect(screen.getByText('Adventure Begins')).toBeInTheDocument();

      expect(screen.getAllByText('Minor')).toHaveLength(2); // Two session boundary entries
      expect(screen.getByText('Major')).toBeInTheDocument(); // One narrative entry

      fireEvent.click(screen.getByText('Chapter Closes'));
      expect(screen.getByText('System: Session End')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Ancient Discovery'));
      expect(screen.getByText('Character Event')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Adventure Begins'));
      expect(screen.getByText('System: Session Start')).toBeInTheDocument();
    });

    it('shows different tag types when entries are selected', () => {
      const mixedEntries = [mockSessionStartEntry, mockNarrativeEntry];
      
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue(mixedEntries),
        getSessionEntriesWithCharacter: jest.fn().mockReturnValue(mixedEntries),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
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

      render(<JournalModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Adventure Begins'));
      expect(screen.getByText('system')).toBeInTheDocument();
      expect(screen.getByText('session')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Ancient Discovery'));
      expect(screen.getByText('discovery')).toBeInTheDocument();
      expect(screen.getByText('ruins')).toBeInTheDocument();
      
      expect(screen.getByText('Location: Ancient Ruins')).toBeInTheDocument();
    });
  });

  describe('Session Boundary Entry Content Formatting', () => {
    it('displays session start entry with proper content formatting', () => {
      setupMockStore([mockSessionStartEntry]);

      render(<JournalModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Adventure Begins'));

      const contentElements = screen.getAllByText('A new journey starts in the Kingdom of Eldara');
      const detailContentElement = contentElements.find(el => el.closest('p')?.classList.contains('whitespace-pre-wrap'));
      expect(detailContentElement).toBeDefined();
      expect(detailContentElement?.closest('p')).toHaveClass('whitespace-pre-wrap');
    });

    it('shows unread badge for new session boundary entries', () => {
      const unreadSessionEntry = { ...mockSessionStartEntry, isRead: false };
      
      setupMockStore([unreadSessionEntry]);

      render(<JournalModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Adventure Begins'));
      
      expect(screen.getByText('Unread')).toBeInTheDocument();
    });
  });

  describe('Accessibility for Session Boundary Entries', () => {
    it('provides proper ARIA labels for session boundary entry types', () => {
      setupMockStore([mockSessionStartEntry]);

      render(<JournalModal {...defaultProps} />);

      // Journal modal should have proper dialog role
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();

      fireEvent.click(screen.getByText('Adventure Begins'));
      
      // Entry types should be readable by screen readers  
      expect(screen.getByText('System: Session Start')).toBeInTheDocument();
    });
  });
});