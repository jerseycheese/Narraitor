import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardHome } from '../DashboardHome';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import type { World } from '@/types/world.types';
import type { Character } from '@/types/character.types';
import type { SavedSessionInfo } from '@/types/game.types';

// Mock the stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/sessionStore');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('DashboardHome', () => {
  const mockWorld: World = {
    id: 'world-1',
    name: 'Fantasy Realm',
    genre: 'Fantasy',
    description: 'A magical world',
    loreKeys: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockCharacter: Character = {
    id: 'char-1',
    worldId: 'world-1',
    name: 'Aragorn',
    portrait: { type: 'placeholder', url: null },
    characterSheetData: {},
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockSession: SavedSessionInfo = {
    id: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    narrativeCount: 15,
    lastPlayed: '2024-01-05T12:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('first-time user state', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockReturnValue({ worlds: {} });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({ characters: {} });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
        onboardingCompleted: false,
        shouldShowOnboarding: () => true
      });
    });

    it('shows GuidedFirstTimeExperience for new users', () => {
      render(<DashboardHome />);

      // GuidedFirstTimeExperience should be shown
      // We can't test its internals, but we can verify the dashboard doesn't show
      expect(screen.queryByText(/recent worlds/i)).not.toBeInTheDocument();
    });
  });

  describe('returning user with no session state', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        worlds: { 'world-1': mockWorld }
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: { 'char-1': mockCharacter }
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
        onboardingCompleted: true,
        shouldShowOnboarding: () => false
      });
    });

    it('shows progress card with metrics', () => {
      render(<DashboardHome />);

      // Should show metrics for worlds and characters
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 world
    });

    it('shows recent worlds section', () => {
      render(<DashboardHome />);

      expect(screen.getByRole('heading', { name: /recent worlds/i })).toBeInTheDocument();
      expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    });

    it('shows recent characters section', () => {
      render(<DashboardHome />);

      expect(screen.getByRole('heading', { name: /recent characters/i })).toBeInTheDocument();
      expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });

    it('shows getting started guide', () => {
      render(<DashboardHome />);

      // Should show next steps
      expect(screen.getByRole('button', { name: /start playing/i })).toBeInTheDocument();
    });
  });

  describe('active session user state', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        worlds: { 'world-1': mockWorld }
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: { 'char-1': mockCharacter }
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: { 'session-1': mockSession },
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
        resumeSavedSessionInfo: jest.fn()
      });
    });

    it('shows continue card as primary CTA', () => {
      render(<DashboardHome />);

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('shows progress card with session metrics', () => {
      render(<DashboardHome />);

      // Should show metrics including session count
      expect(screen.getByText(/15.*entries/i)).toBeInTheDocument();
    });

    it('shows recent worlds for quick access', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    });

    it('shows recent characters for quick access', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        worlds: { 'world-1': mockWorld }
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: { 'char-1': mockCharacter }
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: { 'session-1': mockSession },
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
        resumeSavedSessionInfo: jest.fn()
      });
    });

    it('uses grid layout for desktop', () => {
      render(<DashboardHome />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('grid');
    });

    it('has accessible heading structure', () => {
      render(<DashboardHome />);

      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
