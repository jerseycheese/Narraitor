import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from '../Breadcrumbs';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useParams: jest.fn(),
  useRouter: jest.fn(() => mockRouter),
}));

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// Mock route utils
jest.mock('@/utils/routeUtils', () => ({
  buildBreadcrumbSegments: jest.fn(),
}));

import { buildBreadcrumbSegments } from '@/utils/routeUtils';
const mockedBuildBreadcrumbSegments = buildBreadcrumbSegments as jest.MockedFunction<typeof buildBreadcrumbSegments>;

describe('Breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useParams as jest.Mock).mockReturnValue({});
    
    // Default mock for buildBreadcrumbSegments
    mockedBuildBreadcrumbSegments.mockReturnValue([]);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (worldStore as jest.Mock).mockReturnValue({
      worlds: {},
      currentWorldId: null,
    });
    (characterStore as jest.Mock).mockReturnValue({
      characters: {},
    });
  });

  describe('Basic breadcrumb generation', () => {
    it('should not render breadcrumbs on root path', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      
      render(<Breadcrumbs />);
      
      expect(screen.queryByTestId('breadcrumb-home')).not.toBeInTheDocument();
      expect(screen.queryByText('Worlds')).not.toBeInTheDocument();
    });

    it('should render world breadcrumbs on world detail page', () => {
      (usePathname as jest.Mock).mockReturnValue('/world/123');
      (useParams as jest.Mock).mockReturnValue({ id: '123' });
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {
          '123': { id: '123', name: 'Fantasy Realm' }
        },
        currentWorldId: '123',
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    });

    it('should render character breadcrumbs on character pages', () => {
      (usePathname as jest.Mock).mockReturnValue('/characters');
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {
          '123': { id: '123', name: 'Fantasy Realm' }
        },
        currentWorldId: '123',
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
        { label: 'Characters', href: '/characters', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
    });

    it('should render full hierarchy on character detail page', () => {
      (usePathname as jest.Mock).mockReturnValue('/characters/char-456');
      (useParams as jest.Mock).mockReturnValue({ id: 'char-456' });
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {
          '123': { id: '123', name: 'Fantasy Realm' }
        },
        currentWorldId: '123',
      });
      (characterStore as jest.Mock).mockReturnValue({
        characters: {
          'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
        },
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
        { label: 'Characters', href: '/characters', isCurrentPage: false },
        { label: 'Aragorn', href: '/characters/char-456', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });
  });

  describe('Navigation behavior', () => {
    it('should navigate to worlds when clicking Worlds breadcrumb', async () => {
      const user = userEvent.setup();
      // Set pathname to a page where Worlds breadcrumb is clickable
      (usePathname as jest.Mock).mockReturnValue('/world/123');
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {
          '123': { id: '123', name: 'Fantasy Realm' }
        },
        currentWorldId: '123',
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      await user.click(screen.getByText('Worlds'));
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });

    it('should navigate to world when clicking world breadcrumb', async () => {
      const user = userEvent.setup();
      (usePathname as jest.Mock).mockReturnValue('/characters');
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {
          '123': { id: '123', name: 'Fantasy Realm' }
        },
        currentWorldId: '123',
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
        { label: 'Characters', href: '/characters', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      await user.click(screen.getByText('Fantasy Realm'));
      expect(mockPush).toHaveBeenCalledWith('/world/123');
    });

    it('should not navigate when clicking current page breadcrumb', async () => {
      const user = userEvent.setup();
      (usePathname as jest.Mock).mockReturnValue('/world/123');
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Test World', href: '/world/123', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      const currentBreadcrumb = screen.getByText('Test World');
      expect(currentBreadcrumb).toHaveAttribute('aria-current', 'page');
      
      await user.click(currentBreadcrumb);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Mobile behavior', () => {
    it('should truncate breadcrumbs on mobile when maxItems is set', () => {
      (usePathname as jest.Mock).mockReturnValue('/characters/char-456');
      (worldStore as jest.Mock).mockReturnValue({
        worlds: { '123': { id: '123', name: 'Fantasy Realm' } },
        currentWorldId: '123',
      });
      (characterStore as jest.Mock).mockReturnValue({
        characters: {
          'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
        },
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
        { label: 'Characters', href: '/characters', isCurrentPage: false },
        { label: 'Aragorn', href: '/characters/char-456', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs maxItems={2} />);
      
      // Should show ellipsis and last 2 items
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Aragorn')).toBeInTheDocument();
      expect(screen.queryByText('Worlds')).not.toBeInTheDocument();
      expect(screen.queryByText('Fantasy Realm')).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading state for entity names', () => {
      (usePathname as jest.Mock).mockReturnValue('/world/123');
      (useParams as jest.Mock).mockReturnValue({ id: '123' });
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {},  // No world data yet
        currentWorldId: '123',
      });
      
      mockedBuildBreadcrumbSegments.mockReturnValue([
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Loading...', href: '/world/123', isCurrentPage: true },
      ]);
      
      render(<Breadcrumbs />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Icon functionality', () => {
    describe('Icon mapping', () => {
      it('should display Home icon for Worlds breadcrumb', () => {
        (usePathname as jest.Mock).mockReturnValue('/world/123');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        // Home icon should be present in Worlds breadcrumb
        const worldsBreadcrumb = screen.getByTestId('breadcrumb-home');
        expect(worldsBreadcrumb.querySelector('[data-testid="icon-home"]')).toBeInTheDocument();
      });

      it('should display Globe icon for World breadcrumb', () => {
        (usePathname as jest.Mock).mockReturnValue('/characters');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
          { label: 'Characters', href: '/characters', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        // Globe icon should be present in World breadcrumb
        const worldBreadcrumb = screen.getByTestId('breadcrumb-world');
        expect(worldBreadcrumb.querySelector('[data-testid="icon-globe"]')).toBeInTheDocument();
      });

      it('should display User icon for Character breadcrumb', () => {
        (usePathname as jest.Mock).mockReturnValue('/characters/char-456');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        (characterStore as jest.Mock).mockReturnValue({
          characters: {
            'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
          },
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
          { label: 'Characters', href: '/characters', isCurrentPage: false },
          { label: 'Aragorn', href: '/characters/char-456', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        // User icon should be present in Character breadcrumb
        const characterBreadcrumb = screen.getByTestId('breadcrumb-character');
        expect(characterBreadcrumb.querySelector('[data-testid="icon-user"]')).toBeInTheDocument();
      });

      it('should display correct icons for full breadcrumb hierarchy', () => {
        (usePathname as jest.Mock).mockReturnValue('/characters/char-456');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        (characterStore as jest.Mock).mockReturnValue({
          characters: {
            'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
          },
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
          { label: 'Characters', href: '/characters', isCurrentPage: false },
          { label: 'Aragorn', href: '/characters/char-456', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        // Verify all icons are present in the correct breadcrumbs
        const worldsBreadcrumb = screen.getByTestId('breadcrumb-home');
        const worldBreadcrumb = screen.getByTestId('breadcrumb-world');
        const charactersBreadcrumb = screen.getByTestId('breadcrumb-characters');
        const characterBreadcrumb = screen.getByTestId('breadcrumb-character');
        
        expect(worldsBreadcrumb.querySelector('[data-testid="icon-home"]')).toBeInTheDocument();
        expect(worldBreadcrumb.querySelector('[data-testid="icon-globe"]')).toBeInTheDocument();
        expect(charactersBreadcrumb.querySelector('[data-testid="icon-user"]')).toBeInTheDocument();
        expect(characterBreadcrumb.querySelector('[data-testid="icon-user"]')).toBeInTheDocument();
      });
    });

    describe('Icon accessibility', () => {
      it('should mark all icons as decorative with aria-hidden="true"', () => {
        (usePathname as jest.Mock).mockReturnValue('/characters/char-456');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        (characterStore as jest.Mock).mockReturnValue({
          characters: {
            'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
          },
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
          { label: 'Characters', href: '/characters', isCurrentPage: false },
          { label: 'Aragorn', href: '/characters/char-456', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        // All icons should be marked as decorative
        const allIcons = screen.getAllByTestId(/^icon-/);
        expect(allIcons.length).toBeGreaterThan(0);
        
        allIcons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-hidden', 'true');
        });
      });

      it('should mark Home icon as decorative', () => {
        (usePathname as jest.Mock).mockReturnValue('/world/123');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        const homeIcon = screen.getByTestId('icon-home');
        expect(homeIcon).toHaveAttribute('aria-hidden', 'true');
      });

      it('should mark Globe icon as decorative', () => {
        (usePathname as jest.Mock).mockReturnValue('/characters');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
          { label: 'Characters', href: '/characters', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        const globeIcon = screen.getByTestId('icon-globe');
        expect(globeIcon).toHaveAttribute('aria-hidden', 'true');
      });

      it('should mark User icon as decorative', () => {
        (usePathname as jest.Mock).mockReturnValue('/characters/char-456');
        (worldStore as jest.Mock).mockReturnValue({
          worlds: {
            '123': { id: '123', name: 'Fantasy Realm' }
          },
          currentWorldId: '123',
        });
        (characterStore as jest.Mock).mockReturnValue({
          characters: {
            'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
          },
        });
        
        mockedBuildBreadcrumbSegments.mockReturnValue([
          { label: 'Worlds', href: '/worlds', isCurrentPage: false },
          { label: 'Fantasy Realm', href: '/world/123', isCurrentPage: false },
          { label: 'Characters', href: '/characters', isCurrentPage: false },
          { label: 'Aragorn', href: '/characters/char-456', isCurrentPage: true },
        ]);
        
        render(<Breadcrumbs />);
        
        const userIcons = screen.getAllByTestId('icon-user');
        expect(userIcons.length).toBe(2); // Characters list and individual character
        
        userIcons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-hidden', 'true');
        });
      });
    });
  });
});
