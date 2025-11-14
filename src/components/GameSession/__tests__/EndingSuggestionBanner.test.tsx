import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndingSuggestionBanner } from '../EndingSuggestionBanner';

describe('EndingSuggestionBanner', () => {
  const mockOnAccept = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with reason text', () => {
    render(
      <EndingSuggestionBanner
        reason="The protagonist has achieved their goal"
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Your story could end here')).toBeInTheDocument();
    expect(screen.getByText('The protagonist has achieved their goal')).toBeInTheDocument();
  });

  it('calls onAccept when Generate Ending button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EndingSuggestionBanner
        reason="Story arc is complete"
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /generate ending/i });
    await user.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('calls onDismiss when Continue Playing button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EndingSuggestionBanner
        reason="Story arc is complete"
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /continue playing/i });
    await user.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).not.toHaveBeenCalled();
  });

  it('displays BookOpen icon', () => {
    const { container } = render(
      <EndingSuggestionBanner
        reason="Test reason"
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
      />
    );

    // BookOpen icon should be present
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
