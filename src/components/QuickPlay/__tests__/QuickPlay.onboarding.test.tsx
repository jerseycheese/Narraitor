import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickPlay } from '../QuickPlay';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';
import { getTimestamp } from '@/lib/utils/timestamp';
import { mockZustandStore, createMockWorldStore, createMockSessionStore, createMockCharacterStore } from '@/lib/test-utils';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// Mock GuidedFirstTimeExperience component
jest.mock('@/components/GuidedFirstTimeExperience', () => ({
  GuidedFirstTimeExperience: () => <div data-testid="guided-first-time-experience">Guided Experience</div>
}));

describe('QuickPlay - Onboarding Integration', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Default mock for empty stores
    mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>,
      createMockWorldStore({
        worlds: {},
      })
    );
    mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore({
        characters: {},
      })
    );
  });

  describe('First-time user experience', () => {
    beforeEach(() => {
      // Mock first-time user state
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>,
        createMockSessionStore({
          savedSessions: {},
          onboardingCompleted: false,
          isFirstTimeUser: () => true,
          shouldShowOnboarding: () => true,
        })
      );
    });

    it('shows guided first-time experience instead of generic "Start New Game" button', () => {
      render(<QuickPlay />);
      
      // Should show the guided experience
      expect(screen.getByTestId('guided-first-time-experience')).toBeInTheDocument();
      
      // Should NOT show the generic "Start New Game" button
      expect(screen.queryByRole('button', { name: /start new game/i })).not.toBeInTheDocument();
    });

    it('does not show "Continue Last Game" option for first-time users', () => {
      render(<QuickPlay />);
      
      expect(screen.queryByRole('button', { name: /continue last game/i })).not.toBeInTheDocument();
    });
  });

  describe('Returning user experience', () => {
    beforeEach(() => {
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>,
        createMockSessionStore({
          savedSessions: {},
          onboardingCompleted: true,
          isFirstTimeUser: () => false,
          shouldShowOnboarding: () => false,
        })
      );
    });

    it('shows standard "Start New Game" button for returning users with no sessions', () => {
      render(<QuickPlay />);
      
      // Should show the standard button
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
      
      // Should NOT show the guided experience
      expect(screen.queryByTestId('guided-first-time-experience')).not.toBeInTheDocument();
    });

    it('navigates to worlds page when "Start New Game" is clicked', () => {
      render(<QuickPlay />);
      
      fireEvent.click(screen.getByRole('button', { name: /start new game/i }));
      
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });

  describe('Returning user with saved sessions', () => {
    const mockWorld = {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy' as const,
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 50,
        skillPointPool: 30,
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    const mockCharacter = {
      id: 'char-1',
      worldId: 'world-1',
      name: 'Test Hero',
      description: 'A brave adventurer',
      level: 1,
      attributes: [],
      skills: [],
      background: {
        history: 'A brave adventurer',
        personality: '',
        goals: [],
        fears: [],
        physicalDescription: '',
        relationships: [],
      },
      isPlayer: true,
      status: {
        health: 100,
        maxHealth: 100,
        conditions: [],
      },
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 20,
        categories: [],
        itemOrder: [],
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    const mockSavedSession = {
      id: 'session-1',
      worldId: 'world-1',
      characterId: 'char-1',
      lastPlayed: getTimestamp(),
      narrativeCount: 3,
    };

    beforeEach(() => {
      // Mock returning user with saved sessions
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>,
        createMockSessionStore({
          savedSessions: {
            'session-1': mockSavedSession,
          },
          onboardingCompleted: true,
          isFirstTimeUser: () => false,
          shouldShowOnboarding: () => false,
          resumeSavedSession: jest.fn().mockReturnValue(true),
        })
      );
      
      mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>,
        createMockWorldStore({
          worlds: {
            'world-1': mockWorld,
          },
        })
      );
      
      mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
        createMockCharacterStore({
          characters: {
            'char-1': mockCharacter,
          },
        })
      );
    });

    it('shows both "Continue Last Game" and "Start New Game" options', () => {
      render(<QuickPlay />);
      
      expect(screen.getByRole('button', { name: /continue last game/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
      
      // Should NOT show guided experience
      expect(screen.queryByTestId('guided-first-time-experience')).not.toBeInTheDocument();
    });

    it('shows session details for the continue option', () => {
      render(<QuickPlay />);
      
      expect(screen.getByText(/test world/i)).toBeInTheDocument();
      expect(screen.getByText(/test hero/i)).toBeInTheDocument();
      expect(screen.getByText(/3 entries/i)).toBeInTheDocument();
    });
  });

  describe('User who skipped onboarding', () => {
    beforeEach(() => {
      // Mock user who completed onboarding (via skip) but has no saved sessions
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>,
        createMockSessionStore({
          savedSessions: {},
          onboardingCompleted: true,
          isFirstTimeUser: () => false,
          shouldShowOnboarding: () => false,
        })
      );
    });

    it('shows standard interface, not guided experience', () => {
      render(<QuickPlay />);
      
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
      expect(screen.queryByTestId('guided-first-time-experience')).not.toBeInTheDocument();
    });

    it('behaves like a returning user with no sessions', () => {
      render(<QuickPlay />);
      
      fireEvent.click(screen.getByRole('button', { name: /start new game/i }));
      
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });

  describe('Edge cases', () => {
    it('handles corrupted onboarding state gracefully', () => {
      // Mock corrupted state
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>,
        createMockSessionStore({
          savedSessions: {},
          onboardingCompleted: undefined, // Corrupted
          isFirstTimeUser: () => true, // Fallback to true
          shouldShowOnboarding: () => true,
        })
      );

      render(<QuickPlay />);
      
      // Should default to showing guided experience for safety
      expect(screen.getByTestId('guided-first-time-experience')).toBeInTheDocument();
    });

    it('handles missing helper methods gracefully', () => {
      // Mock state without helper methods
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>,
        createMockSessionStore({
          savedSessions: {},
          onboardingCompleted: false,
          // Missing isFirstTimeUser and shouldShowOnboarding methods
        })
      );

      render(<QuickPlay />);
      
      // Should fall back to checking savedSessions directly
      // If no saved sessions and onboarding not completed, should show guided experience
      expect(screen.getByTestId('guided-first-time-experience')).toBeInTheDocument();
    });
  });
});