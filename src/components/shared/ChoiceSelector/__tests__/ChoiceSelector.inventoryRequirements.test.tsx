import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ChoiceSelector from '../ChoiceSelector';
import { Decision, DecisionRequirement } from '@/types/narrative.types';

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
    }>
  ): Decision => ({
    id: 'decision-1',
    prompt: 'What do you do?',
    options: options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      requirements: opt.requirements || [],
    })),
  });

  it('should enable option when character has required item', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Pick the lock',
        requirements: [
          {
            type: 'item',
            targetId: 'Lockpick',
            operator: 'gte',
            value: 1,
          },
        ],
      },
      {
        id: 'opt-2',
        text: 'Break down the door',
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const lockpickOption = screen.getByText('Pick the lock');
    expect(lockpickOption).not.toHaveAttribute('disabled');
  });

  it('should disable option when character lacks required item', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requirements: [
          {
            type: 'item',
            targetId: 'Magic Key',
            operator: 'gte',
            value: 1,
          },
        ],
      },
      {
        id: 'opt-2',
        text: 'Look for another way',
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const magicKeyOption = screen.getByText('Use the magic key');
    const button = screen.getByTestId('choice-option-opt-1');
    expect(button).toHaveAttribute('disabled');
  });

  it('should disable option when character has insufficient quantity', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Bribe with 10 gold coins',
        requirements: [
          {
            type: 'item',
            targetId: 'Gold Coins',
            operator: 'gte',
            value: 10,
          },
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const bribeOption = screen.getByText('Bribe with 10 gold coins');
    expect(bribeOption).toHaveAttribute('disabled');
  });

  it('should show feedback about missing items', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requirements: [
          {
            type: 'item',
            targetId: 'Magic Key',
            operator: 'gte',
            value: 1,
          },
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} showHints={true} inventoryItems={mockInventoryItems} />);

    // Should show indicator that item is missing
    expect(screen.getByText(/Magic Key/i)).toBeInTheDocument();
    expect(screen.getByText(/missing/i)).toBeInTheDocument();
  });

  it('should show feedback about insufficient quantity', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Heal multiple allies',
        requirements: [
          {
            type: 'item',
            targetId: 'Healing Potion',
            operator: 'gte',
            value: 5,
          },
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} showHints={true} inventoryItems={mockInventoryItems} />);

    // Should show current quantity vs required
    expect(screen.getByText(/Healing Potion/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/5/i)).toBeInTheDocument();
  });

  it('should handle multiple item requirements with AND logic', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Craft a healing salve',
        requirements: [
          {
            type: 'item',
            targetId: 'Healing Potion',
            operator: 'gte',
            value: 2,
          },
          {
            type: 'item',
            targetId: 'Lockpick',
            operator: 'gte',
            value: 1,
          },
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    // Should be enabled because character has both items in required quantities
    const craftOption = screen.getByText('Craft a healing salve');
    expect(craftOption).not.toHaveAttribute('disabled');
  });

  it('should disable option if ANY requirement in AND logic fails', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Perform complex ritual',
        requirements: [
          {
            type: 'item',
            targetId: 'Healing Potion',
            operator: 'gte',
            value: 2,
          },
          {
            type: 'item',
            targetId: 'Magic Scroll',
            operator: 'gte',
            value: 1,
          },
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    // Should be disabled because character lacks Magic Scroll
    const ritualOption = screen.getByText('Perform complex ritual');
    expect(ritualOption).toHaveAttribute('disabled');
  });

  it('should prevent selection of disabled options', async () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requirements: [
          {
            type: 'item',
            targetId: 'Magic Key',
            operator: 'gte',
            value: 1,
          },
        ],
      },
    ]);

    const handleSelect = jest.fn();
    render(<ChoiceSelector decision={decision} onSelect={handleSelect} inventoryItems={mockInventoryItems} />);

    const magicKeyOption = screen.getByText('Use the magic key');

    await userEvent.click(magicKeyOption);

    // Should not call onSelect for disabled option
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('should show visual distinction for disabled options', () => {
    const decision = createMockDecision([
      {
        id: 'opt-1',
        text: 'Use the magic key',
        requirements: [
          {
            type: 'item',
            targetId: 'Magic Key',
            operator: 'gte',
            value: 1,
          },
        ],
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
