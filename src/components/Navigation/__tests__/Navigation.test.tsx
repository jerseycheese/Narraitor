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
    colorScheme: 'light',
    resolvedColorScheme: 'light',
    setColorScheme: jest.fn(),
  }),
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

    it('always renders the hamburger toggle so CSS (not JS matchMedia) gates its visibility', () => {
      // The useMobileNavigation mock returns isMobile: false (desktop). The toggle
      // must still be in the DOM — visibility is owned by the .header-nav-mobile-toggle
      // media query, giving the header one source of truth for the collapse (#1381).
      render(<HeaderNavigation />);

      expect(
        screen.getByRole('button', { name: 'Open menu' })
      ).toBeInTheDocument();
    });
  });

  describe('Theme Controls', () => {
    it('renders the appearance menu (theme + color mode live inside it)', () => {
      render(<HeaderNavigation />);

      expect(
        screen.getByRole('button', { name: 'Appearance' })
      ).toBeInTheDocument();
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

    it('renders the appearance menu in the sidebar bottom toolbar', () => {
      render(<SidebarNavigation />);

      const appearance = screen.getByRole('button', { name: 'Appearance' });
      expect(appearance).toBeInTheDocument();
      expect(appearance.closest('.workshop-sidebar-toolbar')).not.toBeNull();
    });

    it('does not render the contextual CTA inside the rail (it lives in the workspace header on desktop)', () => {
      render(<SidebarNavigation />);

      // Without seeded worlds the CTA on default surface would be "Create Your First World".
      // The drafting-rail design moves all contextual CTAs into the workspace header,
      // not the rail itself. Sidebar must not render any of these labels.
      expect(screen.queryByText('Create Your First World')).not.toBeInTheDocument();
      expect(screen.queryByText('Browse Worlds')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Play$/i })).not.toBeInTheDocument();
    });
  });
});
