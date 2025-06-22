// src/components/QuickStartCharacters/__tests__/QuickStartCharacters.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickStartCharacters } from '../QuickStartCharacters';
import { World } from '@/types/world.types';
import { CharacterArchetype } from '@/lib/utils/characterArchetypes';

// Mock the character archetype generation
jest.mock('@/lib/utils/characterArchetypes', () => ({
  generateCharacterArchetypes: jest.fn(),
  generateRandomArchetype: jest.fn(),
}));

// Mock the character store
const mockCreateCharacter = jest.fn();
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({
    createCharacter: mockCreateCharacter,
  }),
}));

import { generateCharacterArchetypes, generateRandomArchetype } from '@/lib/utils/characterArchetypes';
const mockGenerateArchetypes = generateCharacterArchetypes as jest.MockedFunction<typeof generateCharacterArchetypes>;
const mockGenerateRandomArchetype = generateRandomArchetype as jest.MockedFunction<typeof generateRandomArchetype>;

describe('QuickStartCharacters', () => {
  const mockWorld: World = {
    id: 'test-world',
    name: 'Test Fantasy World',
    description: 'A magical realm filled with adventure',
    genre: 'fantasy',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    attributes: [
      { id: 'str', name: 'Strength', description: 'Physical power', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
      { id: 'int', name: 'Intelligence', description: 'Mental acuity', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
    ],
    skills: [
      { id: 'combat', name: 'Combat', description: 'Fighting ability', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
      { id: 'magic', name: 'Magic', description: 'Mystical arts', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    }
  };

  const mockArchetypes: CharacterArchetype[] = [
    {
      id: 'warrior',
      name: 'Aelric the Brave',
      description: 'A stalwart warrior trained in combat',
      level: 1,
      attributes: [
        { id: 'str', name: 'Strength', value: 8 },
        { id: 'int', name: 'Intelligence', value: 4 },
      ],
      skills: [
        { id: 'combat', name: 'Combat', level: 7 },
        { id: 'magic', name: 'Magic', level: 2 },
      ],
      background: {
        description: 'A veteran warrior from the northern kingdoms',
        personality: 'Brave and steadfast, values honor above all',
        motivation: 'To protect the innocent and uphold justice',
        fears: ['Failure to protect others', 'Being forgotten'],
        physicalDescription: 'Tall and muscular with battle scars'
      }
    },
    {
      id: 'mage',
      name: 'Lyra Spellweaver',
      description: 'A scholar of the mystical arts',
      level: 1,
      attributes: [
        { id: 'str', name: 'Strength', value: 3 },
        { id: 'int', name: 'Intelligence', value: 9 },
      ],
      skills: [
        { id: 'combat', name: 'Combat', level: 3 },
        { id: 'magic', name: 'Magic', level: 8 },
      ],
      background: {
        description: 'A promising student of the arcane academy',
        personality: 'Curious and methodical, driven by knowledge',
        motivation: 'To unlock the secrets of ancient magic',
        fears: ['Magical backlash', 'Ignorance'],
        physicalDescription: 'Slight build with intense eyes'
      }
    },
    {
      id: 'scout',
      name: 'Kael Shadowstep',
      description: 'A nimble scout and tracker',
      level: 1,
      attributes: [
        { id: 'str', name: 'Strength', value: 6 },
        { id: 'int', name: 'Intelligence', value: 6 },
      ],
      skills: [
        { id: 'combat', name: 'Combat', level: 5 },
        { id: 'magic', name: 'Magic', level: 4 },
      ],
      background: {
        description: 'A forest ranger who knows the wild paths',
        personality: 'Independent and observant, prefers solitude',
        motivation: 'To explore uncharted territories',
        fears: ['Being trapped', 'Civilization'],
        physicalDescription: 'Lean and weathered from outdoor life'
      }
    }
  ];

  const defaultProps = {
    world: mockWorld,
    onCharacterSelect: jest.fn(),
    onCustomizeClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateArchetypes.mockResolvedValue(mockArchetypes);
    mockGenerateRandomArchetype.mockResolvedValue(mockArchetypes[0]); // Return first archetype for random selection
  });

  describe('Component Rendering', () => {
    test('displays quick start title and description', async () => {
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Quick Start Characters')).toBeInTheDocument();
        expect(screen.getByText(/Jump straight into your adventure/)).toBeInTheDocument();
      });
    });


    test('displays archetype cards after generation', async () => {
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Aelric the Brave')).toBeInTheDocument();
        expect(screen.getByText('Lyra Spellweaver')).toBeInTheDocument();
        expect(screen.getByText('Kael Shadowstep')).toBeInTheDocument();
      });
    });

    test('displays archetype attributes and skills correctly', async () => {
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        // Check warrior stats are displayed
        const warriorCard = screen.getByText('Aelric the Brave').closest('[data-testid="archetype-card"]');
        expect(warriorCard).toBeInTheDocument();
        
        // Should show high strength and combat (using new Badge format)
        expect(warriorCard).toHaveTextContent('Strength');
        expect(warriorCard).toHaveTextContent('8');
        expect(warriorCard).toHaveTextContent('Combat');
        expect(warriorCard).toHaveTextContent('7');
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onCharacterSelect when Select Character button is clicked', async () => {
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        const selectButton = screen.getAllByText('Select Character')[0];
        fireEvent.click(selectButton);
      });
      
      await waitFor(() => {
        expect(defaultProps.onCharacterSelect).toHaveBeenCalledWith(mockArchetypes[0]);
      });
    });

    test('calls onCharacterSelect with random archetype when Random Character is clicked', async () => {
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        const randomButton = screen.getByText('Random Character');
        fireEvent.click(randomButton);
      });
      
      await waitFor(() => {
        expect(defaultProps.onCharacterSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            level: 1,
            attributes: expect.any(Array),
            skills: expect.any(Array)
          })
        );
      });
    });

    test('calls onCustomizeClick when Customize Character button is clicked', async () => {
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        const customizeButton = screen.getByText('Customize Character');
        fireEvent.click(customizeButton);
      });
      
      expect(defaultProps.onCustomizeClick).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('shows error message when archetype generation fails', async () => {
      mockGenerateArchetypes.mockRejectedValue(new Error('Generation failed'));
      render(<QuickStartCharacters {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Character Generation Failed')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });
});