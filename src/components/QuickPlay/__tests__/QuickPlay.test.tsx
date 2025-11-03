import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickPlay } from '../QuickPlay';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';
import { cleanupSessionData } from '@/lib/utils/sessionCleanup';
import { getTimestamp } from '@/lib/utils/timestamp';
import { mockZustandStore, createMockSessionStore, createMockWorldStore, createMockCharacterStore } from '@/lib/test-utils';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// Mock session cleanup utility
jest.mock('@/lib/utils/sessionCleanup', () => ({
  cleanupSessionData: jest.fn(),
}));

describe('QuickPlay', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('when no saved sessions exist', () => {
    beforeEach(() => {
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
        savedSessions: {},
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
        resumeSavedSession: jest.fn().mockReturnValue(true),
      }));
      mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>, createMockWorldStore({
        worlds: {},
      }));
      mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore({
        characters: {},
      }));
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
      narrativeCount: 5,
    };

    beforeEach(() => {
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
        savedSessions: {
          'session-1': mockSavedSession,
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      }));
      mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>, createMockWorldStore({
        worlds: {
          'world-1': mockWorld,
        },
      }));
      mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore({
        characters: {
          'char-1': mockCharacter,
        },
      }));
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
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
        savedSessions: {
          'session-1': mockSavedSession,
        },
        resumeSavedSession: mockResume,
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      }));

      render(<QuickPlay />);
      
      fireEvent.click(screen.getByRole('button', { name: /continue last game/i }));
      
      await waitFor(() => {
        expect(mockResume).toHaveBeenCalledWith('session-1');
        expect(mockPush).toHaveBeenCalledWith('/worlds/world-1/play');
      });
    });

    it('should find the most recent saved session', () => {
      const olderSession = {
        ...mockSavedSession,
        id: 'session-old',
        lastPlayed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };

      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
        savedSessions: {
          'session-old': olderSession,
          'session-1': mockSavedSession,
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      }));

      render(<QuickPlay />);
      
      // Should show the more recent session
      expect(screen.getByText(/test hero/i)).toBeInTheDocument();
    });

    describe('campaign deletion', () => {
      let mockDeleteSavedSession: jest.Mock;
      let mockCleanupSessionData: jest.Mock;

      beforeEach(() => {
        mockDeleteSavedSession = jest.fn();
        mockCleanupSessionData = cleanupSessionData as jest.Mock;
        mockCleanupSessionData.mockClear();

        mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
          savedSessions: {
            'session-1': mockSavedSession,
          },
          resumeSavedSession: jest.fn().mockReturnValue(true),
          deleteSavedSession: mockDeleteSavedSession,
          onboardingCompleted: true,
          shouldShowOnboarding: () => false,
        }));
      });

      it('should show delete button on campaign card', () => {
        render(<QuickPlay />);
        
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      it('should open confirmation dialog when delete button is clicked', () => {
        render(<QuickPlay />);
        
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/delete campaign/i)).toBeInTheDocument();
        expect(screen.getByText(/test world.*test hero/i)).toBeInTheDocument();
      });

      it('should not delete campaign when dialog is canceled', () => {
        render(<QuickPlay />);
        
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        
        expect(mockCleanupSessionData).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('should delete campaign when confirmed', async () => {
        render(<QuickPlay />);
        
        // Click the delete button on the card
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        
        // Wait for dialog to open and click the confirm button
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
        
        // Click the confirm delete button in the dialog
        const confirmButton = screen.getByRole('button', { name: /Delete Test World - Test Hero/i });
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
          expect(mockCleanupSessionData).toHaveBeenCalledWith('session-1');
        });
      });

      it('should show "Start New Game" after campaign is deleted', () => {
        // Mock empty sessions after deletion
        mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
          savedSessions: {},
          resumeSavedSession: jest.fn().mockReturnValue(true),
          deleteSavedSession: mockDeleteSavedSession,
          onboardingCompleted: true,
          shouldShowOnboarding: () => false,
        }));

        render(<QuickPlay />);
        
        expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /continue last game/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('when saved session references deleted world/character', () => {
    beforeEach(() => {
      mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
        savedSessions: {
          'session-1': {
            id: 'session-1',
            worldId: 'deleted-world',
            characterId: 'deleted-char',
            lastPlayed: getTimestamp(),
            narrativeCount: 3,
          },
        },
        resumeSavedSession: jest.fn().mockReturnValue(true),
        onboardingCompleted: true,
        shouldShowOnboarding: () => false,
      }));
      mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>, createMockWorldStore({
        worlds: {},
      }));
      mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore({
        characters: {},
      }));
    });

    it('should not show "Continue Last Game" button', () => {
      render(<QuickPlay />);
      
      expect(screen.queryByRole('button', { name: /continue last game/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
    });
  });
});
