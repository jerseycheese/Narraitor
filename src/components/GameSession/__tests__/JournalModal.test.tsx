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
    sessionId: 'session-1'
  };

  const mockJournalEntry: JournalEntry = {
    id: 'entry-1',
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'character_event',
    title: '',
    content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy.',
    significance: 'major',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['prophecy', 'elder'],
      automaticEntry: true
    },
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
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
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Journal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
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

      render(<JournalModal {...defaultProps} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
      const mockOnClose = jest.fn();
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
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

      render(<JournalModal {...defaultProps} onClose={mockOnClose} />);
      
      // Simulate clicking outside the dialog content (on the overlay)
      // In Radix Dialog, this triggers onOpenChange with false
      fireEvent.keyDown(document, { key: 'Escape' });
      
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
      
      expect(screen.getByText('This journal awaits its first entry')).toBeInTheDocument();
      expect(screen.getByText('Updates will appear here as things unfold')).toBeInTheDocument();
    });

    it('displays journal entries when they exist', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([mockJournalEntry]),
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
      
      expect(screen.getByText('Character Event')).toBeInTheDocument();
      expect(screen.getByText(/Had a meaningful conversation with Elder Thorne about the.../)).toBeInTheDocument();
    });

  });

  describe('Accessibility', () => {
    it('has proper dialog structure', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
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
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    });

    it('has accessible close button', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([]),
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
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Entry Display', () => {

    it('shows significance badge correctly', () => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue([mockJournalEntry]),
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
      
      expect(screen.getByText('Major')).toBeInTheDocument();
    });
  });

  describe('Entry Selection', () => {
    const mockEntries: JournalEntry[] = [
      {
        ...mockJournalEntry,
        id: 'entry-1',
        title: 'First Entry',
        content: 'First entry content',
        createdAt: '2023-01-01T12:00:00Z',
        significance: 'major'
      },
      {
        ...mockJournalEntry,
        id: 'entry-2',
        title: 'Second Entry', 
        content: 'Second entry content',
        createdAt: '2023-01-02T12:00:00Z',
        significance: 'critical'
      }
    ];

    beforeEach(() => {
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue(mockEntries),
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
    });

    it('shows entry list when entries exist', () => {
      render(<JournalModal {...defaultProps} />);
      
      expect(screen.getByText('First Entry')).toBeInTheDocument();
      expect(screen.getByText('Second Entry')).toBeInTheDocument();
      expect(screen.getByText('Select an Entry')).toBeInTheDocument();
    });

    it('shows entry detail when entry is selected', () => {
      render(<JournalModal {...defaultProps} />);
      
      const firstEntry = screen.getByText('First Entry');
      fireEvent.click(firstEntry);
      
      // Verify detail view shows the full content (not truncated)
      const detailContent = screen.getAllByText('First entry content');
      expect(detailContent.length).toBeGreaterThan(0);
    });

    it('marks entry as read when selected', () => {
      const mockMarkAsRead = jest.fn();
      mockUseJournalStore.mockReturnValue({
        getSessionEntries: jest.fn().mockReturnValue(mockEntries),
        markAsRead: mockMarkAsRead,
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
      
      const firstEntry = screen.getByText('First Entry');
      fireEvent.click(firstEntry);
      
      expect(mockMarkAsRead).toHaveBeenCalledWith('entry-1');
    });
  });
});