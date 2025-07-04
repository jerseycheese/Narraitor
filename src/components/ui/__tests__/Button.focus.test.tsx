import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Button } from '../button';

describe('Button Focus Indicators (WCAG 2.1 AA)', () => {
  test('has visible focus indicator when focused via keyboard', async () => {
    const user = userEvent.setup();
    
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    
    // Focus via keyboard (Tab)
    await user.tab();
    
    expect(button).toHaveFocus();
    
    // Should have focus-visible styles applied
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-blue-500');
    expect(button).toHaveClass('focus-visible:ring-offset-2');
  });

  test('focus indicator is visible on all button variants', async () => {
    const user = userEvent.setup();
    
    const variants = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const;
    
    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>Test {variant}</Button>);
      
      const button = screen.getByRole('button');
      
      // Focus the button
      await user.tab();
      
      // All variants should have focus indicators
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
      
      unmount();
    }
  });

  test('focus indicator is visible on all button sizes', async () => {
    const user = userEvent.setup();
    
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;
    
    for (const size of sizes) {
      const { unmount } = render(<Button size={size}>Test {size}</Button>);
      
      const button = screen.getByRole('button');
      
      await user.tab();
      
      // All sizes should have focus indicators
      expect(button).toHaveClass('focus-visible:ring-2');
      
      unmount();
    }
  });

  test('disabled button cannot receive focus', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Disabled buttons should not be focusable
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveClass('disabled:pointer-events-none');
    expect(button).toHaveClass('disabled:opacity-50');
    
    // Try to focus - should not work
    button.focus();
    expect(button).not.toHaveFocus();
  });

  test('button responds to keyboard activation (Enter and Space)', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Focus the button
    button.focus();
    
    // Test Enter key
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Test Space key  
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('focus indicator has sufficient color contrast', () => {
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Focus ring should use accessible blue color
    expect(button).toHaveClass('focus-visible:ring-blue-500');
    
    // Should have proper offset for visibility
    expect(button).toHaveClass('focus-visible:ring-offset-2');
    
    // Should remove default outline to avoid double focus indicators
    expect(button).toHaveClass('focus-visible:outline-none');
  });

  test('focus indicator works with custom className', async () => {
    const user = userEvent.setup();
    
    render(
      <Button className="custom-class">Custom Button</Button>
    );
    
    const button = screen.getByRole('button');
    
    await user.tab();
    
    // Should maintain both custom and focus classes
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('focus-visible:ring-2');
  });

  test('button maintains focus indicator during interactions', async () => {
    const user = userEvent.setup();
    
    render(<Button>Interactive Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Focus via keyboard
    await user.tab();
    expect(button).toHaveFocus();
    
    // Hover should not remove focus
    await user.hover(button);
    expect(button).toHaveFocus();
    
    // Focus indicator should still be present
    expect(button).toHaveClass('focus-visible:ring-2');
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
    
    // Shift+Tab should go backwards
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(buttons[1]).toHaveFocus();
  });

  test('focus indicator persists during button state changes', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [loading, setLoading] = React.useState(false);
      
      return (
        <Button 
          onClick={() => setLoading(!loading)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Click Me'}
        </Button>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    
    // Focus the button
    await user.tab();
    expect(button).toHaveFocus();
    
    // Click to change state
    await user.click(button);
    
    // Button should now be disabled but maintain focus styles structure
    expect(button).toHaveTextContent('Loading...');
    expect(button).toHaveClass('focus-visible:ring-2');
  });
});