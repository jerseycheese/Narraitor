import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoiceSelector from '../ChoiceSelector';
import { Decision } from '@/types/narrative.types';
import { InventoryItem } from '@/types/inventory.types';


describe('ChoiceSelector', () => {
  const mockOnSelect = jest.fn();
  const mockOnCustomSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to render
  const renderChoiceSelector = (props: React.ComponentProps<typeof ChoiceSelector>) => {
    render(<ChoiceSelector {...props} />);
  };

  const assertChoicesVisible = (texts: string[]) => {
    texts.forEach(text => expect(screen.getByText(text)).toBeInTheDocument());
  };

  const createCharacterSkills = (skillLevels: Record<string, number>) => {
    return Object.entries(skillLevels).map(([worldSkillId, level]) => ({
      id: `skill-${worldSkillId}`,
      characterId: 'char-1',
      worldSkillId,
      name: worldSkillId.replace('-skill', '').replace(/^\w/, c => c.toUpperCase()),
      level,
      category: 'Physical'
    }));
  };

  const decision: Decision = {
    id: 'decision-1',
    prompt: 'What do you do?',
    options: [
      { id: 'opt-1', text: 'Attack', hint: 'Requires courage' },
      { id: 'opt-2', text: 'Defend', hint: 'Safe option' },
    ],
  };

  const decisionWithSkillRequirements: Decision = {
    id: 'decision-2',
    prompt: 'How do you proceed?',
    options: [
      { 
        id: 'stealth-opt', 
        text: 'Sneak past', 
        requirements: [{ type: 'skill', targetId: 'stealth-skill', operator: 'gte', value: 5 }] 
      },
      { 
        id: 'intimidate-opt', 
        text: 'Intimidate the guard', 
        requirements: [{ type: 'skill', targetId: 'intimidation-skill', operator: 'gte', value: 7 }] 
      },
      { id: 'direct-opt', text: 'Walk directly' },
    ],
  };

  const combinedRequirementDecision: Decision = {
    id: 'decision-3',
    prompt: 'Slip past the lock without raising alarms',
    options: [
      {
        id: 'combined-opt',
        text: 'Use stealth and a lockpick to bypass the door',
        requirements: [{ type: 'skill', targetId: 'stealth-skill', operator: 'gte', value: 5 }],
        requiredItems: [{ type: 'item', targetId: 'Lockpick', operator: 'gte', value: 1 }],
      },
      { id: 'fallback-opt', text: 'Knock and hope someone answers' },
    ],
  };

  const mockWorldSkills = [
    {
      id: 'stealth-skill',
      name: 'Stealth',
      description: 'Move silently',
      category: 'Physical',
      worldId: 'world-1',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
      difficulty: 'medium' as const,
    },
    {
      id: 'intimidation-skill',
      name: 'Intimidation',
      description: 'Frighten others',
      category: 'Social',
      worldId: 'world-1',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
      difficulty: 'medium' as const,
    },
  ];

  const createInventoryItem = (
    name: string,
    quantity: number,
    options: { stackable?: boolean; categoryId?: InventoryItem['categoryId'] } = {}
  ): InventoryItem => {
    const now = new Date().toISOString();
    const {
      stackable = quantity > 1,
      categoryId = 'equipment',
    } = options;

    return {
      id: `item-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      description: '',
      quantity,
      stackable,
      categoryId,
      acquisitionHistory: [],
      categorization: {
        categoryId,
        source: 'manual',
        classifiedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
  };

  describe('Basic Choice Selection', () => {
    it('displays decisions with hints when enabled', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect});
      assertChoicesVisible(['Attack', 'Requires courage', 'Defend', 'Safe option']);
    });
  });

  describe('Custom Input', () => {
    it('shows custom input field when enabled', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});

      expect(screen.getByPlaceholderText('Type your custom response...')).toBeInTheDocument();
    });

    it('submits custom input when entered', async () => {
      const user = userEvent.setup();
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});

      const input = screen.getByPlaceholderText('Type your custom response...');
      await user.type(input, 'Custom action');
      await user.keyboard('{Enter}');

      expect(mockOnCustomSubmit).toHaveBeenCalledWith('Custom action');
    });
  });

  describe('Skill Requirements', () => {
    it('shows skill badges with skill names and "Check Required" label', () => {
      renderChoiceSelector({decision: decisionWithSkillRequirements, onSelect: mockOnSelect, worldSkills: mockWorldSkills});
      assertChoicesVisible(['Sneak past', 'Intimidate the guard', 'Walk directly']);

      // Skill badges should show skill name with "Check Required" label
      expect(screen.getByText('Stealth Check Required')).toBeInTheDocument();
      expect(screen.getByText('Intimidation Check Required')).toBeInTheDocument();
    });

    it('disables options when character lacks required skills', async () => {
      const user = userEvent.setup();
      const characterSkills = createCharacterSkills({ 'stealth-skill': 2, 'intimidation-skill': 3 });

      render(
        <ChoiceSelector
          decision={decisionWithSkillRequirements}
          onSelect={mockOnSelect}
          worldSkills={mockWorldSkills}
          characterSkills={characterSkills}
          inventoryItems={[]}
        />
      );

      // Skill requirements no longer disable options (probabilistic checks on selection)
      const sneakOption = screen.getByText('Sneak past').closest('button');
      const intimidateOption = screen.getByText('Intimidate the guard').closest('button');
      const directOption = screen.getByText('Walk directly').closest('button');

      expect(sneakOption).not.toBeDisabled();
      expect(intimidateOption).not.toBeDisabled();
      expect(directOption).not.toBeDisabled();

      // Should trigger onSelect when clicking skill-gated options
      await user.click(screen.getByText('Sneak past'));
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('Skill and Item Requirement Interplay', () => {
    const proficientSkills = createCharacterSkills({ 'stealth-skill': 6 });
    const insufficientSkills = createCharacterSkills({ 'stealth-skill': 2 });

    const renderCombinedOption = (
      skills: typeof proficientSkills,
      items: InventoryItem[]
    ) => {
      render(
        <ChoiceSelector
          decision={combinedRequirementDecision}
          onSelect={mockOnSelect}
          worldSkills={mockWorldSkills}
          characterSkills={skills}
          inventoryItems={items}
        />
      );
      return screen.getByTestId('choice-option-combined-opt');
    };

    it('disables when item requirement is missing (skills do not disable)', () => {
      const button = renderCombinedOption(proficientSkills, []);
      expect(button).toBeDisabled();
      expect(button?.getAttribute('data-disabled-reason')).toMatch(/Items/i);
    });

    it('does not disable when item requirement is met (skills do not disable)', () => {
      const button = renderCombinedOption(insufficientSkills, [
        createInventoryItem('Lockpick', 1, { stackable: false }),
      ]);
      expect(button).not.toBeDisabled();
    });

    it('disables when item requirement is unmet (skills do not disable)', () => {
      const button = renderCombinedOption([], []);
      expect(button).toBeDisabled();
      const reason = button?.getAttribute('data-disabled-reason') ?? '';
      expect(reason).toMatch(/Items/i);
      expect(reason).not.toMatch(/Skills/i);
    });

    it('enables when both requirements are satisfied', () => {
      const button = renderCombinedOption(proficientSkills, [
        createInventoryItem('Lockpick', 1, { stackable: false }),
      ]);
      expect(button).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('displays skill requirement information accessibly', () => {
      render(
        <ChoiceSelector
          decision={decisionWithSkillRequirements}
          onSelect={mockOnSelect}
          worldSkills={mockWorldSkills}
        />
      );
      
      // Should display the choice text
      expect(screen.getByText('Sneak past')).toBeInTheDocument();
      expect(screen.getByText('Intimidate the guard')).toBeInTheDocument();
      expect(screen.getByText('Walk directly')).toBeInTheDocument();
    });
  });

  describe('Manuscript Styling Contract', () => {
    it('uses manuscript-input id for custom input', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});
      const input = screen.getByPlaceholderText('Type your custom response...');
      expect(input).toHaveAttribute('id', 'manuscript-input');
    });

    it('uses manuscript-send id for submit button', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});
      const sendButton = screen.getByRole('button', { name: /submit/i });
      expect(sendButton).toHaveAttribute('id', 'manuscript-send');
    });

    it('applies manuscript-suggested-action class to choice buttons', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect});
      const choiceButton = screen.getByText('Attack').closest('button');
      expect(choiceButton).toHaveClass('manuscript-suggested-action');
    });
  });
});
