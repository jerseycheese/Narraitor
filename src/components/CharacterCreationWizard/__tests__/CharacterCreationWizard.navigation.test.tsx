import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// Mock auto-save hook
jest.mock('@/hooks/useCharacterCreationAutoSave');

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
    
    // Mock character store with proper state
    const mockCharacterStore = {
      createCharacter: mockCreateCharacter,
      setCurrentCharacter: mockSetCurrentCharacter,
      currentCharacterId: null,
      characters: {},
    };
    (characterStore as unknown as jest.Mock).mockReturnValue(mockCharacterStore);
    (characterStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockCharacterStore);
    
    // Mock auto-save hook with valid character data
    const mockAutoSaveData = {
      currentStep: 4,
      worldId: 'world-1',
      characterData: {
        name: 'Test Character',
        description: 'A brave adventurer',
        portraitPlaceholder: 'TC',
        portrait: {
          type: 'placeholder' as const,
          url: null
        },
        attributes: [
          {
            attributeId: 'attr-1',
            name: 'Strength',
            description: 'Physical power',
            value: 12,
            minValue: 1,
            maxValue: 20,
          },
          {
            attributeId: 'attr-2',
            name: 'Intelligence',
            description: 'Mental acuity',
            value: 8,
            minValue: 1,
            maxValue: 20,
          },
        ],
        skills: [
          {
            skillId: 'skill-1',
            name: 'Swordsmanship',
            level: 5,
            linkedAttributeId: 'attr-1',
            isSelected: true,
          },
          {
            skillId: 'skill-2',
            name: 'Magic',
            level: 3,
            linkedAttributeId: 'attr-2',
            isSelected: true,
          },
        ],
        background: {
          history: 'Born in a small village, this character always dreamed of adventure and glory in distant lands.',
          personality: 'Brave, curious, and always ready to help those in need.',
          goals: ['Become a legendary hero', 'Protect the innocent'],
          motivation: 'To make the world a better place',
        },
      },
      validation: {
        0: { valid: true, errors: [], touched: true },
        1: { valid: true, errors: [], touched: true },
        2: { valid: true, errors: [], touched: true },
        3: { valid: true, errors: [], touched: true },
        4: { valid: true, errors: [], touched: false },
      },
      pointPools: {
        attributes: {
          total: 20,
          spent: 20,
          remaining: 0,
        },
        skills: {
          total: 20,
          spent: 8,
          remaining: 12,
        },
      },
    };
    
    (useCharacterCreationAutoSave as jest.Mock).mockReturnValue({
      data: mockAutoSaveData,
      setData: jest.fn(),
      handleFieldBlur: jest.fn(),
      clearAutoSave: jest.fn(),
    });
  });

  it('should navigate to game session after character creation', async () => {
    render(<CharacterCreationWizard worldId="world-1" />);
    
    // Should start on the final step (Portrait) due to auto-save data
    await waitFor(() => {
      expect(screen.getByText(/Character Portrait/i)).toBeInTheDocument();
    });
    
    // Click "Create Character" button
    const createButton = screen.getByRole('button', { name: /create character/i });
    fireEvent.click(createButton);
    
    // Verify character was created with proper data
    await waitFor(() => {
      expect(mockCreateCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          worldId: 'world-1',
          name: 'Test Character',
          level: 1,
          attributes: expect.arrayContaining([
            expect.objectContaining({
              name: 'Strength',
              baseValue: 12,
              modifiedValue: 12,
              characterId: '',
            }),
            expect.objectContaining({
              name: 'Intelligence', 
              baseValue: 8,
              modifiedValue: 8,
              characterId: '',
            }),
          ]),
          skills: expect.arrayContaining([
            expect.objectContaining({
              name: 'Swordsmanship',
              level: 5,
              characterId: '',
            }),
            expect.objectContaining({
              name: 'Magic',
              level: 3,
              characterId: '',
            }),
          ]),
          background: expect.objectContaining({
            history: 'Born in a small village, this character always dreamed of adventure and glory in distant lands.',
            personality: 'Brave, curious, and always ready to help those in need.',
            goals: expect.arrayContaining(['To make the world a better place']),
            fears: expect.any(Array),
          }),
          portrait: expect.objectContaining({
            type: 'placeholder',
            url: null,
          }),
          isPlayer: true,
          status: expect.objectContaining({
            health: expect.any(Number),
            maxHealth: expect.any(Number),
            conditions: expect.any(Array),
          }),
        })
      );
    });
    
    // Verify current character was set
    expect(mockSetCurrentCharacter).toHaveBeenCalledWith('char-123');
    
    // Verify navigation to game session
    expect(mockPush).toHaveBeenCalledWith('/world/world-1/play');
  });

});
