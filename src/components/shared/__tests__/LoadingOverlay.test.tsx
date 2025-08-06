import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  describe('Basic Functionality', () => {
    it('should not render when not visible', () => {
      const { container } = render(
        <LoadingOverlay isVisible={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should display loading message when visible', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });

    it('should display custom message when provided', () => {
      render(
        <LoadingOverlay 
          isVisible={true} 
          message="Loading your world..." 
        />
      );
      
      expect(screen.getByText('Loading your world...')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should show cancel button when onCancel provided and handle clicks', () => {
      const handleCancel = jest.fn();
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          onCancel={handleCancel} 
        />
      );
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      
      fireEvent.click(cancelButton);
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle escape key when cancel is available', () => {
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
    it('should have proper ARIA attributes for screen readers', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });
  });
});