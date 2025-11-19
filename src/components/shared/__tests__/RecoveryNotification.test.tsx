/**
 * Tests for RecoveryNotification component
 * Tests recovery alert and user confirmation UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecoveryNotification } from '../RecoveryNotification';

describe('RecoveryNotification', () => {
  const mockOnRecover = jest.fn();
  const mockOnDismiss = jest.fn();

  const defaultProps = {
    isVisible: true,
    lastSaved: '2023-01-01T12:00:00.000Z',
    onRecover: mockOnRecover,
    onDismiss: mockOnDismiss,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('displays formatted last saved date', () => {
      render(<RecoveryNotification {...defaultProps} />);

      // Check for date components flexibly (CI environments may use different timezones)
      expect(screen.getByText(/Jan 1, 2023/i)).toBeInTheDocument();
      expect(screen.getByText(/Last saved:/i)).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    test('calls onRecover when recover button clicked', () => {
      render(<RecoveryNotification {...defaultProps} />);

      const recoverButton = screen.getByRole('button', { name: /recover progress/i });
      fireEvent.click(recoverButton);

      expect(mockOnRecover).toHaveBeenCalledTimes(1);
    });

    test('calls onDismiss when dismiss button clicked', () => {
      render(<RecoveryNotification {...defaultProps} />);

      const dismissButton = screen.getByRole('button', { name: /start fresh/i });
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    test('calls onDismiss when close button clicked', () => {
      render(<RecoveryNotification {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    test('handles missing lastSaved date', () => {
      render(<RecoveryNotification {...defaultProps} lastSaved={undefined} />);

      expect(screen.getByText(/Character Creation Progress Found/i)).toBeInTheDocument();
      expect(screen.queryByText(/last saved/i)).not.toBeInTheDocument();
    });

    test('handles invalid lastSaved date', () => {
      render(<RecoveryNotification {...defaultProps} lastSaved="invalid-date" />);

      expect(screen.getByText(/Character Creation Progress Found/i)).toBeInTheDocument();
      expect(screen.queryByText(/last saved/i)).not.toBeInTheDocument();
    });
  });
});