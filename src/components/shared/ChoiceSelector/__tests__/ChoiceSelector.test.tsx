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
    texts.forEach(text => {
      // Choice text should appear as either visible content or a title attribute
      const found =
        screen.queryByText(text) !== null ||
        document.querySelector(`[title="${text}"]`) !== null;
      expect(found).toBe(true);
    });
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

  describe('Keyboard shortcuts (#276)', () => {
    it('selects a choice when its number key is pressed', () => {
      renderChoiceSelector({ decision, onSelect: mockOnSelect });

      fireEvent.keyDown(document, { key: '2' });

      expect(mockOnSelect).toHaveBeenCalledWith('opt-2');
    });

    it('does not select a disabled-by-requirements choice via its number key', () => {
      // combinedRequirementDecision's first option (key "1") is item-gated
      // and no lockpick is supplied here, so it renders disabled.
      renderChoiceSelector({
        decision: combinedRequirementDecision,
        onSelect: mockOnSelect,
        worldSkills: mockWorldSkills,
        characterSkills: [],
        inventoryItems: [],
      });

      fireEvent.keyDown(document, { key: '1' });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('selects by number while the custom input is focused but still empty', async () => {
      const user = userEvent.setup();
      renderChoiceSelector({
        decision,
        onSelect: mockOnSelect,
        enableCustomInput: true,
        onCustomSubmit: mockOnCustomSubmit,
      });

      const input = screen.getByPlaceholderText('Describe your action...');
      input.focus();
      await user.keyboard('1');

      expect(mockOnSelect).toHaveBeenCalledWith(decision.options[0].id);
      expect(input).toHaveValue('');
    });

    it('ignores number keys once the custom input has text', async () => {
      const user = userEvent.setup();
      renderChoiceSelector({
        decision,
        onSelect: mockOnSelect,
        enableCustomInput: true,
        onCustomSubmit: mockOnCustomSubmit,
      });

      const input = screen.getByPlaceholderText('Describe your action...');
      await user.type(input, 'Take 1 step back');

      expect(mockOnSelect).not.toHaveBeenCalled();
      expect(input).toHaveValue('Take 1 step back');
    });

    it('does not respond to number keys once the selector is disabled', () => {
      renderChoiceSelector({ decision, onSelect: mockOnSelect, isDisabled: true });

      fireEvent.keyDown(document, { key: '1' });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('does not respond to number keys while shortcutsSuspended (a modal is open)', () => {
      renderChoiceSelector({ decision, onSelect: mockOnSelect, shortcutsSuspended: true });

      fireEvent.keyDown(document, { key: '1' });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('Custom Input', () => {
    it('shows custom input field when enabled', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});

      expect(screen.getByPlaceholderText('Describe your action...')).toBeInTheDocument();
    });

    it('submits custom input when entered', async () => {
      const user = userEvent.setup();
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});

      const input = screen.getByPlaceholderText('Describe your action...');
      await user.type(input, 'Custom action');
      await user.keyboard('{Enter}');

      expect(mockOnCustomSubmit).toHaveBeenCalledWith('Custom action');
    });

    it('leaves focus alone on mount so the number shortcuts stay reachable', () => {
      // The selector remounts every turn. Parking focus in the composer put
      // every keystroke of the turn into a text box and made 1/2/3 inert,
      // because the shortcut hook skips events coming from an input.
      const focusSpy = jest.spyOn(HTMLInputElement.prototype, 'focus');

      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});

      expect(focusSpy).not.toHaveBeenCalled();

      focusSpy.mockRestore();
    });

  });

  describe('Skill Requirements', () => {
    it('surfaces a skill-and-DC badge for skill-gated options without leaking numbers into the option label', () => {
      const characterSkills = createCharacterSkills({ 'stealth-skill': 5, 'intimidation-skill': 7 });
      renderChoiceSelector({decision: decisionWithSkillRequirements, onSelect: mockOnSelect, worldSkills: mockWorldSkills, characterSkills});
      assertChoicesVisible(['Sneak past', 'Intimidate the guard', 'Walk directly']);

      // F47: the skill and its DC are shown up front so the player can see the gate.
      expect(screen.getByText(/Stealth.*DC 10/i)).toBeInTheDocument();
      expect(screen.getByText(/Intimidation.*DC 14/i)).toBeInTheDocument();
      expect(screen.queryByText(/^Skill$/i)).not.toBeInTheDocument();
    });

    it('still surfaces the skill-and-DC badge when the character lacks the skill (F47)', () => {
      // No character skills at all — the gate should still be visible before choosing.
      renderChoiceSelector({decision: decisionWithSkillRequirements, onSelect: mockOnSelect, worldSkills: mockWorldSkills, characterSkills: []});

      expect(screen.getByText(/Stealth.*DC 10/i)).toBeInTheDocument();
      expect(screen.getByText(/Intimidation.*DC 14/i)).toBeInTheDocument();
    });

    it('limits the number of choices to 3', () => {
      const decisionWithManyOptions: Decision = {
        ...decision,
        options: [
          { id: '1', text: 'Option 1' },
          { id: '2', text: 'Option 2' },
          { id: '3', text: 'Option 3' },
          { id: '4', text: 'Option 4' },
        ]
      };
      renderChoiceSelector({decision: decisionWithManyOptions, onSelect: mockOnSelect});
      expect(screen.queryByText('Option 4')).not.toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('keeps a chaotic option visible when choices are capped to 3', () => {
      const alignedDecision: Decision = {
        id: 'decision-aligned',
        prompt: 'How do you respond?',
        options: [
          { id: 'lawful-opt', text: 'Follow protocol', alignment: 'lawful' },
          { id: 'neutral-opt-1', text: 'Assess risks', alignment: 'neutral' },
          { id: 'neutral-opt-2', text: 'Observe quietly', alignment: 'neutral' },
          { id: 'chaotic-opt', text: 'Trigger a loud distraction', alignment: 'chaotic' },
        ],
      };

      renderChoiceSelector({ decision: alignedDecision, onSelect: mockOnSelect });

      expect(screen.getByText('Follow protocol')).toBeInTheDocument();
      expect(screen.getByText('Trigger a loud distraction')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
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
      const input = screen.getByPlaceholderText('Describe your action...');
      expect(input).toHaveAttribute('id', 'manuscript-input');
    });

    it('uses manuscript-send id for submit button', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect, enableCustomInput: true, onCustomSubmit: mockOnCustomSubmit});
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toHaveAttribute('id', 'manuscript-send');
    });

    it('applies manuscript-suggested-action class to choice buttons', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect});
      const choiceButton = screen.getByText('Attack').closest('button');
      expect(choiceButton).toHaveClass('manuscript-suggested-action');
    });

    it('uses manuscript suggested-action content wrappers', () => {
      renderChoiceSelector({decision: decision, onSelect: mockOnSelect});
      const choiceButton = screen.getByText('Attack').closest('button');
      expect(choiceButton?.querySelector('.manuscript-suggested-action-content')).toBeInTheDocument();
      expect(choiceButton?.querySelector('.manuscript-suggested-action-title-row')).toBeInTheDocument();
    });
  });
});
