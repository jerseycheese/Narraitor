import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ChoiceSelector from '../ChoiceSelector';
import {
  Decision,
  DecisionRequirement,
  DecisionItemRequirements,
} from '@/types/narrative.types';

describe('ChoiceSelector - Inventory Requirements', () => {
  const mockInventoryItems = [
    {
      id: 'item-lockpick',
      name: 'Lockpick',
      description: '',
      quantity: 1,
      stackable: false,
      categoryId: 'equipment',
      acquisitionHistory: [],
      categorization: {
        categoryId: 'equipment',
        source: 'manual' as const,
        classifiedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item-potion',
      name: 'Healing Potion',
      description: '',
      quantity: 3,
      stackable: true,
      categoryId: 'consumables',
      acquisitionHistory: [],
      categorization: {
        categoryId: 'consumables',
        source: 'manual' as const,
        classifiedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const createMockDecision = (
    options: Array<{
      id: string;
      text: string;
      requirements?: DecisionRequirement[];
      requiredItems?: DecisionItemRequirements;
    }>
  ): Decision => ({
    id: 'decision-1',
    prompt: 'What do you do?',
    options: options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      requirements: opt.requirements || [],
      requiredItems: opt.requiredItems,
    })),
  });

  const itemRequirement = (targetId: string, value: number): DecisionRequirement => ({
    type: 'item',
    targetId,
    operator: 'gte',
    value,
  });

  it('should enable option when character has required item', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Pick the lock',
        requiredItems: [itemRequirement('Lockpick', 1)],
      },
      {
        id: 'opt-2',
        text: 'Break down the door',
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const lockpickButton = screen.getByTestId('choice-option-opt-1');
    expect(lockpickButton).not.toBeDisabled();
    expect(lockpickButton).not.toHaveAttribute('data-disabled-reason');
  });

  it('should disable option when character lacks required item', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requiredItems: [itemRequirement('Magic Key', 1)],
      },
      {
        id: 'opt-2',
        text: 'Look for another way',
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const button = screen.getByTestId('choice-option-opt-1');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled-reason');
    expect(button.getAttribute('data-disabled-reason')).toContain('Magic Key');
  });

  it('should disable option when character has insufficient quantity', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Bribe with 10 gold coins',
        requiredItems: [itemRequirement('Gold Coins', 10)],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const bribeButton = screen.getByTestId('choice-option-opt-1');
    expect(bribeButton).toBeDisabled();
    expect(bribeButton?.getAttribute('data-disabled-reason')).toContain('Gold Coins');
  });

  it('should show feedback about missing items', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requiredItems: [itemRequirement('Magic Key', 1)],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} showHints={true} inventoryItems={mockInventoryItems} />);

    expect(screen.getByText(/Requires all:/i)).toBeInTheDocument();
    const optionButton = screen.getByTestId('choice-option-opt-1');
    const requirementBadge = within(optionButton).getByText(/Magic Key\s*\(0\/1\)/i);
    expect(requirementBadge).toBeInTheDocument();
  });

  it('should show feedback about insufficient quantity', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Heal multiple allies',
        requiredItems: [itemRequirement('Healing Potion', 5)],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} showHints={true} inventoryItems={mockInventoryItems} />);

    // Should show current quantity vs required
    expect(screen.getByText(/Requires all:/i)).toBeInTheDocument();
    const optionButton = screen.getByTestId('choice-option-opt-1');
    const requirementBadge = within(optionButton).getByText(/Healing Potion\s*\(3\/5\)/i);
    expect(requirementBadge).toBeInTheDocument();
  });

  it('should handle multiple item requirements with AND logic', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Craft a healing salve',
        requiredItems: [
          itemRequirement('Healing Potion', 2),
          itemRequirement('Lockpick', 1),
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    // Should be enabled because character has both items in required quantities
    const craftButton = screen.getByTestId('choice-option-opt-1');
    expect(craftButton).not.toBeDisabled();
  });

  it('should disable option if ANY requirement in AND logic fails', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Perform complex ritual',
        requiredItems: [
          itemRequirement('Healing Potion', 2),
          itemRequirement('Magic Scroll', 1),
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    // Should be disabled because character lacks Magic Scroll
    const ritualButton = screen.getByTestId('choice-option-opt-1');
    expect(ritualButton).toBeDisabled();
  });

  it('should support OR logic for item requirements', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Open the sealed door',
        requiredItems: {
          logic: 'any',
          requirements: [
            itemRequirement('Lockpick', 1),
            itemRequirement('Magic Key', 1),
          ],
        },
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const doorButton = screen.getByTestId('choice-option-opt-1');
    expect(doorButton).not.toBeDisabled();
    expect(screen.getByText(/Requires any of:/i)).toBeInTheDocument();
    const optionButton = screen.getByTestId('choice-option-opt-1');
    expect(within(optionButton).getByText(/^Lockpick$/i)).toBeInTheDocument();
    expect(within(optionButton).getByText(/Magic Key\s*\(0\/1\)/i)).toBeInTheDocument();
  });

  it('should prevent selection of disabled options', async () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requiredItems: [itemRequirement('Magic Key', 1)],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const magicKeyButton = screen.getByTestId('choice-option-opt-1');

    await userEvent.click(magicKeyButton);

    // Should not call onSelect for disabled option
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('should show visual distinction for disabled options', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requiredItems: [itemRequirement('Magic Key', 1)],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const magicKeyButton = screen.getByTestId('choice-option-opt-1');

    // Should have visual indicator of being disabled
    expect(magicKeyButton).toHaveClass('opacity-50');
    expect(magicKeyButton).toHaveClass('cursor-not-allowed');
  });
});
