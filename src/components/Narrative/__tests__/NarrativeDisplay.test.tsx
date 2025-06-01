import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeDisplay } from '../NarrativeDisplay';

describe('NarrativeDisplay', () => {
  it('displays narrative content appropriately', () => {
    const segment = {
      id: 'seg-1',
      content: 'The ancient forest whispered secrets in the moonlight.',
      type: 'scene' as const,
      metadata: {
        characterIds: [],
        mood: 'mysterious' as const,
        location: 'Dark Forest',
        tags: ['forest', 'night']
      }
    };

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getByText(/ancient forest whispered secrets/)).toBeInTheDocument();
  });

  it('renders different segment types with appropriate styling', () => {
    const dialogueSegment = {
      id: 'seg-2',
      content: '"Hello there," said the mysterious stranger.',
      type: 'dialogue' as const,
      metadata: {
        characterIds: ['char-1'],
        mood: 'neutral' as const,
        tags: ['conversation']
      }
    };

    const { rerender } = render(<NarrativeDisplay segment={dialogueSegment} />);
    expect(screen.getByText(/Hello there/)).toBeInTheDocument();

    const actionSegment = {
      id: 'seg-3',
      content: 'The hero leapt across the chasm.',
      type: 'action' as const,
      metadata: {
        characterIds: ['hero'],
        mood: 'action' as const,
        tags: ['action', 'movement']
      }
    };

    rerender(<NarrativeDisplay segment={actionSegment} />);
    expect(screen.getByText(/hero leapt across/)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<NarrativeDisplay segment={null} isLoading={true} />);
    
    expect(screen.getByText(/Generating narrative/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorMessage = 'Failed to generate narrative';
    render(<NarrativeDisplay segment={null} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows retry button when error occurs and onRetry is provided', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Unable to generate narrative. Please check your connection and try again.';
    const mockRetry = jest.fn();
    
    render(<NarrativeDisplay segment={null} error={errorMessage} onRetry={mockRetry} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    await user.click(screen.getByText('Try Again'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button when no onRetry handler is provided', () => {
    const errorMessage = 'Unable to generate narrative. Please check your connection and try again.';
    
    render(<NarrativeDisplay segment={null} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});