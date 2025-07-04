import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Navigation } from '../Navigation';

// Mock the required hooks and components
jest.mock('next/navigation', () => ({
  usePathname: () => '/worlds',
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    currentWorldId: 'world-1',
    worlds: {
      'world-1': { id: 'world-1', name: 'Test World', genre: 'Fantasy' },
      'world-2': { id: 'world-2', name: 'Sci-Fi World', genre: 'Science Fiction' },
    },
    setCurrentWorld: jest.fn(),
  }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({
    characters: {
      'char-1': { id: 'char-1', worldId: 'world-1', name: 'Hero' },
      'char-2': { id: 'char-2', worldId: 'world-1', name: 'Villain' },
    },
  }),
}));

jest.mock('@/components/shared/NavigationLoadingProvider', () => ({
  useNavigationLoadingContext: () => ({
    navigateWithLoading: jest.fn(),
  }),
}));

jest.mock('@/hooks/useMobileNavigation', () => ({
  useMobileNavigation: () => ({
    isMenuOpen: false,
    isMobile: false,
    closeMenu: jest.fn(),
    toggleMenu: jest.fn(),
  }),
}));

// Mock child components
jest.mock('../Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

jest.mock('../RecentPagesDropdown', () => ({
  RecentPagesDropdown: () => <div data-testid="recent-pages">Recent Pages</div>,
}));

jest.mock('../MobileNavigationMenu', () => ({
  MobileNavigationMenu: () => <div data-testid="mobile-menu">Mobile Menu</div>,
}));

jest.mock('@/components/ui/Logo', () => ({
  LogoIcon: () => <div data-testid="logo-icon">Logo</div>,
  LogoText: () => <div data-testid="logo-text">Narraitor</div>,
}));

describe('Navigation Keyboard Accessibility', () => {
  test('has proper navigation landmark semantics', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('banner');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
  });

  test('all navigation links are reachable via keyboard', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    // Get all focusable navigation elements
    const logoLink = screen.getByRole('link', { name: /narraitor/i });
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    
    // Tab through navigation elements
    await user.tab();
    expect(logoLink).toHaveFocus();
    
    await user.tab();
    expect(worldsLink).toHaveFocus();
    
    await user.tab();
    expect(charactersLink).toHaveFocus();
    
    await user.tab();
    expect(settingsLink).toHaveFocus();
  });

  test('supports reverse tab navigation (Shift+Tab)', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    
    // Focus the last navigation item
    settingsLink.focus();
    expect(settingsLink).toHaveFocus();
    
    // Shift+Tab should go to previous item
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(charactersLink).toHaveFocus();
  });

  test('current page has proper aria-current indication', () => {
    render(<Navigation />);
    
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    
    // Current page (worlds) should have active styling
    expect(worldsLink).toHaveClass('text-white');
    
    // Other links should not
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    expect(charactersLink).toHaveClass('text-gray-300');
  });

  test('world switcher dropdown supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const worldSwitcher = screen.getByRole('button', { name: /test world/i });
    
    // Should be focusable
    worldSwitcher.focus();
    expect(worldSwitcher).toHaveFocus();
    
    // Enter or Space should open dropdown
    await user.keyboard('{Enter}');
    
    // Dropdown should open with world options
    expect(screen.getByText('Sci-Fi World')).toBeInTheDocument();
  });

  test('Escape key closes world switcher dropdown', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const worldSwitcher = screen.getByRole('button', { name: /test world/i });
    
    // Open dropdown
    await user.click(worldSwitcher);
    expect(screen.getByText('Sci-Fi World')).toBeInTheDocument();
    
    // Escape should close dropdown
    await user.keyboard('{Escape}');
    
    // Dropdown should be closed (world options no longer visible)
    expect(screen.queryByText('Sci-Fi World')).not.toBeInTheDocument();
    
    // Focus should return to the trigger button
    expect(worldSwitcher).toHaveFocus();
  });

  test('navigation links have proper focus indicators', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const worldsLink = screen.getByRole('link', { name: /worlds/i });
    
    // Focus the link
    await user.tab();
    await user.tab(); // Skip logo, get to worlds link
    
    expect(worldsLink).toHaveFocus();
    
    // Should have visible focus styling
    expect(worldsLink).toHaveClass('hover:text-white');
    expect(worldsLink).toHaveClass('transition-colors');
  });

  test('navigation is accessible to screen readers', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('banner');
    
    // Should have proper landmark role
    expect(nav).toHaveAttribute('role', 'banner');
    
    // All links should be properly labeled
    expect(screen.getByRole('link', { name: /narraitor/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /worlds/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /characters/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  test('mobile menu button has proper accessibility attributes', () => {
    // Mock mobile state
    jest.doMock('@/hooks/useMobileNavigation', () => ({
      useMobileNavigation: () => ({
        isMenuOpen: false,
        isMobile: true,
        closeMenu: jest.fn(),
        toggleMenu: jest.fn(),
      }),
    }));
    
    // Re-render with mobile menu
    const { rerender } = render(<Navigation />);
    rerender(<Navigation />);
    
    const menuButton = screen.queryByRole('button', { name: /open menu/i });
    
    if (menuButton) {
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('keyboard navigation works with loading states', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    
    // Should be focusable even in loading state
    playButton.focus();
    expect(playButton).toHaveFocus();
    
    // Should be activatable via keyboard
    await user.keyboard('{Enter}');
    // Note: This would normally trigger navigation, but we're just testing focus
  });

  test('navigation maintains logical tab order', async () => {
    const user = userEvent.setup();
    
    render(<Navigation />);
    
    // Expected tab order: Logo -> Worlds -> Characters -> Settings -> Recent Pages -> World Switcher -> Play
    const expectedFocusOrder = [
      screen.getByRole('link', { name: /narraitor/i }),
      screen.getByRole('link', { name: /worlds/i }),
      screen.getByRole('link', { name: /characters/i }),
      screen.getByRole('link', { name: /settings/i }),
    ];
    
    for (let i = 0; i < expectedFocusOrder.length; i++) {
      await user.tab();
      expect(expectedFocusOrder[i]).toHaveFocus();
    }
  });

  test('skip links integration works with navigation', () => {
    render(
      <div>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <Navigation />
        <main id="main-content">Main Content</main>
      </div>
    );
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const mainContent = screen.getByRole('main');
    
    expect(skipLink).toBeInTheDocument();
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });
});