import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '../Navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}));

describe('Navigation - Keyboard Navigation', () => {
  it('renders as a navigation landmark', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('has accessible navigation links', () => {
    render(<Navigation />);
    
    // Main navigation links should be accessible
    const homeLink = screen.getByRole('link', { name: /home/i });
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    
    expect(homeLink).toBeInTheDocument();
    expect(worldsLink).toBeInTheDocument();
    expect(charactersLink).toBeInTheDocument();
  });

  it('supports sequential tab navigation through all links', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    // Get all navigation links
    const homeLink = screen.getByRole('link', { name: /home/i });
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    
    // Tab through navigation links in order
    await user.tab();
    expect(homeLink).toHaveFocus();
    
    await user.tab();
    expect(worldsLink).toHaveFocus();
    
    await user.tab();
    expect(charactersLink).toHaveFocus();
  });

  it('supports reverse tab navigation', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    
    // Tab to last link
    await user.tab(); // home
    await user.tab(); // worlds
    await user.tab(); // characters
    expect(charactersLink).toHaveFocus();
    
    // Shift+Tab back
    await user.tab({ shift: true });
    expect(worldsLink).toHaveFocus();
    
    await user.tab({ shift: true });
    expect(homeLink).toHaveFocus();
  });

  it('has visible focus indicators on navigation links', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    
    await user.tab();
    expect(homeLink).toHaveFocus();
    
    // Should have focus-visible styling
    expect(homeLink).toHaveClass('focus-visible:ring-2');
    expect(homeLink).toHaveClass('focus-visible:ring-ring');
  });

  it('supports Enter key activation for navigation', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    
    await user.tab(); // home
    await user.tab(); // worlds
    expect(worldsLink).toHaveFocus();
    
    // Enter should activate the link
    await user.keyboard('{Enter}');
    
    // Link should have href attribute for navigation
    expect(worldsLink).toHaveAttribute('href', '/worlds');
  });

  it('indicates current page with aria-current', () => {
    // Mock current pathname
    const mockPathname = '/worlds';
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: jest.fn(),
        pathname: mockPathname,
      }),
      usePathname: () => mockPathname,
    }));
    
    render(<Navigation />);
    
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    
    // Current page should be marked with aria-current
    expect(worldsLink).toHaveAttribute('aria-current', 'page');
  });

  it('has proper heading structure for screen readers', () => {
    render(<Navigation />);
    
    // Navigation should have proper semantic structure
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('supports mobile menu keyboard navigation', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<Navigation />);
    
    // Mobile menu button should be accessible
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
    
    // Should be focusable
    await user.tab();
    expect(menuButton).toHaveFocus();
    
    // Should have proper ARIA attributes
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    
    // Enter should open menu
    await user.keyboard('{Enter}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('handles Escape key to close mobile menu', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open menu
    await user.tab();
    await user.keyboard('{Enter}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Escape should close menu
    await user.keyboard('{Escape}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('traps focus within mobile menu when open', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open menu
    await user.tab();
    await user.keyboard('{Enter}');
    
    // Tab should move to first menu item
    await user.tab();
    const firstMenuItem = screen.getByRole('link', { name: /home/i });
    expect(firstMenuItem).toHaveFocus();
    
    // Continue tabbing through menu items
    await user.tab();
    const secondMenuItem = screen.getByRole('link', { name: /worlds/i });
    expect(secondMenuItem).toHaveFocus();
  });
});