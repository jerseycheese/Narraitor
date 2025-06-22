import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoiceSelector from '../ChoiceSelector';
import { Decision } from '@/types/narrative.types';
import { WorldSkill } from '@/types/world.types';

// Character interface matching the store structure
interface Character {
  id: string;
  name: string;
  description: string;
  worldId: string;
  level: number;
  attributes: Array<{
    id: string;
    characterId: string;
    worldAttributeId?: string;
    name: string;
    baseValue: number;
    modifiedValue: number;
    category?: string;
  }>;
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  background: {
    history: string;
    personality: string;
    goals: string[];
    fears: string[];
    relationships: unknown[];
  };
  isPlayer: boolean;
  status: {
    health: number;
    maxHealth: number;
    conditions: string[];
  };
  inventory: {
    characterId: string;
    items: unknown[];
    capacity: number;
    categories: string[];
  };
}

describe('ChoiceSelector - Skill Requirements Integration', () => {
  const mockOnSelect = jest.fn();

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Test Hero',
    description: 'A brave adventurer',
    worldId: 'world-1',
    level: 5,
    attributes: [],
    skills: [
      {
        id: 'skill-1',
        characterId: 'char-1',
        worldSkillId: 'intimidation',
        name: 'Intimidation',
        level: 8,
        category: 'social'
      },
      {
        id: 'skill-2',
        characterId: 'char-1',
        worldSkillId: 'stealth',
        name: 'Stealth',
        level: 3,
        category: 'physical'
      },
      {
        id: 'skill-3',
        characterId: 'char-1',
        name: 'persuasion',
        level: 6,
        category: 'social'
      }
    ],
    background: {
      history: '',
      personality: '',
      goals: [],
      fears: [],
      relationships: []
    },
    isPlayer: true,
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 10,
      categories: []
    }
  };

  const mockWorldSkills: WorldSkill[] = [
    {
      id: 'intimidation',
      name: 'Intimidation',
      description: 'Ability to frighten others',
      category: 'Social',
      baseValue: 0,
      maxValue: 10
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Ability to move unseen',
      category: 'Physical',
      baseValue: 0,
      maxValue: 10
    },
    {
      id: 'persuasion',
      name: 'Persuasion',
      description: 'Ability to convince others',
      category: 'Social',
      baseValue: 0,
      maxValue: 10
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display skill requirement badges for choices with requirements', () => {
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'A bandit blocks your path. What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Intimidate the bandit',
          alignment: 'chaotic',
          hint: 'Use your commanding presence',
          requirements: [{
            type: 'skill',
            targetId: 'intimidation',
            operator: 'gte',
            value: 6
          }]
        },
        {
          id: 'opt-2',
          text: 'Sneak past quietly',
          alignment: 'neutral',
          hint: 'Avoid confrontation entirely',
          requirements: [{
            type: 'skill',
            targetId: 'stealth',
            operator: 'gte',
            value: 5
          }]
        },
        {
          id: 'opt-3',
          text: 'Try to reason with them',
          alignment: 'lawful',
          hint: 'Appeal to their better nature',
          requirements: [{
            type: 'skill',
            targetId: 'persuasion',
            operator: 'gte',
            value: 4
          }]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        character={mockCharacter}
        worldSkills={mockWorldSkills}
      />
    );

    // Check that all choices are rendered
    expect(screen.getByText('Intimidate the bandit')).toBeInTheDocument();
    expect(screen.getByText('Sneak past quietly')).toBeInTheDocument();
    expect(screen.getByText('Try to reason with them')).toBeInTheDocument();

    // Check that skill requirement badges are displayed
    expect(screen.getByText('Intimidation 6+')).toBeInTheDocument();
    expect(screen.getByText('Stealth 5+')).toBeInTheDocument();
    expect(screen.getByText('Persuasion 4+')).toBeInTheDocument();

    // Check hints are displayed
    expect(screen.getByText('Use your commanding presence')).toBeInTheDocument();
    expect(screen.getByText('Avoid confrontation entirely')).toBeInTheDocument();
    expect(screen.getByText('Appeal to their better nature')).toBeInTheDocument();
  });

  it('should show available skill requirements with green styling', () => {
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Use intimidation',
          requirements: [{
            type: 'skill',
            targetId: 'intimidation',
            operator: 'gte',
            value: 6 // Character has level 8, so this should be available
          }]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        character={mockCharacter}
        worldSkills={mockWorldSkills}
      />
    );

    const badge = screen.getByText('Intimidation 6+');
    expect(badge).toBeInTheDocument();
    
    // Should have available variant styling
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('should show unavailable skill requirements with gray styling', () => {
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Use stealth',
          requirements: [{
            type: 'skill',
            targetId: 'stealth',
            operator: 'gte',
            value: 7 // Character has level 3, so this should be unavailable
          }]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        character={mockCharacter}
        worldSkills={mockWorldSkills}
      />
    );

    const badge = screen.getByText('Stealth 7+');
    expect(badge).toBeInTheDocument();
    
    // Should have unavailable variant styling
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('should handle unknown skills gracefully', () => {
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Use unknown skill',
          requirements: [{
            type: 'skill',
            targetId: 'nonexistent',
            operator: 'gte',
            value: 5
          }]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        character={mockCharacter}
        worldSkills={mockWorldSkills}
      />
    );

    const badge = screen.getByText('Unknown Skill 5+');
    expect(badge).toBeInTheDocument();
    
    // Should show as unavailable (red styling)
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('should allow selection of choices regardless of skill requirements', async () => {
    const user = userEvent.setup();
    
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Use unavailable skill',
          requirements: [{
            type: 'skill',
            targetId: 'stealth',
            operator: 'gte',
            value: 10 // Character has level 3, so this is unavailable
          }]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        character={mockCharacter}
        worldSkills={mockWorldSkills}
      />
    );

    const choiceButton = screen.getByText('Use unavailable skill');
    await user.click(choiceButton);

    // Should still call onSelect even for unavailable skills
    expect(mockOnSelect).toHaveBeenCalledWith('opt-1');
  });

  it('should handle multiple skill requirements on a single choice', () => {
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Complex action',
          requirements: [
            {
              type: 'skill',
              targetId: 'intimidation',
              operator: 'gte',
              value: 6
            },
            {
              type: 'skill',
              targetId: 'persuasion',
              operator: 'gte',
              value: 5
            }
          ]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        character={mockCharacter}
        worldSkills={mockWorldSkills}
      />
    );

    // Both skill requirements should be displayed
    expect(screen.getByText('Intimidation 6+')).toBeInTheDocument();
    expect(screen.getByText('Persuasion 5+')).toBeInTheDocument();
  });

  it('should work without character or world skills (graceful degradation)', () => {
    const decision: Decision = {
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt-1',
          text: 'Use skill',
          requirements: [{
            type: 'skill',
            targetId: 'intimidation',
            operator: 'gte',
            value: 6
          }]
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decision}
        onSelect={mockOnSelect}
        // No character or worldSkills provided
      />
    );

    // Should still render choice
    expect(screen.getByText('Use skill')).toBeInTheDocument();
    
    // Should show skill requirement but as unavailable
    expect(screen.getByText('Unknown Skill 6+')).toBeInTheDocument();
  });
});