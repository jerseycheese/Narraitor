import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button - Focus Indicators', () => {
  it('receives focus when tabbed to', async () => {
    const user = userEvent.setup();
    
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: /test button/i });
    
    await user.tab();
    expect(button).toHaveFocus();
  });

  it('has visible focus indicator styles', async () => {
    const user = userEvent.setup();
    
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: /test button/i });
    
    // Should have focus-visible styles when focused via keyboard
    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-ring');
  });

  it('maintains focus indicator with different variants', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    );
    
    const defaultButton = screen.getByRole('button', { name: /default/i });
    const destructiveButton = screen.getByRole('button', { name: /destructive/i });
    const outlineButton = screen.getByRole('button', { name: /outline/i });
    const secondaryButton = screen.getByRole('button', { name: /secondary/i });
    const ghostButton = screen.getByRole('button', { name: /ghost/i });
    
    // All variants should have focus indicators
    const buttons = [defaultButton, destructiveButton, outlineButton, secondaryButton, ghostButton];
    
    for (const button of buttons) {
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
    }
  });

  it('maintains focus indicator with different sizes', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    );
    
    const smallButton = screen.getByRole('button', { name: /small/i });
    const defaultButton = screen.getByRole('button', { name: /default/i });
    const largeButton = screen.getByRole('button', { name: /large/i });
    
    const buttons = [smallButton, defaultButton, largeButton];
    
    for (const button of buttons) {
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
    }
  });

  it('has sufficient color contrast for focus indicator', async () => {
    const user = userEvent.setup();
    
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: /test button/i });
    
    await user.tab();
    expect(button).toHaveFocus();
    
    // Should use ring color that provides sufficient contrast
    expect(button).toHaveClass('focus-visible:ring-ring');
    
    // Ring should be visible and have proper offset
    expect(button).toHaveClass('focus-visible:ring-offset-2');
  });

  it('is accessible to screen readers when focused', async () => {
    const user = userEvent.setup();
    
    render(<Button aria-label="Close dialog">×</Button>);
    
    const button = screen.getByRole('button', { name: /close dialog/i });
    
    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName('Close dialog');
  });

  it('supports disabled state without focus', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Button>Enabled Button</Button>
        <Button disabled>Disabled Button</Button>
        <Button>Another Enabled</Button>
      </div>
    );
    
    const enabledButton = screen.getByRole('button', { name: /enabled button/i });
    const disabledButton = screen.getByRole('button', { name: /disabled button/i });
    const anotherEnabledButton = screen.getByRole('button', { name: /another enabled/i });
    
    // Tab should skip disabled button
    await user.tab();
    expect(enabledButton).toHaveFocus();
    
    await user.tab();
    expect(anotherEnabledButton).toHaveFocus();
    expect(disabledButton).not.toHaveFocus();
  });

  it('handles click and keyboard activation', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<Button onClick={mockOnClick}>Clickable Button</Button>);
    
    const button = screen.getByRole('button', { name: /clickable button/i });
    
    // Test keyboard activation
    await user.tab();
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });
});