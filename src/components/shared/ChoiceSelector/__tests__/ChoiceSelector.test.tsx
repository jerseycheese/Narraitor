import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoiceSelector, { SimpleChoice } from '../ChoiceSelector';
import { Decision } from '@/types/narrative.types';
import { InventoryItem } from '@/types/inventory.types';


describe('ChoiceSelector', () => {
  const mockOnSelect = jest.fn();
  const mockOnCustomSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Expand the Suggested Actions collapsible if it's present
  const expandSuggestions = () => {
    const toggle = screen.queryByLabelText(/Expand Suggested Actions/i);
    if (toggle) {
      fireEvent.click(toggle);
    }
  };

  // Helper to render and expand suggestions
  const renderChoiceSelector = (props: React.ComponentProps<typeof ChoiceSelector>) => {
    render(<ChoiceSelector {...props} />);
    expandSuggestions();
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

  const defaultProps = {
    onSelect: mockOnSelect,
    allowCustomInput: true,
    onCustomSubmit: mockOnCustomSubmit
  };

  const simpleChoices: SimpleChoice[] = [
    { id: 'choice-1', text: 'Go north' },
    { id: 'choice-2', text: 'Go south' },
    { id: 'choice-3', text: 'Rest here' },
  ];

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
    it('displays all choices and handles selection', async () => {
      const user = userEvent.setup();
      renderChoiceSelector({choices: simpleChoices, onSelect: mockOnSelect});

      assertChoicesVisible(['Go north', 'Go south', 'Rest here']);

      await user.click(screen.getByText('Go north'));
      expect(mockOnSelect).toHaveBeenCalledWith('choice-1');
    });

    it('displays decisions with hints when enabled', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect});
      assertChoicesVisible(['Attack', 'Requires courage', 'Defend', 'Safe option']);
    });
  });

  describe('Custom Input', () => {
    it('shows custom input field when enabled', () => {
      renderChoiceSelector({choices: simpleChoices, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});
      
      expect(screen.getByPlaceholderText('Type your custom response...')).toBeInTheDocument();
    });

    it('submits custom input when entered', async () => {
      const user = userEvent.setup();
      renderChoiceSelector({choices: simpleChoices, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      await user.type(input, 'Custom action');
      await user.keyboard('{Enter}');
      
      expect(mockOnCustomSubmit).toHaveBeenCalledWith('Custom action');
    });
  });

  describe('Skill Requirements', () => {
    it('shows skill badges with skill names only (no difficulty)', () => {
      renderChoiceSelector({decision: decisionWithSkillRequirements, onSelect: mockOnSelect, worldSkills: mockWorldSkills});
      assertChoicesVisible(['Sneak past', 'Intimidate the guard', 'Walk directly']);

      // Skill badges should show skill name only (no numbers)
      expect(screen.getByText('Stealth')).toBeInTheDocument();
      expect(screen.getByText('Intimidation')).toBeInTheDocument();
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
      expandSuggestions();

      // Options with unmet requirements should be disabled
      const sneakOption = screen.getByText('Sneak past').closest('button');
      const intimidateOption = screen.getByText('Intimidate the guard').closest('button');
      const directOption = screen.getByText('Walk directly').closest('button');

      expect(sneakOption).toBeDisabled();
      expect(intimidateOption).toBeDisabled();
      expect(directOption).not.toBeDisabled(); // No requirements

      // Should not trigger onSelect when clicking disabled options
      await user.click(screen.getByText('Sneak past'));
      expect(mockOnSelect).not.toHaveBeenCalled();
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
      expandSuggestions();
      return screen.getByTestId('choice-option-combined-opt');
    };

    it('disables when skill requirement is met but item requirement is missing', () => {
      const button = renderCombinedOption(proficientSkills, []);
      expect(button).toBeDisabled();
      expect(button?.getAttribute('data-disabled-reason')).toMatch(/Items/i);
    });

    it('disables when item requirement is met but skill requirement is missing', () => {
      const button = renderCombinedOption(insufficientSkills, [
        createInventoryItem('Lockpick', 1, { stackable: false }),
      ]);
      expect(button).toBeDisabled();
      expect(button?.getAttribute('data-disabled-reason')).toMatch(/Skills/i);
    });

    it('disables when both requirements are unmet', () => {
      const button = renderCombinedOption([], []);
      expect(button).toBeDisabled();
      const reason = button?.getAttribute('data-disabled-reason') ?? '';
      expect(reason).toMatch(/Skills/i);
      expect(reason).toMatch(/Items/i);
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
      expandSuggestions();
      
      // Should display the choice text
      expect(screen.getByText('Sneak past')).toBeInTheDocument();
      expect(screen.getByText('Intimidate the guard')).toBeInTheDocument();
      expect(screen.getByText('Walk directly')).toBeInTheDocument();
    });
  });
});
