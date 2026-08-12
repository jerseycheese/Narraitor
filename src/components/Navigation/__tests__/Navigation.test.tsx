import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeaderNavigation } from '../HeaderNavigation';

// Mock next/navigation
const mockPush = jest.fn();
let mockPathname = '/worlds';
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: mockPathname,
  }),
  usePathname: () => mockPathname,
}));

// Mock stores - will be modified in tests
const mockWorldStore: {
  worlds: Record<string, { id: string; name: string; genre?: string }>;
  currentWorldId: string | null;
  setCurrentWorld: jest.Mock;
} = {
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
    mockPathname = '/worlds';
    mockWorldStore.worlds = {};
    mockWorldStore.currentWorldId = null;
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

  describe('Contextual CTA (#1655)', () => {
    const seedActiveWorld = () => {
      mockWorldStore.worlds = {
        'world-1': { id: 'world-1', name: 'Test World', genre: 'fantasy' },
      };
      mockWorldStore.currentWorldId = 'world-1';
    };

    it('renders Play in the success variant so it matches every other Play control', () => {
      mockPathname = '/dashboard';
      seedActiveWorld();

      render(<HeaderNavigation />);

      expect(screen.getByRole('button', { name: /^Play$/ })).toHaveClass(
        'button-success'
      );
    });

    // Every route that renders its own play control: /worlds/[id] ("Play in
    // World"), /characters (per-card Play), /characters/[id] ("Play with
    // Character"). All three land on the same play URL as the header's Play.
    it.each([
      '/worlds',
      '/worlds/world-1',
      '/characters',
      '/characters/char-1',
    ])(
      'suppresses the CTA on %s, which owns the action inline',
      (pathname) => {
        mockPathname = pathname;
        seedActiveWorld();

        render(<HeaderNavigation />);

        expect(
          screen.queryByRole('button', { name: /^Play$/ })
        ).not.toBeInTheDocument();
      }
    );

    // The brand register (/, /about, /privacy, /terms) suppresses the CTA
    // wholesale rather than via CTA_SUPPRESSED_ROUTES, so each brand page's
    // own CTA (or lack of one) is the only primary action on screen (#1734).
    it.each(['/', '/about', '/privacy', '/terms'])(
      'suppresses the CTA on the brand route %s',
      (pathname) => {
        mockPathname = pathname;

        render(<HeaderNavigation />);

        expect(
          screen.queryByRole('button', { name: /Create Your First World/ })
        ).not.toBeInTheDocument();
      }
    );

    it('still renders the CTA on a product route not on the suppression list', () => {
      mockPathname = '/settings';

      render(<HeaderNavigation />);

      expect(
        screen.getByRole('button', { name: /Create Your First World/ })
      ).toBeInTheDocument();
    });
  });

  describe('Breadcrumb suppression (#1655)', () => {
    it('hides breadcrumbs on top-level destinations', () => {
      mockPathname = '/characters';

      render(<HeaderNavigation />);

      expect(screen.queryByTestId('breadcrumbs')).not.toBeInTheDocument();
    });

    it('keeps breadcrumbs on nested routes', () => {
      mockPathname = '/settings/providers';

      render(<HeaderNavigation />);

      expect(screen.getAllByTestId('breadcrumbs').length).toBeGreaterThan(0);
    });

    // The whole brand register is context-band-free, so this asserts the band
    // itself is absent rather than empty: it carries its own padding and
    // border, and an empty one is a visible artifact.
    it.each(['/', '/about', '/privacy', '/terms'])(
      'renders no context band on the brand route %s',
      (pathname) => {
        mockPathname = pathname;

        const { container } = render(<HeaderNavigation />);

        expect(container.querySelector('.context-band')).toBeNull();
      }
    );

    it('keeps the context band on nested product routes', () => {
      mockPathname = '/worlds/world-1';

      const { container } = render(<HeaderNavigation />);

      expect(container.querySelector('.context-band')).not.toBeNull();
    });
  });

  // The active world reads as story-level context, so it sits in the band with
  // the path rather than in the header row, where its user-authored width
  // reflowed every control beside it.
  describe('World switcher placement', () => {
    const seedWorlds = () => {
      mockWorldStore.worlds = {
        'world-1': { id: 'world-1', name: 'Test World', genre: 'fantasy' },
      };
      mockWorldStore.currentWorldId = 'world-1';
    };

    it('renders the switcher in the context band, not the header row', () => {
      mockPathname = '/dashboard';
      seedWorlds();

      const { container } = render(<HeaderNavigation />);

      expect(
        container.querySelector('.context-band .world-switcher')
      ).not.toBeNull();
      expect(container.querySelector('.header-nav .world-switcher')).toBeNull();
    });

    // A top-level destination suppresses breadcrumbs, so the switcher is the
    // only thing left to earn the band.
    it('renders the band for the switcher alone on a breadcrumb-free route', () => {
      mockPathname = '/dashboard';
      seedWorlds();

      const { container } = render(<HeaderNavigation />);

      expect(container.querySelector('.context-band')).not.toBeNull();
      expect(screen.queryByTestId('breadcrumbs')).not.toBeInTheDocument();
    });

    it('drops the band entirely when there is no path and no world', () => {
      mockPathname = '/dashboard';

      const { container } = render(<HeaderNavigation />);

      expect(container.querySelector('.context-band')).toBeNull();
    });
  });
});
