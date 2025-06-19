import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SharePreview } from '../SharePreview';
import { JournalEntry } from '@/types/journal.types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('SharePreview', () => {
  const mockEntries: JournalEntry[] = [
    {
      id: 'entry-1',
      sessionId: 'session-1',
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'character_event',
      title: 'Meeting with Elder',
      content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy.',
      significance: 'major',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: ['prophecy', 'elder'],
        automaticEntry: true
      },
      createdAt: '2023-01-01T12:00:00Z'
    }
  ];

  const defaultProps = {
    entries: mockEntries,
    storyTitle: 'My Adventure',
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<SharePreview {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Share Your Story')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SharePreview {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays story preview', () => {
    render(<SharePreview {...defaultProps} />);
    
    expect(screen.getByText(/MY ADVENTURE/)).toBeInTheDocument();
    expect(screen.getByText(/Meeting with Elder/)).toBeInTheDocument();
    expect(screen.getByText(/Had a meaningful conversation with Elder Thorne about the ancient prophecy/)).toBeInTheDocument();
  });

  it('copies to clipboard when copy button is clicked', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    navigator.clipboard.writeText = mockWriteText;

    render(<SharePreview {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
    
    await act(async () => {
      fireEvent.click(copyButton);
    });
    
    expect(mockWriteText).toHaveBeenCalled();
  });

  it('shows copy success message after copying', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    navigator.clipboard.writeText = mockWriteText;

    render(<SharePreview {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
    
    await act(async () => {
      fireEvent.click(copyButton);
    });
    
    // Wait for success message to appear
    await screen.findByText(/copied to clipboard/i);
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<SharePreview {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close share preview');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<SharePreview {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });
});