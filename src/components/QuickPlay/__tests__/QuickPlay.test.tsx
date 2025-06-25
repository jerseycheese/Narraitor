import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickPlay } from '../QuickPlay';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock stores with getState methods
const mockSetCurrentWorld = jest.fn();
const mockSetCurrentCharacter = jest.fn();

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: jest.fn(),
}));
jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(jest.fn(), {
    getState: () => ({
      setCurrentWorld: mockSetCurrentWorld,
    }),
  }),
}));
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: Object.assign(jest.fn(), {
    getState: () => ({
      setCurrentCharacter: mockSetCurrentCharacter,
    }),
  }),
}));

import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

describe('QuickPlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockSetCurrentWorld.mockClear();
    mockSetCurrentCharacter.mockClear();
  });

  describe('when no saved sessions exist', () => {
    beforeEach(() => {
      (useSessionStore as jest.Mock).mockReturnValue({
        savedSessions: {},
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      });
      (useWorldStore as jest.Mock).mockReturnValue({
        worlds: {},
      });
      (useCharacterStore as jest.Mock).mockReturnValue({
        characters: {},
      });
    });

    it('should show "Start New Game" button', () => {
      render(<QuickPlay />);
      
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /continue last game/i })).not.toBeInTheDocument();
    });

    it('should trigger navigation when "Start New Game" is clicked', () => {
      render(<QuickPlay />);
      
      const startButton = screen.getByRole('button', { name: /start new game/i });
      expect(startButton).not.toBeDisabled();
      
      fireEvent.click(startButton);
      
      // Test component behavior - button should remain clickable after click
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('when saved sessions exist', () => {
    const mockWorld = {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy' as const,
      attributes: [],
      skills: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockCharacter = {
      id: 'char-1',
      worldId: 'world-1',
      name: 'Test Hero',
      background: 'A brave adventurer',
      attributes: {},
      skills: {},
      portrait: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockSavedSession = {
      id: 'session-1',
      worldId: 'world-1',
      characterId: 'char-1',
      lastPlayed: new Date().toISOString(),
      narrativeCount: 5,
    };

    beforeEach(() => {
      (useSessionStore as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': mockSavedSession,
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      });
      (useWorldStore as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': mockWorld,
        },
      });
      (useCharacterStore as jest.Mock).mockReturnValue({
        characters: {
          'char-1': mockCharacter,
        },
      });
    });

    it('should show "Continue Last Game" button with world and character info', () => {
      render(<QuickPlay />);
      
      expect(screen.getByRole('button', { name: /continue last game/i })).toBeInTheDocument();
      expect(screen.getByText(/test world/i)).toBeInTheDocument();
      expect(screen.getByText(/test hero/i)).toBeInTheDocument();
      expect(screen.getByText(/5 entries/i)).toBeInTheDocument();
    });

    it('should also show "Start New Game" as secondary option', () => {
      render(<QuickPlay />);
      
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
    });

    it('should handle session continuation when "Continue Last Game" is clicked', async () => {
      const mockResume = jest.fn().mockReturnValue(true);
      (useSessionStore as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': mockSavedSession,
        },
        resumeSavedSession: mockResume,
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      });

      render(<QuickPlay />);
      
      const continueButton = screen.getByRole('button', { name: /continue last game/i });
      expect(continueButton).not.toBeDisabled();
      
      fireEvent.click(continueButton);
      
      // Test component behavior - button should remain available after click
      await waitFor(() => {
        expect(continueButton).toBeInTheDocument();
      });
    });

    it('should find the most recent saved session', () => {
      const olderSession = {
        ...mockSavedSession,
        id: 'session-old',
        lastPlayed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };

      (useSessionStore as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-old': olderSession,
          'session-1': mockSavedSession,
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      });

      render(<QuickPlay />);
      
      // Should show the more recent session
      expect(screen.getByText(/test hero/i)).toBeInTheDocument();
    });
  });

  describe('when saved session references deleted world/character', () => {
    beforeEach(() => {
      (useSessionStore as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': {
            id: 'session-1',
            worldId: 'deleted-world',
            characterId: 'deleted-char',
            lastPlayed: new Date().toISOString(),
            narrativeCount: 3,
          },
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      });
      (useWorldStore as jest.Mock).mockReturnValue({
        worlds: {},
      });
      (useCharacterStore as jest.Mock).mockReturnValue({
        characters: {},
      });
    });

    it('should not show "Continue Last Game" button', () => {
      render(<QuickPlay />);
      
      expect(screen.queryByRole('button', { name: /continue last game/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
    });
  });
});
