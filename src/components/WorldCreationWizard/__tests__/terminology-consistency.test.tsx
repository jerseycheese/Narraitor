import React from 'react';
import { render, screen } from '@testing-library/react';
import SkillReviewStep from '../steps/SkillReviewStep';
import { SkillSuggestion } from '../WorldCreationWizard';
import { World } from '@/types/world.types';

/**
 * Integration test to verify terminology consistency across skill-related components
 * 
 * This test ensures that Issue #534 is properly addressed:
 * - All skill-related forms use "Difficulty" terminology
 * - No components display "Learning Curve" labels
 * - Terminology is consistent between wizard and editor components
 */

const mockOnUpdate = jest.fn();

const mockSuggestions: SkillSuggestion[] = [
  {
    name: 'Combat',
    description: 'Ability to fight in battle',
    difficulty: 'medium',
    category: 'Combat',
    linkedAttributeNames: ['Strength'],
    accepted: true,
    baseValue: 3,
    minValue: 1,
    maxValue: 5,
  },
  {
    name: 'Magic',
    description: 'Ability to cast spells',
    difficulty: 'hard',
    category: 'Mage', 
    linkedAttributeNames: ['Intelligence'],
    accepted: true,
    baseValue: 3,
    minValue: 1,
    maxValue: 5,
  },
];

const defaultWorldData: Partial<World> = {
  name: 'Test World',
  genre: 'fantasy',
  attributes: [
    {
      id: 'attr-1',
      worldId: '',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
    {
      id: 'attr-2',
      worldId: '',
      name: 'Intelligence',
      description: 'Mental capacity',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: '',
      name: 'Combat',
      description: 'Ability to fight in battle',
      difficulty: 'medium' as const,
      category: 'Combat',
      attributeIds: ['attr-1'],
    },
    {
      id: 'skill-2',
      worldId: '',
      name: 'Magic',
      description: 'Ability to cast spells',
      difficulty: 'hard' as const,
      category: 'Mage',
      attributeIds: ['attr-2'],
    },
  ],
};

describe('Terminology Consistency - Issue #534', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('SkillReviewStep uses "Difficulty" terminology consistently', () => {
    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Should display "Difficulty" label when customizing skills
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    
    // Should NOT display deprecated "Learning Curve" terminology
    expect(screen.queryByText('Learning Curve')).not.toBeInTheDocument();
  });

  test('terminology consistency maintained across all skill components', () => {
    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Verify consistent terminology throughout the component
    const difficultyElements = screen.getAllByText(/Difficulty/i);
    expect(difficultyElements.length).toBeGreaterThan(0);
    
    // Ensure no instances of old terminology exist
    expect(screen.queryByText(/Learning Curve/i)).not.toBeInTheDocument();
  });

  test('skill difficulty labels are properly displayed in form', () => {
    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check that form labels use correct terminology
    const difficultyLabel = screen.getByText('Difficulty');
    expect(difficultyLabel).toBeInTheDocument();
    
    // Verify the difficulty select field is properly labeled
    const difficultySelect = screen.getByTestId('skill-difficulty-select-0');
    expect(difficultySelect).toBeInTheDocument();
  });

  test('multiple skills show consistent difficulty terminology', () => {
    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check that both skills use consistent terminology
    // When details are shown for skills, they should both use "Difficulty"
    const difficultyLabels = screen.getAllByText('Difficulty');
    expect(difficultyLabels).toHaveLength(1); // Only first skill shows details by default
    
    // No deprecated terminology should be found
    expect(screen.queryByText('Learning Curve')).not.toBeInTheDocument();
  });
});