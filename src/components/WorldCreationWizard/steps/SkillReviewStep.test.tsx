import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillReviewStep from './SkillReviewStep';
import { SkillSuggestion } from '../WorldCreationWizard';
import { World } from '@/types/world.types';

const mockOnUpdate = jest.fn();
const mockOnNext = jest.fn();
const mockOnBack = jest.fn();
const mockOnCancel = jest.fn();

const mockSuggestions: SkillSuggestion[] = [
  {
    name: 'Combat',
    description: 'Ability to fight in battle',
    difficulty: 'medium',
    category: 'Combat',
    linkedAttributeName: 'Strength',
    accepted: false,
  },
];

const defaultWorldData: Partial<World> = {
  name: 'Test World',
  theme: 'fantasy',
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
  skills: [],
};

describe('SkillReviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all suggested skills', () => {
    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Review Skills')).toBeInTheDocument();
    expect(screen.getByText('Combat')).toBeInTheDocument();
  });

  test('toggles skill selection', () => {
    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    // First, check that it starts as Selected
    const toggleButton = screen.getByTestId('skill-toggle-0');
    expect(toggleButton).toHaveTextContent('Selected');
    
    // Click to exclude it
    fireEvent.click(toggleButton);
    
    // Now check that it was excluded properly
    expect(toggleButton).toHaveTextContent('Excluded');
    
    // Check that onUpdate was called with an empty skills array
    // (since we excluded the only selected skill)
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: []
      })
    );
  });

  test('shows skill details when selected', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      skills: [{
        id: 'skill-1',
        worldId: '',
        name: 'Combat',
        description: 'Ability to fight in battle',
        difficulty: 'medium' as const,
        category: 'Combat',
        linkedAttributeId: 'attr-1',
      }],
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('skill-name-input-0')).toBeInTheDocument();
    expect(screen.getByTestId('skill-description-textarea-0')).toBeInTheDocument();
    expect(screen.getByTestId('skill-difficulty-select-0')).toBeInTheDocument();
    expect(screen.getByTestId('skill-attribute-select-0')).toBeInTheDocument();
  });

  test('displays Learning Curve instead of Difficulty', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      skills: [{
        id: 'skill-1',
        worldId: '',
        name: 'Combat',
        description: 'Ability to fight in battle',
        difficulty: 'medium' as const,
        category: 'Combat',
        linkedAttributeId: 'attr-1',
      }],
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Learning Curve')).toBeInTheDocument();
  });

  test('allows editing skill properties', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      skills: [{
        id: 'skill-1',
        worldId: '',
        name: 'Combat',
        description: 'Ability to fight in battle',
        difficulty: 'medium' as const,
        category: 'Combat',
        linkedAttributeId: 'attr-1',
      }],
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByTestId('skill-name-input-0');
    fireEvent.change(nameInput, { target: { value: 'Melee Combat' } });

    expect(mockOnUpdate).toHaveBeenCalled();
    const call = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
    expect(call.skills[0].name).toBe('Melee Combat');
  });

  test('updates linked attribute when selected', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      skills: [{
        id: 'skill-1',
        worldId: '',
        name: 'Combat',
        description: 'Ability to fight in battle',
        difficulty: 'medium' as const,
        category: 'Combat',
        linkedAttributeId: 'attr-1',
      }],
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    const attributeSelect = screen.getByTestId('skill-attribute-select-0');
    fireEvent.change(attributeSelect, { target: { value: 'Strength' } });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: expect.arrayContaining([
          expect.objectContaining({ linkedAttributeId: 'attr-1' })
        ])
      })
    );
  });

  test('displays selected skill count', () => {
    const multipleSuggestions = [
      ...mockSuggestions,
      {
        name: 'Stealth',
        description: 'Ability to move unseen',
        difficulty: 'hard' as const,
        category: 'Rogue',
        linkedAttributeName: 'Agility',
        accepted: true,
      },
    ];

    const suggestionsWithMultipleSelected = multipleSuggestions.map((s, i) => ({
      ...s,
      accepted: i < 2,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      skills: [
        {
          id: 'skill-1',
          worldId: '',
          name: 'Combat',
          description: 'Ability to fight in battle',
          difficulty: 'medium' as const,
          category: 'Combat',
          linkedAttributeId: 'attr-1',
        },
        {
          id: 'skill-2',
          worldId: '',
          name: 'Stealth',
          description: 'Ability to move unseen',
          difficulty: 'hard' as const,
          category: 'Rogue',
        },
      ],
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithMultipleSelected}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('skill-count-summary')).toHaveTextContent('Selected skills: 2 / 12');
  });

  test('enforces maximum 12 skills limit', () => {
    const manySuggestions = Array.from({ length: 13 }, (_, i) => ({
      name: `Skill ${i}`,
      description: `Description ${i}`,
      difficulty: 'medium' as const,
      category: 'General',
      accepted: true,
    }));

    const worldDataWithManySkills = {
      ...defaultWorldData,
      skills: Array.from({ length: 13 }, (_, i) => ({
        id: `skill-${i}`,
        worldId: '',
        name: `Skill ${i}`,
        description: `Description ${i}`,
        difficulty: 'medium' as const,
        category: 'General',
      })),
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithManySkills}
        suggestions={manySuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // Should not proceed (onNext should not be called) if more than 12 skills selected
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('calls onNext with valid selection', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    render(
      <SkillReviewStep
        worldData={defaultWorldData}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('step-next-button'));

    expect(mockOnNext).toHaveBeenCalled();
  });

  test('manual skill selection works for existing world data', () => {
    // In our updated design, all skills are Selected by default
    // Let's verify we can toggle them off and on
    
    const multipleSuggestions = [
      ...mockSuggestions,
      {
        name: 'Stealth',
        description: 'Ability to move unseen',
        difficulty: 'hard' as const,
        category: 'Rogue',
        linkedAttributeName: 'Agility',
      },
      {
        name: 'Magic',
        description: 'Ability to cast spells',
        difficulty: 'hard' as const,
        category: 'Mage',
        linkedAttributeName: 'Intelligence',
      },
    ];

    const worldDataWithSkills = {
      ...defaultWorldData,
      skills: [
        {
          id: 'skill-1',
          worldId: '',
          name: 'Combat',
          description: 'Ability to fight in battle',
          difficulty: 'medium' as const,
          category: 'Combat',
          linkedAttributeId: 'attr-1',
        },
        {
          id: 'skill-3',
          worldId: '',
          name: 'Magic',
          description: 'Ability to cast spells',
          difficulty: 'hard' as const,
          category: 'Mage',
          linkedAttributeId: 'attr-2',
        },
      ],
    };

    render(
      <SkillReviewStep
        worldData={worldDataWithSkills}
        suggestions={multipleSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    // All skills should start as Selected
    expect(screen.getByTestId('skill-toggle-0')).toHaveTextContent('Selected');
    expect(screen.getByTestId('skill-toggle-1')).toHaveTextContent('Selected');
    expect(screen.getByTestId('skill-toggle-2')).toHaveTextContent('Selected');
    
    // Toggle the middle skill off
    fireEvent.click(screen.getByTestId('skill-toggle-1'));
    
    // Now check the state
    expect(screen.getByTestId('skill-toggle-0')).toHaveTextContent('Selected');
    expect(screen.getByTestId('skill-toggle-1')).toHaveTextContent('Excluded');
    expect(screen.getByTestId('skill-toggle-2')).toHaveTextContent('Selected');
  });
});
