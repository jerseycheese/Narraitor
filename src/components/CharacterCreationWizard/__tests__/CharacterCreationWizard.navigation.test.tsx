import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

describe('CharacterCreationWizard - Navigation to Game Session', () => {
  const mockPush = jest.fn();
  const mockCreateCharacter = jest.fn().mockReturnValue('char-123');
  const mockSetCurrentCharacter = jest.fn();
  
  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    theme: 'fantasy',
    attributes: [
      { 
        id: 'attr-1',
        worldId: 'world-1', 
        name: 'Strength', 
        description: 'Physical power',
        baseValue: 10,
        minValue: 1, 
        maxValue: 20
      },
      { 
        id: 'attr-2',
        worldId: 'world-1', 
        name: 'Intelligence', 
        description: 'Mental acuity',
        baseValue: 10,
        minValue: 1, 
        maxValue: 20
      },
    ],
    skills: [
      { 
        id: 'skill-1',
        worldId: 'world-1', 
        name: 'Swordsmanship', 
        description: 'Skill with blades',
        difficulty: 'medium',
        linkedAttributeId: 'attr-1',
        baseValue: 5,
        minValue: 1,
        maxValue: 10
      },
      { 
        id: 'skill-2',
        worldId: 'world-1', 
        name: 'Magic', 
        description: 'Arcane knowledge',
        difficulty: 'hard',
        linkedAttributeId: 'attr-2',
        baseValue: 5,
        minValue: 1,
        maxValue: 10
      },
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Mock world store
    const mockWorldStore = {
      worlds: { 'world-1': mockWorld },
      getWorld: jest.fn().mockReturnValue(mockWorld),
    };
    (worldStore as unknown as jest.Mock).mockReturnValue(mockWorldStore);
    (worldStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockWorldStore);
    
    // Mock character store
    const mockCharacterStore = {
      createCharacter: mockCreateCharacter,
      setCurrentCharacter: mockSetCurrentCharacter,
    };
    (characterStore as unknown as jest.Mock).mockReturnValue(mockCharacterStore);
    (characterStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockCharacterStore);
  });

  it('should navigate to game session after character creation', async () => {
    render(<CharacterCreationWizard worldId="world-1" initialStep={4} />);
    
    // Start on the final step (Portrait)
    await waitFor(() => {
      expect(screen.getByText(/Character Portrait/i)).toBeInTheDocument();
    });
    
    // Click "Create Character" button
    const createButton = screen.getByRole('button', { name: /create character/i });
    fireEvent.click(createButton);
    
    // Verify character was created
    await waitFor(() => {
      expect(mockCreateCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          worldId: 'world-1',
        })
      );
    });
    
    // Verify current character was set
    expect(mockSetCurrentCharacter).toHaveBeenCalledWith('char-123');
    
    // Verify navigation to game session
    expect(mockPush).toHaveBeenCalledWith('/world/world-1/play');
  });

});