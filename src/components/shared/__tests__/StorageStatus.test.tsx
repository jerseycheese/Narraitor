/**
 * Tests for StorageStatus component
 * Tests user interface for storage status display and notifications
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageStatus } from '../StorageStatus';
import { StorageStatus as StorageStatusEnum } from '../../../lib/storage/resilientStorage';

// Mock the resilient storage
const mockStorageContext = {
  status: StorageStatusEnum.HEALTHY,
  error: null,
  lastSuccessfulSync: new Date().toISOString(),
  checkHealth: jest.fn(),
  isLoading: false,
};

jest.mock('../../../hooks/useStorageStatus', () => ({
  useStorageStatus: () => mockStorageContext,
}));

describe('StorageStatus Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthy Storage State', () => {
    it('should not render when storage is healthy (floating mode)', () => {
      mockStorageContext.status = StorageStatusEnum.HEALTHY;
      mockStorageContext.error = null;

      const { container } = render(<StorageStatus />);

      // Component should not render in healthy state (floating mode)
      expect(container.firstChild).toBeNull();
    });

    it('should show last sync time when using inline variant', () => {
      const syncTime = new Date('2023-01-01T12:00:00Z').toISOString();
      mockStorageContext.status = StorageStatusEnum.HEALTHY;
      mockStorageContext.lastSuccessfulSync = syncTime;

      render(<StorageStatus variant="inline" />);

      // Should display sync time (exact format depends on implementation)
      expect(screen.getByText(/last saved/i)).toBeInTheDocument();
    });
  });

  describe('Degraded Storage State', () => {
    it('should show warning indicator for degraded storage', () => {
      mockStorageContext.status = StorageStatusEnum.DEGRADED;
      mockStorageContext.error = {
        userMessage: 'Storage is experiencing issues',
        technicalMessage: 'Intermittent failures',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should show warning indicator
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('storage-status--degraded');
      
      // Should show user-friendly warning
      expect(screen.getByText(/storage is experiencing issues/i)).toBeInTheDocument();
    });

    it('should provide retry option for degraded storage', async () => {
      const user = userEvent.setup();
      mockStorageContext.status = StorageStatusEnum.DEGRADED;
      mockStorageContext.error = {
        userMessage: 'Storage is experiencing issues',
        technicalMessage: 'Intermittent failures',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockStorageContext.checkHealth).toHaveBeenCalled();
    });
  });

  describe('Unavailable Storage State', () => {
    it('should show error indicator for unavailable storage', () => {
      mockStorageContext.status = StorageStatusEnum.UNAVAILABLE;
      mockStorageContext.error = {
        userMessage: 'Storage is unavailable. Running in memory-only mode.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should show error indicator
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('storage-status--unavailable');
      
      // Should show memory-only mode message
      expect(screen.getByText(/memory-only mode/i)).toBeInTheDocument();
    });

    it('should explain implications of memory-only mode', () => {
      mockStorageContext.status = StorageStatusEnum.UNAVAILABLE;
      mockStorageContext.error = {
        userMessage: 'Storage is unavailable. Running in memory-only mode.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should explain that data won't persist
      expect(screen.getByText(/changes will not be saved/i)).toBeInTheDocument();
    });

    it('should provide recovery instructions for recoverable errors', () => {
      mockStorageContext.status = StorageStatusEnum.UNAVAILABLE;
      mockStorageContext.error = {
        userMessage: 'Storage quota exceeded. Please free up some space.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should show recovery instructions
      expect(screen.getByText(/free up some space/i)).toBeInTheDocument();
      
      // Should have retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should not show retry for non-recoverable errors', () => {
      mockStorageContext.status = StorageStatusEnum.UNAVAILABLE;
      mockStorageContext.error = {
        userMessage: 'Storage is unavailable in private browsing mode.',
        technicalMessage: 'SecurityError',
        isRecoverable: false,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should not show retry button for non-recoverable errors
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      
      // Should explain the limitation
      expect(screen.getByText(/private browsing mode/i)).toBeInTheDocument();
    });
  });

  describe('Recovering Storage State', () => {
    it('should show recovery indicator when storage is recovering', () => {
      mockStorageContext.status = StorageStatusEnum.RECOVERING;

      render(<StorageStatus />);

      // Should show recovery indicator
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('storage-status--recovering');
      
      // Should show recovery message
      expect(screen.getByText(/recovering/i)).toBeInTheDocument();
    });

    it('should show progress indicator during recovery', () => {
      mockStorageContext.status = StorageStatusEnum.RECOVERING;

      render(<StorageStatus />);

      // Should show some kind of progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow dismissing storage notifications', async () => {
      const user = userEvent.setup();
      mockStorageContext.status = StorageStatusEnum.DEGRADED;
      mockStorageContext.error = {
        userMessage: 'Storage is experiencing issues',
        technicalMessage: 'Intermittent failures',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      // Should hide the detailed message
      await waitFor(() => {
        expect(screen.queryByText(/storage is experiencing issues/i)).not.toBeInTheDocument();
      });
    });

    it('should expand to show technical details when requested', async () => {
      const user = userEvent.setup();
      mockStorageContext.status = StorageStatusEnum.UNAVAILABLE;
      mockStorageContext.error = {
        userMessage: 'Storage is unavailable',
        technicalMessage: 'QuotaExceededError: The quota has been exceeded',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      const detailsButton = screen.getByRole('button', { name: /details/i });
      await user.click(detailsButton);

      // Should show technical details
      expect(screen.getByText(/QuotaExceededError/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      mockStorageContext.status = StorageStatusEnum.UNAVAILABLE;
      mockStorageContext.error = {
        userMessage: 'Storage is unavailable',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should have proper status role
      const statusIndicator = screen.getByRole('status');
      expect(statusIndicator).toHaveAttribute('aria-live', 'polite');
      
      // Error message should be in alert region
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      mockStorageContext.status = StorageStatusEnum.DEGRADED;
      mockStorageContext.error = {
        userMessage: 'Storage is experiencing issues',
        technicalMessage: 'Intermittent failures',
        isRecoverable: true,
        shouldNotify: true,
      };

      render(<StorageStatus />);

      // Should be able to tab to and activate retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      expect(retryButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockStorageContext.checkHealth).toHaveBeenCalled();
    });
  });
});