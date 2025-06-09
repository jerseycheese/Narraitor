import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalModal } from '../JournalModal';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';

// Mock the journal store
jest.mock('@/state/journalStore');

const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

describe('JournalModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1'
  };

  const mockJournalEntry: JournalEntry = {
    id: 'entry-1',
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'character_event',
    title: 'Met the Village Elder',
    content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy.',
    significance: 'major',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['prophecy', 'elder'],
      automaticEntry: true
    },
    createdAt: '2023-01-01T12:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Behavior', () => {
    it('renders when isOpen is true', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Game Journal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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

      render(<JournalModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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

      render(<JournalModal {...defaultProps} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close journal');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const mockOnClose = jest.fn();
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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

      render(<JournalModal {...defaultProps} onClose={mockOnClose} />);
      
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Journal Content', () => {
    it('displays empty state when no entries exist', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      expect(screen.getByText('Your journal is empty')).toBeInTheDocument();
      expect(screen.getByText('Entries will appear here as your story unfolds')).toBeInTheDocument();
    });

    it('displays journal entries when they exist', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([mockJournalEntry]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      expect(screen.getByText('Character Events')).toBeInTheDocument();
      expect(screen.getByText('Met the Village Elder')).toBeInTheDocument();
      expect(screen.getByText('Had a meaningful conversation with Elder Thorne about the ancient prophecy.')).toBeInTheDocument();
    });

    it('marks entries as read when clicked', () => {
      const mockMarkAsRead = jest.fn();
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([mockJournalEntry]),
        markAsRead: mockMarkAsRead,
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      const entryElement = screen.getByText('Met the Village Elder').closest('div');
      fireEvent.click(entryElement!);
      
      expect(mockMarkAsRead).toHaveBeenCalledWith('entry-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'journal-modal-title');
    });

    it('has accessible close button', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      const closeButton = screen.getByLabelText('Close journal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Entry Display', () => {
    it('shows unread indicator for unread entries', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([mockJournalEntry]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      const unreadIndicator = screen.getByLabelText('Unread');
      expect(unreadIndicator).toBeInTheDocument();
    });

    it('shows significance badge correctly', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([mockJournalEntry]),
        markAsRead: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
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
      
      expect(screen.getByText('major')).toBeInTheDocument();
    });
  });
});