import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoryEndingDialog } from '../StoryEndingDialog';

describe('StoryEndingDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Your Journey Ends',
    content: 'After a long and treacherous journey, you have finally reached your destination...',
    endingType: 'triumphant' as const,
    onContinue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dialog when open', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Your Journey Ends')).toBeInTheDocument();
      expect(screen.getByText(/After a long and treacherous journey/)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<StoryEndingDialog {...mockProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders continue button when onContinue is provided', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('does not render continue button when onContinue is not provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { onContinue, ...propsWithoutContinue } = mockProps;
      render(<StoryEndingDialog {...propsWithoutContinue} />);
      
      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });
  });

  describe('Ending Types', () => {
    it('accepts different ending types without errors', () => {
      // Test that component renders with different ending types
      const endingTypes = ['player-choice', 'story-complete', 'session-limit', 'character-retirement'] as const;
      
      endingTypes.forEach(endingType => {
        const { unmount } = render(<StoryEndingDialog {...mockProps} endingType={endingType} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        unmount();
      });
    });

    it('handles missing ending type gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { endingType, ...propsWithoutType } = mockProps;
      render(<StoryEndingDialog {...propsWithoutType} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Your Journey Ends')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when continue button is clicked', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      
      expect(mockProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('handles escape key press', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('focuses continue button by default when present', async () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await waitFor(() => {
        expect(continueButton).toHaveFocus();
      });
    });

    it('focuses close button when continue button is not present', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { onContinue, ...propsWithoutContinue } = mockProps;
      render(<StoryEndingDialog {...propsWithoutContinue} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await waitFor(() => {
        expect(closeButton).toHaveFocus();
      });
    });
  });

  describe('Content Rendering', () => {
    it('renders content as text when string is provided', () => {
      render(<StoryEndingDialog {...mockProps} />);
      
      expect(screen.getByText(/After a long and treacherous journey/)).toBeInTheDocument();
    });

    it('renders content as JSX when ReactNode is provided', () => {
      const jsxContent = (
        <div>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </div>
      );
      
      render(<StoryEndingDialog {...mockProps} content={jsxContent} />);
      
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

});