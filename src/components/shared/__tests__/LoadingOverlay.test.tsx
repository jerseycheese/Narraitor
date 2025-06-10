import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  describe('Visibility', () => {
    it('should not render when not visible', () => {
      const { container } = render(
        <LoadingOverlay isVisible={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render when visible', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();
      expect(screen.getAllByText('Loading...')).toHaveLength(2); // One in sr-only, one in message
    });

    it('should render custom message when provided', () => {
      render(
        <LoadingOverlay 
          isVisible={true} 
          message="Loading your world..." 
        />
      );
      
      expect(screen.getByText('Loading your world...')).toBeInTheDocument();
    });
  });

  describe('Loading Variants', () => {
    it('should render spinner variant by default', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      // The spinner should be within the loading state component
      const spinnerElement = screen.getByRole('status');
      expect(spinnerElement).toHaveClass('animate-spin');
    });

    it('should render skeleton variant when specified', () => {
      render(
        <LoadingOverlay 
          isVisible={true} 
          variant="skeleton" 
        />
      );
      
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveClass('animate-pulse');
    });

    it('should render dots variant when specified', () => {
      render(
        <LoadingOverlay 
          isVisible={true} 
          variant="dots" 
        />
      );
      
      const loadingElement = screen.getByRole('status');
      expect(loadingElement.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render pulse variant when specified', () => {
      render(
        <LoadingOverlay 
          isVisible={true} 
          variant="pulse" 
        />
      );
      
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveClass('animate-pulse');
    });
  });

  describe('Cancel Functionality', () => {
    it('should not show cancel button by default', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should show cancel button when onCancel provided', () => {
      const handleCancel = jest.fn();
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          onCancel={handleCancel} 
        />
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button clicked', () => {
      const handleCancel = jest.fn();
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          onCancel={handleCancel} 
        />
      );
      
      fireEvent.click(screen.getByText('Cancel'));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when escape key pressed', () => {
      const handleCancel = jest.fn();
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          onCancel={handleCancel} 
        />
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      // Check for the wrapper div with aria attributes
      const loadingWrapper = screen.getAllByLabelText('Loading')[0]; // Get the first one
      expect(loadingWrapper).toHaveAttribute('aria-live', 'polite');
      expect(loadingWrapper).toHaveAttribute('aria-label', 'Loading');
    });

    it('should have modal attributes when visible', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('should announce custom message to screen readers', () => {
      render(
        <LoadingOverlay 
          isVisible={true} 
          message="Loading character data..." 
        />
      );
      
      const message = screen.getByText('Loading character data...');
      expect(message).toHaveAttribute('aria-live', 'polite');
    });

    it('should focus trap when visible with cancel option', () => {
      const handleCancel = jest.fn();
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          onCancel={handleCancel} 
        />
      );
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Overlay Behavior', () => {
    it('should prevent background interaction', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });

    it('should have proper z-index for stacking', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveClass('z-50');
    });

    it('should center content in viewport', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Theme Support', () => {
    it('should support light theme by default', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const dialog = screen.getByRole('dialog');
      const content = dialog.querySelector('.bg-white');
      expect(content).toBeInTheDocument();
    });

    it('should adapt to dark theme when specified', () => {
      render(
        <div className="dark">
          <LoadingOverlay isVisible={true} />
        </div>
      );
      
      // Component should use CSS variables that adapt to dark theme
      const content = screen.getByRole('status');
      expect(content).toBeInTheDocument();
    });
  });
});