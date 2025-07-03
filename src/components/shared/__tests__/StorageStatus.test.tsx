/**
 * Tests for StorageStatus component
 * Tests user interface for storage status display and notifications
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageStatus } from '../StorageStatus';
import { StorageStatus as StorageStatusEnum } from '../../../lib/storage/resilientStorage';

// Mock resilient storage instance
const mockResilientStorage = {
  getStorageStatus: jest.fn(() => StorageStatusEnum.HEALTHY),
  getLastError: jest.fn(() => null),
  getLastSuccessfulSync: jest.fn(() => new Date().toISOString()),
  checkStorageHealth: jest.fn().mockResolvedValue(undefined),
  startHealthMonitoring: jest.fn(),
  stopHealthMonitoring: jest.fn(),
};

// Mock the getResilientStorageInstance function
jest.mock('../../../state/persistence', () => ({
  getResilientStorageInstance: jest.fn(() => Promise.resolve(mockResilientStorage)),
}));

describe('StorageStatus Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to healthy state
    mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.HEALTHY);
    mockResilientStorage.getLastError.mockReturnValue(null);
    mockResilientStorage.getLastSuccessfulSync.mockReturnValue(new Date().toISOString());
  });

  describe('Storage Status Display', () => {
    it('should handle healthy storage state', async () => {
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.HEALTHY);
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(<StorageStatus variant="inline" />);
        container = result.container;
      });

      // Component should render for inline variant even when healthy
      expect(container.firstChild).toBeTruthy();
    });

    it('should display storage error when unavailable', async () => {
      const mockError = {
        userMessage: 'Storage is unavailable',
        technicalMessage: 'IndexedDB failed',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(mockError);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
      });
    });

    it('should show degraded storage warning', async () => {
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.DEGRADED);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        expect(screen.getByText(/storage issues detected/i)).toBeInTheDocument();
      });
    });

    it('should display recovery status', async () => {
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.RECOVERING);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        expect(screen.getByText(/restoring storage/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle retry button click', async () => {
      const mockError = {
        userMessage: 'Storage is unavailable',
        technicalMessage: 'IndexedDB failed',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(mockError);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      const retryButton = await screen.findByRole('button', { name: /retry/i });
      
      await act(async () => {
        await userEvent.click(retryButton);
      });

      expect(mockResilientStorage.checkStorageHealth).toHaveBeenCalled();
    });

    it('should handle error dismissal', async () => {
      const mockError = {
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(mockError);

      await act(async () => {
        render(<StorageStatus variant="floating" />);
      });

      const dismissButton = await screen.findByRole('button', { name: /dismiss/i });
      
      await act(async () => {
        await userEvent.click(dismissButton);
      });

      // Component should be dismissed and no longer visible
      await waitFor(() => {
        expect(screen.queryByText(/quota exceeded/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Variant Behavior', () => {
    it('should not render floating variant when storage is healthy', async () => {
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.HEALTHY);

      let container: HTMLElement;
      await act(async () => {
        const result = render(<StorageStatus variant="floating" />);
        container = result.container;
      });

      // Floating variant should not render when healthy
      expect(container.firstChild).toBeNull();
    });

    it('should render inline variant even when storage is healthy', async () => {
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.HEALTHY);

      let container: HTMLElement;
      await act(async () => {
        const result = render(<StorageStatus variant="inline" />);
        container = result.container;
      });

      // Inline variant should always render
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Error State Management', () => {
    it('should display quota exceeded error message', async () => {
      const quotaError = {
        userMessage: 'Storage quota exceeded. Please free up some space.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(quotaError);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
      });
    });

    it('should display private browsing error message', async () => {
      const privateBrowsingError = {
        userMessage: 'Storage is unavailable in private browsing mode.',
        technicalMessage: 'SecurityError',
        isRecoverable: false,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(privateBrowsingError);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        expect(screen.getByText(/private browsing/i)).toBeInTheDocument();
      });
    });

    it('should show recovery suggestions for recoverable errors', async () => {
      const recoverableError = {
        userMessage: 'Storage quota exceeded. Please free up some space.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(recoverableError);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        // Should show retry option for recoverable errors
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute('aria-live');
      });
    });

    it('should be keyboard accessible', async () => {
      const mockError = {
        userMessage: 'Storage is unavailable',
        technicalMessage: 'IndexedDB failed',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatusEnum.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue(mockError);

      await act(async () => {
        render(<StorageStatus variant="inline" />);
      });

      const retryButton = await screen.findByRole('button', { name: /retry/i });
      
      // Should be focusable (buttons are focusable by default)
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });
  });
});