import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeaderNavigation } from '../HeaderNavigation';
import { SidebarNavigation } from '../SidebarNavigation';

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

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: jest.fn(() => ({
    startTour: jest.fn(),
    stopTour: jest.fn(),
    setCurrentWizardStep: jest.fn(),
    isTourActive: false,
    currentTour: null,
  })),
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

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    theme: 'ds1',
    colorScheme: 'light',
    resolvedColorScheme: 'light',
    setTheme: jest.fn(),
    setColorScheme: jest.fn(),
  }),
  THEMES: [
    { id: 'ds1', name: 'Drafting Table', description: 'test' },
    { id: 'ds2', name: 'Warm Earth', description: 'test' },
    { id: 'ds3', name: 'Mechanical Manuscript', description: 'test' },
  ],
}));

describe('HeaderNavigation', () => {
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
      render(<HeaderNavigation />);

      expect(screen.getByText('Worlds')).toBeInTheDocument();
      const charactersLink = screen.getByText('Characters');
      expect(charactersLink).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('displays Characters nav when worlds exist', () => {
      mockWorldStore.worlds = { 'world-1': { id: 'world-1', name: 'Test World' } };

      render(<HeaderNavigation />);

      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      const charactersLink = screen.getByText('Characters');
      expect(charactersLink.closest('a')).toHaveAttribute('href', '/characters');

      mockWorldStore.worlds = {};
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation links and structure', () => {
      render(<HeaderNavigation />);

      const worldsLink = screen.getByText('Worlds').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');

      expect(worldsLink).toHaveAttribute('href', '/worlds');
      expect(settingsLink).toHaveAttribute('href', '/settings');

      const nav = screen.getByRole('banner');
      expect(nav).toBeInTheDocument();

      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBeGreaterThan(0);
      allLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('renders mobile navigation component', () => {
      render(<HeaderNavigation />);

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });
  });

  describe('Theme Controls', () => {
    it('renders theme switcher and dark mode toggle', () => {
      render(<HeaderNavigation />);

      expect(screen.getByRole('radiogroup', { name: 'Design system theme' })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: 'Color scheme' })).toBeInTheDocument();
    });
  });

  describe('SidebarNavigation', () => {
    it('renders core workshop navigation affordances', () => {
      render(<SidebarNavigation />);

      expect(
        screen.getByRole('navigation', { name: 'Workshop navigation' })
      ).toBeInTheDocument();
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders theme controls in sidebar', () => {
      render(<SidebarNavigation />);

      expect(screen.getByRole('radiogroup', { name: 'Design system theme' })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: 'Color scheme' })).toBeInTheDocument();
    });
  });
});
