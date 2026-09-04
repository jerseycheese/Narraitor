import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardHome } from '../DashboardHome';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import type { World } from '@/types/world.types';
import type { SavedSessionInfo } from '@/types/game.types';

jest.mock('@/components/GuidedFirstTimeExperience', () => ({
  GuidedFirstTimeExperience: () => (
    <div data-testid="guided-first-time-experience">Guided</div>
  ),
}));

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
    genre: 'fantasy',
    description: 'A magical world',
    attributes: [],
    skills: [],
    settings: { maxAttributes: 10, maxSkills: 20, attributePointPool: 50, skillPointPool: 30 },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockCharacter: StoreCharacter = {
    id: 'char-1',
    worldId: 'world-1',
    name: 'Aragorn',
    description: 'A ranger',
    portrait: { type: 'placeholder', url: null },
    level: 5,
    isPlayer: true,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
    status: { conditions: [] },
    inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockSession: SavedSessionInfo = {
    id: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    narrativeCount: 15,
    lastPlayed: '2024-01-05T12:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('first-time user state', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockImplementation(() => ({ worlds: {} }));
      (useCharacterStore as unknown as jest.Mock).mockImplementation(() => ({ characters: {} }));
      (useSessionStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
          savedSessions: {},
          onboardingCompleted: false,
          shouldShowOnboarding: () => true,
          resumeSavedSession: jest.fn()
        };
        return selector ? selector(state) : state;
      });
    });

    it('shows GuidedFirstTimeExperience for new users', () => {
      render(<DashboardHome />);

      expect(screen.getByTestId('guided-first-time-experience')).toBeInTheDocument();
    });
  });

  describe('returning user with no session state', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockImplementation(() => ({
        worlds: { 'world-1': mockWorld }
      }));
      (useCharacterStore as unknown as jest.Mock).mockImplementation(() => ({
        characters: { 'char-1': mockCharacter }
      }));
      (useSessionStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
          savedSessions: {},
          onboardingCompleted: true,
          shouldShowOnboarding: () => false,
          resumeSavedSession: jest.fn()
        };
        return selector ? selector(state) : state;
      });
    });

    it('shows progress card with metrics', () => {
      render(<DashboardHome />);

      // Should show metrics heading
      expect(screen.getByRole('heading', { name: /your progress/i })).toBeInTheDocument();
    });

    it('renders exactly one page-level h1 (#1530)', () => {
      render(<DashboardHome />);

      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent('Dashboard');
    });

    it('shows recent worlds section', () => {
      render(<DashboardHome />);

      expect(screen.getByRole('heading', { name: /recent worlds/i })).toBeInTheDocument();
      expect(screen.getAllByText('Fantasy Realm').length).toBeGreaterThan(0);
    });

    it('shows recent characters section', () => {
      render(<DashboardHome />);

      expect(screen.getByRole('heading', { name: /recent characters/i })).toBeInTheDocument();
      expect(screen.getAllByText('Aragorn').length).toBeGreaterThan(0);
    });

    it('shows getting started guide', () => {
      render(<DashboardHome />);

      // Should show next steps
      expect(screen.getByRole('button', { name: /start playing/i })).toBeInTheDocument();
    });
  });

  describe('active session user state', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockImplementation(() => ({
        worlds: { 'world-1': mockWorld }
      }));
      (useCharacterStore as unknown as jest.Mock).mockImplementation(() => ({
        characters: { 'char-1': mockCharacter }
      }));
      (useSessionStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
          savedSessions: { 'session-1': mockSession },
          onboardingCompleted: true,
          shouldShowOnboarding: () => false,
          resumeSavedSession: jest.fn()
        };
        return selector ? selector(state) : state;
      });
    });

    it('shows continue card as primary CTA', () => {
      render(<DashboardHome />);

      expect(screen.getAllByRole('button', { name: /continue/i }).length).toBeGreaterThan(0);
    });

    it('renders exactly one page-level h1 (#1530)', () => {
      render(<DashboardHome />);

      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent('Dashboard');
    });

    it('shows progress card with session metrics', () => {
      render(<DashboardHome />);

      // The entries count is surfaced by the progress card's labeled stat,
      // not the continue card.
      const entriesStat = screen.getByText('Entries').closest('.dashboard-progress-stat');
      expect(entriesStat).toHaveTextContent('15');
    });

    it('shows recent worlds for quick access', () => {
      render(<DashboardHome />);

      expect(screen.getAllByText('Fantasy Realm').length).toBeGreaterThan(0);
    });

    it('shows recent characters for quick access', () => {
      render(<DashboardHome />);

      expect(screen.getAllByText('Aragorn').length).toBeGreaterThan(0);
    });
  });

  describe('responsive layout', () => {
    beforeEach(() => {
      (useWorldStore as unknown as jest.Mock).mockImplementation(() => ({
        worlds: { 'world-1': mockWorld }
      }));
      (useCharacterStore as unknown as jest.Mock).mockImplementation(() => ({
        characters: { 'char-1': mockCharacter }
      }));
      (useSessionStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
          savedSessions: { 'session-1': mockSession },
          onboardingCompleted: true,
          shouldShowOnboarding: () => false,
          resumeSavedSession: jest.fn()
        };
        return selector ? selector(state) : state;
      });
    });

    it('uses layout for desktop', () => {
      render(<DashboardHome />);

          const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
        });
    it('has accessible heading structure', () => {
      render(<DashboardHome />);

      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
