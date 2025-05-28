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

describe('Breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useParams as jest.Mock).mockReturnValue({});
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
    it('should render home breadcrumb on root path', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      
      render(<Breadcrumbs />);
      
      expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument();
      expect(screen.getByText('Worlds')).toBeInTheDocument();
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
      
      render(<Breadcrumbs />);
      
      expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-world')).toBeInTheDocument();
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
      
      render(<Breadcrumbs />);
      
      expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-world')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-characters')).toBeInTheDocument();
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
      
      render(<Breadcrumbs />);
      
      expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-world')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-characters')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-character')).toBeInTheDocument();
      expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });
  });

  describe('Navigation behavior', () => {
    it('should navigate to home when clicking Worlds breadcrumb', async () => {
      const user = userEvent.setup();
      // Set pathname to a page where Worlds breadcrumb is clickable
      (usePathname as jest.Mock).mockReturnValue('/world/123');
      (worldStore as jest.Mock).mockReturnValue({
        worlds: {
          '123': { id: '123', name: 'Fantasy Realm' }
        },
        currentWorldId: '123',
      });
      
      render(<Breadcrumbs />);
      
      await user.click(screen.getByTestId('breadcrumb-home'));
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
      
      render(<Breadcrumbs />);
      
      await user.click(screen.getByTestId('breadcrumb-world'));
      expect(mockPush).toHaveBeenCalledWith('/world/123');
    });

    it('should not navigate when clicking current page breadcrumb', async () => {
      const user = userEvent.setup();
      (usePathname as jest.Mock).mockReturnValue('/worlds');
      
      render(<Breadcrumbs />);
      
      const currentBreadcrumb = screen.getByTestId('breadcrumb-home');
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
      
      render(<Breadcrumbs maxItems={2} />);
      
      // Should show ellipsis and last 2 items
      expect(screen.getByTestId('breadcrumb-ellipsis')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-characters')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-character')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-home')).not.toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-world')).not.toBeInTheDocument();
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
      
      render(<Breadcrumbs />);
      
      expect(screen.getByTestId('breadcrumb-world-loading')).toBeInTheDocument();
    });
  });
});