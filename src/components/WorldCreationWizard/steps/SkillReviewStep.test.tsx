import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillReviewStep from './SkillReviewStep';
import { SkillSuggestion } from '@/types/ai-suggestions.types';
import { World } from '@/types/world.types';

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
    name: 'Stealth',
    description: 'Ability to move unseen',
    difficulty: 'hard',
    category: 'Physical',
    linkedAttributeNames: ['Dexterity'],
    accepted: false,
    baseValue: 2,
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
  ],
    skills: [],
    derivedStats: [],};

describe('SkillReviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('displays skill suggestions and allows selection toggle', () => {
      render(
        <SkillReviewStep
          worldData={defaultWorldData}
          suggestions={mockSuggestions}
          errors={{}}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Review Skills')).toBeInTheDocument();
      expect(screen.getByText('Combat')).toBeInTheDocument();
      expect(screen.getByText('Stealth')).toBeInTheDocument();
    });

    it('toggles skill selection when clicked', () => {
      render(
        <SkillReviewStep
          worldData={defaultWorldData}
          suggestions={mockSuggestions}
          errors={{}}
          onUpdate={mockOnUpdate}
        />
      );

      const toggleButton = screen.getByTestId('skill-toggle-0');
      expect(toggleButton).toHaveTextContent('Selected');
      
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Excluded');
      
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        skills: expect.any(Array)
      }));
    });

    it('handles skill interaction workflow', () => {
      render(
        <SkillReviewStep
          worldData={defaultWorldData}
          suggestions={mockSuggestions}
          errors={{}}
          onUpdate={mockOnUpdate}
        />
      );

      // Should render with skills displayed
      expect(screen.getByText('Combat')).toBeInTheDocument();
      expect(screen.getByText('Stealth')).toBeInTheDocument();
      
      // onUpdate should be called during rendering due to auto-applying suggestions
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('displays validation errors when present', () => {
      const errors = {
        skills: 'At least one skill must be selected'
      };

      render(
        <SkillReviewStep
          worldData={defaultWorldData}
          suggestions={[]}
          errors={errors}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('At least one skill must be selected')).toBeInTheDocument();
    });

    it('handles empty suggestions gracefully', () => {
      render(
        <SkillReviewStep
          worldData={defaultWorldData}
          suggestions={[]}
          errors={{}}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Review Skills')).toBeInTheDocument();
      // Should not crash with empty suggestions
    });
  });

  describe('Integration', () => {
    it('updates world data with skills from suggestions', () => {
      render(
        <SkillReviewStep
          worldData={defaultWorldData}
          suggestions={mockSuggestions}
          errors={{}}
          onUpdate={mockOnUpdate}
        />
      );

      // Component should auto-apply accepted suggestions and call onUpdate
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        skills: expect.any(Array)
      }));
      
      // Should display the skill content
      expect(screen.getByText('Combat')).toBeInTheDocument();
    });
  });
});