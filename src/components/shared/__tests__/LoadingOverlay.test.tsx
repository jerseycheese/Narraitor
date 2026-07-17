import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  describe('Basic Functionality', () => {
    it('should not render when not', () => {
      const { container } = render(
        <LoadingOverlay isVisible={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should display loading message when', () => {
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

    it('exposes the message as the dialog accessible description without Radix warnings', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <LoadingOverlay
          isVisible={true}
          message="Loading Playwright Test World..."
        />
      );

      expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
        'Loading Playwright Test World...',
      );
      const missingDescriptionWarnings = warnSpy.mock.calls.filter((call) =>
        String(call[0]).includes('Missing `Description`'),
      );
      expect(missingDescriptionWarnings).toHaveLength(0);
      warnSpy.mockRestore();
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
});