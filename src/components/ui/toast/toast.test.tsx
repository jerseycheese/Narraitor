/**
 * Toast Component Tests
 * 
 * Tests for the Toast component covering:
 * - Content rendering and variants
 * - Auto-dismissal behavior
 * - Manual dismissal interaction
 * - Accessibility features
 * - Timer management
 * 
 * @group Toast
 * @group UI Components
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './toast';

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('displays toast message with correct content', () => {
    render(
      <Toast 
        title="Success" 
        description="Your changes have been saved"
        variant="success"
      />
    );
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Your changes have been saved')).toBeInTheDocument();
  });

  test('auto-dismisses after 5 seconds', async () => {
    const onDismiss = jest.fn();
    
    render(
      <Toast 
        title="Test Toast"
        variant="info"
        onDismiss={onDismiss}
      />
    );
    
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
    
    // Fast-forward 4.9 seconds - toast should still be visible
    act(() => {
      jest.advanceTimersByTime(4900);
    });
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
    
    // Fast-forward to 5 seconds - toast should dismiss
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('can be manually dismissed with X button', async () => {
    const user = userEvent.setup({ delay: null });
    const onDismiss = jest.fn();
    
    render(
      <Toast 
        title="Dismissible Toast"
        variant="warning"
        onDismiss={onDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders correct variant styles', () => {
    const variants = ['success', 'error', 'warning', 'info'] as const;

    variants.forEach(variant => {
      const { unmount } = render(<Toast title={`${variant} toast`} variant={variant} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('data-variant', variant);
      unmount();
    });
  });

  test('announces to screen readers with correct aria attributes', () => {
    render(
      <Toast 
        title="Important Update"
        description="Your data has been saved"
        variant="success"
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  test('does not auto-dismiss when duration is set to Infinity', () => {
    const onDismiss = jest.fn();
    
    render(
      <Toast 
        title="Persistent Toast"
        variant="error"
        duration={Infinity}
        onDismiss={onDismiss}
      />
    );
    
    // Fast-forward 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(screen.getByText('Persistent Toast')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});