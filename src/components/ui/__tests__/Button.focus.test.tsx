import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Button } from '../button';

describe('Button Accessibility', () => {
  test('is keyboard accessible and maintains focus', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    
    // Focus via keyboard navigation
    await user.tab();
    expect(button).toHaveFocus();
    
    // Activate via keyboard
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Space key should also work
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('disabled button is not focusable or interactive', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Try to focus - should not work
    await user.tab();
    expect(button).not.toHaveFocus();
    
    // Try to click - should not work
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('focus moves correctly between multiple buttons', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Button>First Button</Button>
        <Button>Second Button</Button>
        <Button>Third Button</Button>
      </div>
    );
    
    const buttons = screen.getAllByRole('button');
    
    // Tab through buttons sequentially
    await user.tab();
    expect(buttons[0]).toHaveFocus();
    
    await user.tab();
    expect(buttons[1]).toHaveFocus();
    
    await user.tab();
    expect(buttons[2]).toHaveFocus();
  });
});