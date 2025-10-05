import React from 'react';
import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event'; // Removed as not used in current tests
import { Breadcrumbs } from '../Breadcrumbs';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/worlds/world-1/characters/char-1',
}));

// Mock stores for breadcrumb data
const mockWorldStore = {
  worlds: {
    'world-1': { id: 'world-1', name: 'Fantasy World' }
  } as Record<string, { id: string; name: string }>,
  currentWorldId: 'world-1',
  getWorld: (id: string) => mockWorldStore.worlds[id],
};

const mockCharacterStore = {
  characters: {
    'char-1': { id: 'char-1', name: 'Hero Character', worldId: 'world-1' }
  } as Record<string, { id: string; name: string; worldId: string }>,
  getCharacter: (id: string) => mockCharacterStore.characters[id],
};

const mockSessionStore = {
  initializeSession: jest.fn(),
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (store: typeof mockWorldStore) => unknown) => selector ? selector(mockWorldStore) : mockWorldStore,
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: (selector: (store: typeof mockCharacterStore) => unknown) => selector ? selector(mockCharacterStore) : mockCharacterStore,
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: (selector: (store: typeof mockSessionStore) => unknown) => selector ? selector(mockSessionStore) : mockSessionStore,
}));

// Mock the navigation flow hook
jest.mock('@/hooks/useNavigationFlow', () => ({
  useNavigationFlow: () => ({
    getNextStep: jest.fn(() => null),
  }),
}));

// Mock the route utils
jest.mock('@/utils/routeUtils', () => ({
  buildBreadcrumbSegments: jest.fn(() => [
    { id: 'worlds', label: 'Worlds', href: '/worlds', isActive: false, isClickable: true },
    { id: 'world-1', label: 'Fantasy World', href: '/worlds/world-1', isActive: false, isClickable: true },
    { id: 'characters', label: 'Characters', href: '/worlds/world-1/characters', isActive: false, isClickable: true },
    { id: 'char-1', label: 'Hero Character', href: '/characters/char-1', isActive: true, isClickable: false },
  ]),
}));

describe('Breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Breadcrumb Display', () => {
    it('shows breadcrumb trail for nested navigation', () => {
      render(<Breadcrumbs />);

      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Fantasy World')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Hero Character')).toBeInTheDocument();
    });

    it('makes parent breadcrumbs clickable with proper hrefs', () => {
      render(<Breadcrumbs />);

      const worldsLink = screen.getByText('Worlds').closest('a');
      const worldLink = screen.getByText('Fantasy World').closest('a');
      const charactersLink = screen.getByText('Characters').closest('a');

      expect(worldsLink).toHaveAttribute('href', '/worlds');
      expect(worldLink).toHaveAttribute('href', '/worlds/world-1');
      expect(charactersLink).toHaveAttribute('href', '/worlds/world-1/characters');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA navigation structure and accessible links', () => {
      render(<Breadcrumbs />);

      const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumbNav).toBeInTheDocument();
      expect(breadcrumbNav).toHaveAttribute('aria-label', 'Breadcrumb');

      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBeGreaterThan(0);

      allLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link).toBeVisible();
      });
    });
  });
});