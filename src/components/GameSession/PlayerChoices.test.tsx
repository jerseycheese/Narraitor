import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerChoices from './PlayerChoices';

describe('PlayerChoices', () => {
  const mockOnChoiceSelected = jest.fn();
  const mockChoices = [
    { id: 'choice-1', text: 'Talk to the mysterious figure' },
    { id: 'choice-2', text: 'Order a drink' },
    { id: 'choice-3', text: 'Leave the tavern' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all player choices', () => {
    render(
      <PlayerChoices 
        choices={mockChoices} 
        onChoiceSelected={mockOnChoiceSelected}
      />
    );

    expect(screen.getByText('Talk to the mysterious figure')).toBeInTheDocument();
    expect(screen.getByText('Order a drink')).toBeInTheDocument();
    expect(screen.getByText('Leave the tavern')).toBeInTheDocument();
  });

  test('calls onChoiceSelected when a choice is clicked', () => {
    render(
      <PlayerChoices 
        choices={mockChoices} 
        onChoiceSelected={mockOnChoiceSelected}
      />
    );

    const firstChoice = screen.getByRole('radio', { name: /Talk to the mysterious figure/ });
    fireEvent.click(firstChoice);

    expect(mockOnChoiceSelected).toHaveBeenCalledWith('choice-1');
  });

  test('renders with disabled state', () => {
    render(
      <PlayerChoices 
        choices={mockChoices} 
        onChoiceSelected={mockOnChoiceSelected}
        isDisabled={true}
      />
    );

    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toBeDisabled();
    });
  });

  test('renders empty state when no choices provided', () => {
    render(
      <PlayerChoices 
        choices={[]} 
        onChoiceSelected={mockOnChoiceSelected}
      />
    );

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  test('shows selected state for choices', () => {
    const choicesWithSelection = [
      { id: 'choice-1', text: 'Talk to the mysterious figure', isSelected: true },
      { id: 'choice-2', text: 'Order a drink', isSelected: false }
    ];

    render(
      <PlayerChoices 
        choices={choicesWithSelection} 
        onChoiceSelected={mockOnChoiceSelected}
      />
    );

    const selectedChoice = screen.getByRole('radio', { name: /Talk to the mysterious figure/ });
    expect(selectedChoice).toHaveAttribute('aria-checked', 'true');
  });
});