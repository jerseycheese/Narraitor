import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumbs } from '../Breadcrumbs';
import { usePathname, useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// Mock route utils
jest.mock('@/utils/routeUtils', () => ({
  buildBreadcrumbSegments: jest.fn(),
}));

describe.skip('Enhanced Breadcrumbs with Next Step Guidance', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('when on worlds page with no world selected', () => {
    beforeEach(() => {
      (usePathname as jest.Mock).mockReturnValue('/worlds');
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {},
        currentWorldId: null,
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
      
      const { buildBreadcrumbSegments } = require('@/utils/routeUtils');
      buildBreadcrumbSegments.mockReturnValue([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Worlds', href: '/worlds', isCurrentPage: true },
      ]);
    });

    it('should show next step CTA to select or create world', () => {
      render(<Breadcrumbs showNextStep />);
      
      expect(screen.getByText(/next: select a world/i)).toBeInTheDocument();
    });

    it('should link to world creation if no worlds exist', () => {
      render(<Breadcrumbs showNextStep />);
      
      const nextStepButton = screen.getByRole('link', { name: /create your first world/i });
      expect(nextStepButton).toHaveAttribute('href', '/world/create');
    });
  });

  describe('when on world detail page', () => {
    beforeEach(() => {
      (usePathname as jest.Mock).mockReturnValue('/world/world-1');
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
        currentWorldId: 'world-1',
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
      
      const { buildBreadcrumbSegments } = require('@/utils/routeUtils');
      buildBreadcrumbSegments.mockReturnValue([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Test World', href: '/world/world-1', isCurrentPage: true },
      ]);
    });

    it('should show next step CTA to select or create character', () => {
      render(<Breadcrumbs showNextStep />);
      
      expect(screen.getByText(/next: select a character/i)).toBeInTheDocument();
    });

    it('should link to character creation', () => {
      render(<Breadcrumbs showNextStep />);
      
      const nextStepButton = screen.getByRole('link', { name: /create character/i });
      expect(nextStepButton).toHaveAttribute('href', '/characters/create');
    });
  });

  describe('when on characters page with characters available', () => {
    beforeEach(() => {
      (usePathname as jest.Mock).mockReturnValue('/characters');
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
        currentWorldId: 'world-1',
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });
      
      const { buildBreadcrumbSegments } = require('@/utils/routeUtils');
      buildBreadcrumbSegments.mockReturnValue([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Test World', href: '/world/world-1', isCurrentPage: false },
        { label: 'Characters', href: '/characters', isCurrentPage: true },
      ]);
    });

    it('should show next step CTA to start playing', () => {
      render(<Breadcrumbs showNextStep />);
      
      expect(screen.getByText(/next: start playing/i)).toBeInTheDocument();
    });

    it('should show quick start button when character exists', () => {
      render(<Breadcrumbs showNextStep />);
      
      const startButton = screen.getByRole('button', { name: /quick start/i });
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('when on character detail page', () => {
    beforeEach(() => {
      (usePathname as jest.Mock).mockReturnValue('/characters/char-1');
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
        currentWorldId: 'world-1',
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });
      
      const { buildBreadcrumbSegments } = require('@/utils/routeUtils');
      buildBreadcrumbSegments.mockReturnValue([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Test World', href: '/world/world-1', isCurrentPage: false },
        { label: 'Characters', href: '/characters', isCurrentPage: false },
        { label: 'Test Character', href: '/characters/char-1', isCurrentPage: true },
      ]);
    });

    it('should show next step CTA to start playing with this character', () => {
      render(<Breadcrumbs showNextStep />);
      
      expect(screen.getByText(/next: start playing/i)).toBeInTheDocument();
      
      const playButton = screen.getByRole('button', { name: /play as test character/i });
      expect(playButton).toBeInTheDocument();
    });
  });

  describe('when already playing', () => {
    beforeEach(() => {
      (usePathname as jest.Mock).mockReturnValue('/play');
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
        currentWorldId: 'world-1',
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });
      
      const { buildBreadcrumbSegments } = require('@/utils/routeUtils');
      buildBreadcrumbSegments.mockReturnValue([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Test World', href: '/world/world-1', isCurrentPage: false },
        { label: 'Test Character', href: '/characters/char-1', isCurrentPage: false },
        { label: 'Playing', href: '/play', isCurrentPage: true },
      ]);
    });

    it('should not show next step guidance', () => {
      render(<Breadcrumbs showNextStep />);
      
      expect(screen.queryByText(/next:/i)).not.toBeInTheDocument();
    });
  });

  describe('standard breadcrumb functionality', () => {
    beforeEach(() => {
      (usePathname as jest.Mock).mockReturnValue('/world/world-1');
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
        currentWorldId: 'world-1',
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
      
      const { buildBreadcrumbSegments } = require('@/utils/routeUtils');
      buildBreadcrumbSegments.mockReturnValue([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Worlds', href: '/worlds', isCurrentPage: false },
        { label: 'Test World', href: '/world/world-1', isCurrentPage: true },
      ]);
    });

    it('should work without next step guidance when prop not provided', () => {
      render(<Breadcrumbs />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Worlds')).toBeInTheDocument();
      expect(screen.getByText('Test World')).toBeInTheDocument();
      expect(screen.queryByText(/next:/i)).not.toBeInTheDocument();
    });

    it('should navigate when clicking breadcrumb links', () => {
      render(<Breadcrumbs />);
      
      fireEvent.click(screen.getByText('Worlds'));
      
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });
});