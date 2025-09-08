import React from 'react';
import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event'; // Removed as not used in current tests
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

// Mock stores - will be modified in tests
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
    it('displays main navigation items when no worlds exist', () => {
      // Default mock has empty worlds object
      render(<Navigation />);
      
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toBeInTheDocument();
      expect(charactersLink).toHaveClass('hidden');
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('displays Characters nav when worlds exist', () => {
      // Mock store with worlds
      mockWorldStore.worlds = { 'world-1': { id: 'world-1', name: 'Test World' } };
      
      render(<Navigation />);
      
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Verify Characters link has correct href
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink.closest('a')).toHaveAttribute('href', '/characters');
      
      // Reset mock for other tests
      mockWorldStore.worlds = {};
    });

    it('shows current page appropriately', () => {
      render(<Navigation />);
      
      // Current page should be identifiable to users
      const worldsLink = screen.getByText('Worlds');
      expect(worldsLink).toBeInTheDocument();
      expect(worldsLink).toBeVisible();
      
      // Verify current page is accessible and visible
      const worldsLinkElement = worldsLink.closest('a') || worldsLink.closest('button');
      expect(worldsLinkElement).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('renders mobile navigation component when available', () => {
      render(<Navigation />);
      
      // Mobile navigation should be available for responsive design
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('provides keyboard accessible navigation elements', () => {
      render(<Navigation />);
      
      // Verify all navigation links are keyboard accessible (no worlds = no Characters nav)
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBeGreaterThan(0);
      
      // Each link should be focusable and have proper href
      allLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('navigation links have proper accessibility attributes', () => {
      render(<Navigation />);
      
      // Verify main navigation links are properly structured (no Characters when no worlds)
      const worldsLink = screen.getByText('Worlds').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');
      
      expect(worldsLink).toHaveAttribute('href', '/worlds');
      expect(settingsLink).toHaveAttribute('href', '/settings');
      
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveClass('hidden');
    });

    it('renders with keyboard support enabled', () => {
      render(<Navigation />);
      
      // Component should render successfully with keyboard shortcuts enabled (no Characters when no worlds)
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveClass('hidden');
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation links when no worlds exist', () => {
      render(<Navigation />);
      
      // Check that navigation links are present and accessible (no Characters when no worlds)
      const worldsLink = screen.getByText('Worlds').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');
      
      expect(worldsLink).toHaveAttribute('href', '/worlds');
      expect(settingsLink).toHaveAttribute('href', '/settings');
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveClass('hidden');
    });

    it('displays current page appropriately', () => {
      render(<Navigation />);
      
      // Current page should be visible and identifiable to users
      const currentLink = screen.getByText('Worlds');
      expect(currentLink).toBeInTheDocument();
      expect(currentLink).toBeVisible();
    });

    it('provides accessible navigation structure', () => {
      render(<Navigation />);
      
      // Main navigation should be present and accessible
      const nav = screen.getByRole('banner');
      expect(nav).toBeInTheDocument();
      
      // Navigation text should be visible (no Characters when no worlds)
      expect(screen.getByText('Worlds')).toBeVisible();
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveClass('hidden');
      expect(screen.getByText('Settings')).toBeVisible();
    });
  });

  describe('World Switcher Integration', () => {
    it('renders navigation consistently when no worlds exist', () => {
      render(<Navigation />);
      
      // Navigation should render core elements (no Characters when no worlds)
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveClass('hidden');
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Supporting components should be rendered (mocked in this test)
      expect(screen.getByTestId('recent-pages')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    it('shows only Worlds and Settings nav when no worlds exist', () => {
      // Mock store with empty worlds (default mockWorldStore)
      render(<Navigation />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Worlds')).toBeVisible();
      // Characters link exists but is hidden when no worlds exist
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toHaveClass('hidden');
      expect(screen.getByText('Settings')).toBeVisible();
    });

    it('shows Characters nav when worlds exist', () => {
      // Mock store with worlds
      mockWorldStore.worlds = { 'world-1': { id: 'world-1', name: 'Test World' } };
      
      render(<Navigation />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Worlds')).toBeVisible();
      expect(screen.getByText('Characters')).toBeVisible();
      expect(screen.getByText('Settings')).toBeVisible();
      
      // Reset mock for other tests
      mockWorldStore.worlds = {};
    });
  });
});