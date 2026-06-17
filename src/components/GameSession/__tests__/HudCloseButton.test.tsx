import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HudCloseButton } from '../HudCloseButton';

describe('HudCloseButton', () => {
  it.each(['text', 'icon'] as const)(
    'renders an accessible Close that calls onBack (%s variant)',
    (variant) => {
      const onBack = jest.fn();
      render(<HudCloseButton variant={variant} onBack={onBack} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveClass('manuscript-hud-close-button');

      fireEvent.click(closeButton);
      expect(onBack).toHaveBeenCalledTimes(1);
    }
  );

  it('does not throw when onBack is omitted', () => {
    render(<HudCloseButton variant="text" />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: /close/i }))).not.toThrow();
  });
});
