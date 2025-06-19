// src/components/GameSession/__tests__/EndingScreen.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { StoryEnding } from '../../../types/narrative.types';

// Import the mocked modules after mocking
import { EndingScreen } from '../EndingScreen';
import { useRouter } from 'next/navigation';

// Mock dependencies with proper implementations
jest.mock('../../../state/narrativeStore', () => ({
  useNarrativeStore: jest.fn()
}));
jest.mock('../../../state/characterStore', () => ({
  useCharacterStore: jest.fn()
}));
jest.mock('../../../state/worldStore', () => ({
  useWorldStore: jest.fn()
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

import { useNarrativeStore } from '../../../state/narrativeStore';
import { useCharacterStore } from '../../../state/characterStore';
import { useWorldStore } from '../../../state/worldStore';

describe('EndingScreen', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  
  const mockEnding: StoryEnding = {
    id: 'ending-123',
    sessionId: 'session-456',
    characterId: 'char-789',
    worldId: 'world-012',
    type: 'story-complete',
    tone: 'triumphant',
    epilogue: 'As the sun set over the kingdom, our hero stood victorious. The dark lord was defeated, and peace returned to the land.',
    characterLegacy: 'Aria Stormblade would be remembered for generations as the warrior who saved the realm from darkness.',
    worldImpact: 'The defeat of the dark lord ushered in a new age of prosperity. Magic flourished, and the kingdom expanded its borders peacefully.',
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    achievements: ['Dragon Slayer', 'Peacekeeper', 'Hero of the Realm'],
    playTime: 7200 // 2 hours
  };

  const mockCharacter = {
    id: 'char-789',
    name: 'Aria Stormblade',
    class: 'Warrior',
    level: 10
  };

  const mockWorld = {
    id: 'world-012',
    name: 'Fantasy Realm'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Set up narrative store with mock ending
    (useNarrativeStore as jest.Mock).mockReturnValue({
      currentEnding: mockEnding,
      isGeneratingEnding: false,
      endingError: null,
      clearEnding: jest.fn(),
      getSessionSegments: jest.fn().mockReturnValue([])
    });
    
    // Set up character store mock to return test character
    (useCharacterStore as jest.Mock).mockReturnValue({
      characters: {
        'char-789': mockCharacter
      }
    });
    
    // Set up world store mock to return test world  
    (useWorldStore as jest.Mock).mockReturnValue({
      worlds: {
        'world-012': mockWorld
      }
    });
  });

  describe('rendering', () => {
    it('should display the epilogue', () => {
      render(<EndingScreen />);
      
      expect(screen.getByText(/As the sun set over the kingdom/)).toBeInTheDocument();
      expect(screen.getByText(/our hero stood victorious/)).toBeInTheDocument();
    });

    it('should display character legacy section', () => {
      render(<EndingScreen />);
      
      expect(screen.getByText('Character Legacy')).toBeInTheDocument();
      expect(screen.getByText(/Aria Stormblade would be remembered/)).toBeInTheDocument();
    });

    it('should display world impact section', () => {
      render(<EndingScreen />);
      
      expect(screen.getByText('Impact on the World')).toBeInTheDocument();
      expect(screen.getByText(/new age of prosperity/)).toBeInTheDocument();
    });

    it('should display achievements if present', () => {
      render(<EndingScreen />);
      
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Dragon Slayer')).toBeInTheDocument();
      expect(screen.getByText('Peacekeeper')).toBeInTheDocument();
      expect(screen.getByText('Hero of the Realm')).toBeInTheDocument();
    });

    it('should display play time in human-readable format', () => {
      render(<EndingScreen />);
      
      expect(screen.getByText(/Play Time:/)).toBeInTheDocument();
      expect(screen.getByText(/2 hours/)).toBeInTheDocument();
    });

    it('should show appropriate tone styling', () => {
      render(<EndingScreen />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('ending-triumphant');
    });
  });

  describe('navigation options', () => {
    it('should provide option to start new story with same character', () => {
      render(<EndingScreen />);
      
      const newStoryButton = screen.getByRole('button', { name: /New Story/i });
      expect(newStoryButton).toBeInTheDocument();
      
      fireEvent.click(newStoryButton);
      
      expect(mockPush).toHaveBeenCalledWith('/world/world-012/play');
    });

    it('should provide option to create new character', () => {
      render(<EndingScreen />);
      
      const newCharacterButton = screen.getByRole('button', { name: /New Character/i });
      expect(newCharacterButton).toBeInTheDocument();
      
      fireEvent.click(newCharacterButton);
      
      expect(mockPush).toHaveBeenCalledWith('/characters/create?worldId=world-012');
    });

    it('should provide option to return to worlds', () => {
      render(<EndingScreen />);
      
      const worldsButton = screen.getByRole('button', { name: /Back to Worlds/i });
      expect(worldsButton).toBeInTheDocument();
      
      fireEvent.click(worldsButton);
      
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });

  describe('error handling', () => {
    it('should handle missing ending data gracefully', () => {
      (useNarrativeStore as jest.Mock).mockReturnValueOnce({
        currentEnding: null,
        isGeneratingEnding: false,
        endingError: null,
        clearEnding: jest.fn(),
        getSessionSegments: jest.fn().mockReturnValue([])
      });

      render(<EndingScreen />);
      
      expect(screen.getByText(/No Ending Available/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument();
    });

    it('should handle missing character data', () => {
      (useCharacterStore as jest.Mock).mockReturnValueOnce({
        characters: {} // Empty characters object, so character lookup will return undefined
      });

      render(<EndingScreen />);
      
      // Should still render without crashing and display the ending
      expect(screen.getByText(/The End/)).toBeInTheDocument();
      expect(screen.getByText(/As the sun set over the kingdom/)).toBeInTheDocument();
    });
  });

  describe('tone variations', () => {
    const toneVariations: Array<{ tone: StoryEnding['tone'], expectedClass: string }> = [
      { tone: 'triumphant', expectedClass: 'ending-triumphant' },
      { tone: 'bittersweet', expectedClass: 'ending-bittersweet' },
      { tone: 'mysterious', expectedClass: 'ending-mysterious' },
      { tone: 'tragic', expectedClass: 'ending-tragic' },
      { tone: 'hopeful', expectedClass: 'ending-hopeful' }
    ];

    toneVariations.forEach(({ tone, expectedClass }) => {
      it(`should apply correct styling for ${tone} tone`, () => {
        const endingWithTone = { ...mockEnding, tone };
        (useNarrativeStore as jest.Mock).mockReturnValueOnce({
          currentEnding: endingWithTone,
          isGeneratingEnding: false,
          endingError: null,
          clearEnding: jest.fn(),
          getSessionSegments: jest.fn().mockReturnValue([])
        });
        
        // Ensure character and world stores are properly mocked for this test too
        (useCharacterStore as jest.Mock).mockReturnValueOnce({
          characters: {
            'char-789': mockCharacter
          }
        });
        
        (useWorldStore as jest.Mock).mockReturnValueOnce({
          worlds: {
            'world-012': mockWorld
          }
        });

        render(<EndingScreen />);
        
        const main = screen.getByRole('main');
        expect(main).toHaveClass(expectedClass);
      });
    });
  });

  // Cleanup test removed - automatic cleanup was removed to prevent clearing during development re-renders

  describe('loading state', () => {
    it('should show loading state while ending is being generated', () => {
      (useNarrativeStore as jest.Mock).mockReturnValueOnce({
        currentEnding: null,
        isGeneratingEnding: true,
        endingError: null,
        clearEnding: jest.fn(),
        getSessionSegments: jest.fn().mockReturnValue([])
      });

      render(<EndingScreen />);
      
      expect(screen.getByText(/Generating your story ending/)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<EndingScreen />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/The End/);
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThanOrEqual(4); // At least Epilogue, Legacy, Impact, What's Next (Achievements may be optional)
    });

    it('should announce ending completion to screen readers', () => {
      render(<EndingScreen />);
      
      const announcement = screen.getByRole('status', { name: /story complete/i });
      expect(announcement).toBeInTheDocument();
    });
  });
});