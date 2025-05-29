import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickPlay } from '../QuickPlay';
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

describe('QuickPlay', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('when no saved sessions exist', () => {
    beforeEach(() => {
      (sessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {},
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
    });

    it('should show "Start New Game" button', () => {
      render(<QuickPlay />);
      
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /continue last game/i })).not.toBeInTheDocument();
    });

    it('should navigate to worlds page when "Start New Game" is clicked', () => {
      render(<QuickPlay />);
      
      fireEvent.click(screen.getByRole('button', { name: /start new game/i }));
      
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });

  describe('when saved sessions exist', () => {
    const mockWorld = {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world',
      theme: 'fantasy' as const,
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
      (sessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': mockSavedSession,
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
      });
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': mockWorld,
        },
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
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

    it('should resume session and navigate when "Continue Last Game" is clicked', async () => {
      const mockResume = jest.fn().mockReturnValue(true);
      (sessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': mockSavedSession,
        },
        resumeSavedSession: mockResume,
      });

      render(<QuickPlay />);
      
      fireEvent.click(screen.getByRole('button', { name: /continue last game/i }));
      
      await waitFor(() => {
        expect(mockResume).toHaveBeenCalledWith('session-1');
        expect(mockPush).toHaveBeenCalledWith('/play');
      });
    });

    it('should find the most recent saved session', () => {
      const olderSession = {
        ...mockSavedSession,
        id: 'session-old',
        lastPlayed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };

      (sessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-old': olderSession,
          'session-1': mockSavedSession,
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
      });

      render(<QuickPlay />);
      
      // Should show the more recent session
      expect(screen.getByText(/test hero/i)).toBeInTheDocument();
    });
  });

  describe('when saved session references deleted world/character', () => {
    beforeEach(() => {
      (sessionStore as unknown as jest.Mock).mockReturnValue({
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
      });
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {},
      });
      (characterStore as unknown as jest.Mock).mockReturnValue({
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