import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HudCloseButton } from '../HudCloseButton';

describe('HudCloseButton', () => {
  it('renders an accessible Close that calls onBack', () => {
    const onBack = jest.fn();
    render(<HudCloseButton onBack={onBack} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveClass('manuscript-hud-close-button');

    fireEvent.click(closeButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onBack is omitted', () => {
    render(<HudCloseButton />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: /close/i }))).not.toThrow();
  });
});
