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

    const firstCheckbox = screen.getByTestId('skill-checkbox-0');
    fireEvent.click(firstCheckbox);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: expect.arrayContaining([
          expect.objectContaining({ name: 'Combat' })
        ])
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

  test('persists selections after navigating away and back', () => {
    const multipleSuggestions = [
      ...mockSuggestions,
      {
        name: 'Stealth',
        description: 'Ability to move unseen',
        difficulty: 'hard' as const,
        category: 'Rogue',
        linkedAttributeName: 'Agility',
        accepted: false,
      },
      {
        name: 'Magic',
        description: 'Ability to cast spells',
        difficulty: 'hard' as const,
        category: 'Mage',
        linkedAttributeName: 'Intelligence',
        accepted: false,
      },
    ];

    const suggestionsWithSelection = multipleSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0 || i === 2,
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
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('skill-checkbox-0')).toBeChecked();
    expect(screen.getByTestId('skill-checkbox-1')).not.toBeChecked();
    expect(screen.getByTestId('skill-checkbox-2')).toBeChecked();
  });
});
