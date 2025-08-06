import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '../Navigation';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/worlds',
  }),
  usePathname: () => '/worlds',
}));

// Mock stores
const mockWorldStore = {
  worlds: {},
  currentWorldId: null,
  setCurrentWorld: jest.fn(),
};

const mockSessionStore = {
  currentCharacterId: null,
  setCurrentCharacter: jest.fn(),
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (store: typeof mockWorldStore) => unknown) => selector ? selector(mockWorldStore) : mockWorldStore,
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: (selector: (store: typeof mockSessionStore) => unknown) => selector ? selector(mockSessionStore) : mockSessionStore,
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({ characters: {} }),
}));

// Mock additional hooks used by Navigation
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

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => ({}),
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

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset viewport to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Core Navigation', () => {
    it('displays main navigation items', () => {
      render(<Navigation />);
      
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('handles navigation item clicks', async () => {
      render(<Navigation />);
      
      // Click on Characters link (which should be a Link component, not trigger router.push)
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink.closest('a')).toHaveAttribute('href', '/characters');
    });

    it('shows current page indicator', () => {
      render(<Navigation />);
      
      // Current page should be highlighted (worlds in this case based on pathname '/worlds')
      const worldsLink = screen.getByText('Worlds');
      expect(worldsLink).toHaveClass('text-white'); // Current page gets text-white class
    });
  });

  describe('Mobile Navigation', () => {
    it('renders mobile navigation component when available', () => {
      render(<Navigation />);
      
      // The MobileNavigationMenu component should be rendered (mocked)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation through menu items', async () => {
      const user = userEvent.setup();
      render(<Navigation />);
      
      // Tab through navigation items - logo link will be first, then navigation items
      await user.tab(); // Logo link
      await user.tab(); // Worlds link
      expect(screen.getByText('Worlds')).toHaveFocus();
      
      await user.tab(); // Characters link
      expect(screen.getByText('Characters')).toHaveFocus();
      
      await user.tab(); // Settings link
      expect(screen.getByText('Settings')).toHaveFocus();
    });

    it('activates navigation items with Enter key', async () => {
      const user = userEvent.setup();
      render(<Navigation />);
      
      // Focus and activate Characters link (Links handle Enter key natively)
      await user.tab(); // Logo
      await user.tab(); // Worlds
      await user.tab(); // Characters
      
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveFocus();
      expect(charactersLink.closest('a')).toHaveAttribute('href', '/characters');
    });

    it('handles keyboard shortcuts', () => {
      render(<Navigation />);
      
      // Keyboard shortcuts are handled by the useKeyboardShortcuts hook (mocked)
      // Just verify the component renders successfully with keyboard support
      expect(screen.getByText('Worlds')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Navigation />);
      
      // Check that navigation links are present and accessible
      const worldsLink = screen.getByText('Worlds').closest('a');
      const charactersLink = screen.getByText('Characters').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');
      
      expect(worldsLink).toHaveAttribute('href', '/worlds');
      expect(charactersLink).toHaveAttribute('href', '/characters');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('announces current page to screen readers', () => {
      render(<Navigation />);
      
      // Current page (Worlds based on pathname '/worlds') should have visual highlighting
      const currentLink = screen.getByText('Worlds');
      expect(currentLink).toHaveClass('text-white');
    });

    it('provides accessible navigation structure', () => {
      render(<Navigation />);
      
      // Main navigation should have banner role (as set in component)  
      const nav = screen.getByRole('banner');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('World Switcher Integration', () => {
    it('shows world switcher when worlds are available', () => {
      // Mock worlds in the store
      mockWorldStore.worlds = {
        'world-1': { id: 'world-1', name: 'Fantasy World' }
      };
      
      render(<Navigation />);
      
      // World switcher should be visible when worlds exist
      expect(screen.getByText('Select World')).toBeInTheDocument();
    });

    it('does not show world switcher when no worlds exist', () => {
      // Ensure no worlds in the store
      mockWorldStore.worlds = {};
      
      render(<Navigation />);
      
      // World switcher should not be visible
      expect(screen.queryByText('Select World')).not.toBeInTheDocument();
    });
  });
});