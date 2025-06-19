import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChoiceSelector from '../ChoiceSelector';
import { Decision } from '@/types/narrative.types';

describe('ChoiceSelector - Alignment Styling', () => {
  const mockOnSelect = jest.fn();
  const mockOnCustomSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const alignedDecision: Decision = {
    id: 'test-decision',
    prompt: 'What will you do?',
    options: [
      {
        id: 'lawful-option',
        text: 'Follow the rules',
        alignment: 'lawful'
      },
      {
        id: 'neutral-option',
        text: 'Consider your options',
        alignment: 'neutral'
      },
      {
        id: 'chaotic-option',
        text: 'Act unpredictably',
        alignment: 'chaotic'
      }
    ]
  };

  it('should apply lawful styling to lawful choices', () => {
    render(
      <ChoiceSelector
        decision={alignedDecision}
        onSelect={mockOnSelect}
      />
    );

    const lawfulButton = screen.getByTestId('choice-option-lawful-option');
    expect(lawfulButton).toHaveClass('bg-blue-50', 'border-blue-300', 'hover:bg-blue-100');
  });

  it('should apply chaotic styling to chaotic choices', () => {
    render(
      <ChoiceSelector
        decision={alignedDecision}
        onSelect={mockOnSelect}
      />
    );

    const chaoticButton = screen.getByTestId('choice-option-chaotic-option');
    expect(chaoticButton).toHaveClass('bg-red-50', 'border-red-300', 'hover:bg-red-100');
  });

  it('should apply neutral styling to neutral choices', () => {
    render(
      <ChoiceSelector
        decision={alignedDecision}
        onSelect={mockOnSelect}
      />
    );

    const neutralButton = screen.getByTestId('choice-option-neutral-option');
    expect(neutralButton).toHaveClass('bg-white', 'border-gray-200', 'hover:bg-gray-50');
  });

  it('should default to neutral styling when alignment is undefined', () => {
    const decisionWithoutAlignment: Decision = {
      id: 'test-decision',
      prompt: 'What will you do?',
      options: [
        {
          id: 'no-alignment-option',
          text: 'Do something'
          // No alignment property
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={decisionWithoutAlignment}
        onSelect={mockOnSelect}
      />
    );

    const button = screen.getByTestId('choice-option-no-alignment-option');
    expect(button).toHaveClass('bg-white', 'border-gray-200', 'hover:bg-gray-50');
  });

  it('should override alignment styling when option is selected', () => {
    const selectedDecision: Decision = {
      ...alignedDecision,
      selectedOptionId: 'lawful-option'
    };

    render(
      <ChoiceSelector
        decision={selectedDecision}
        onSelect={mockOnSelect}
      />
    );

    const selectedButton = screen.getByTestId('choice-option-lawful-option');
    // Selected styling should override alignment styling
    expect(selectedButton).toHaveClass('bg-blue-100', 'border-blue-500', 'font-bold');
    expect(selectedButton).not.toHaveClass('bg-blue-50', 'border-blue-300');
  });

  it('should maintain alignment styling when other options are not selected', () => {
    const selectedDecision: Decision = {
      ...alignedDecision,
      selectedOptionId: 'lawful-option'
    };

    render(
      <ChoiceSelector
        decision={selectedDecision}
        onSelect={mockOnSelect}
      />
    );

    // Non-selected options should keep their alignment styling
    const neutralButton = screen.getByTestId('choice-option-neutral-option');
    expect(neutralButton).toHaveClass('bg-white', 'border-gray-200', 'hover:bg-gray-50');

    const chaoticButton = screen.getByTestId('choice-option-chaotic-option');
    expect(chaoticButton).toHaveClass('bg-red-50', 'border-red-300', 'hover:bg-red-100');
  });

  it('should show custom input field when enabled', () => {
    render(
      <ChoiceSelector
        decision={alignedDecision}
        onSelect={mockOnSelect}
        enableCustomInput={true}
        onCustomSubmit={mockOnCustomSubmit}
      />
    );

    const customInput = screen.getByLabelText('Custom response input');
    expect(customInput).toBeInTheDocument();
    
    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeInTheDocument();
  });

  it('should handle mixed alignment combinations correctly', () => {
    const mixedDecision: Decision = {
      id: 'test-decision',
      prompt: 'Choose your approach',
      options: [
        {
          id: 'chaotic-1',
          text: 'Chaotic option 1',
          alignment: 'chaotic'
        },
        {
          id: 'lawful-1',
          text: 'Lawful option 1',
          alignment: 'lawful'
        },
        {
          id: 'chaotic-2',
          text: 'Chaotic option 2',
          alignment: 'chaotic'
        },
        {
          id: 'lawful-2',
          text: 'Lawful option 2',
          alignment: 'lawful'
        }
      ]
    };

    render(
      <ChoiceSelector
        decision={mixedDecision}
        onSelect={mockOnSelect}
      />
    );

    // Both chaotic options should have chaotic styling
    expect(screen.getByTestId('choice-option-chaotic-1')).toHaveClass('bg-red-50');
    expect(screen.getByTestId('choice-option-chaotic-2')).toHaveClass('bg-red-50');

    // Both lawful options should have lawful styling
    expect(screen.getByTestId('choice-option-lawful-1')).toHaveClass('bg-blue-50');
    expect(screen.getByTestId('choice-option-lawful-2')).toHaveClass('bg-blue-50');
  });

  it('should maintain accessibility attributes with alignment styling', () => {
    render(
      <ChoiceSelector
        decision={alignedDecision}
        onSelect={mockOnSelect}
      />
    );

    const lawfulButton = screen.getByTestId('choice-option-lawful-option');
    expect(lawfulButton).toHaveAttribute('role', 'radio');
    expect(lawfulButton).toHaveAttribute('aria-checked', 'false');
    
    // Click the button
    fireEvent.click(lawfulButton);
    expect(mockOnSelect).toHaveBeenCalledWith('lawful-option');
  });

  it('should apply disabled styling correctly with alignment', () => {
    render(
      <ChoiceSelector
        decision={alignedDecision}
        onSelect={mockOnSelect}
        isDisabled={true}
      />
    );

    const lawfulButton = screen.getByTestId('choice-option-lawful-option');
    expect(lawfulButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(lawfulButton).toHaveClass('bg-blue-50'); // Should still have alignment styling
    expect(lawfulButton).toBeDisabled();
  });

  it('should handle simple choices with default neutral alignment', () => {
    const simpleChoices = [
      { id: 'choice-1', text: 'First choice' },
      { id: 'choice-2', text: 'Second choice' }
    ];

    render(
      <ChoiceSelector
        choices={simpleChoices}
        onSelect={mockOnSelect}
      />
    );

    // Simple choices should get neutral styling
    expect(screen.getByTestId('choice-option-choice-1')).toHaveClass('bg-white', 'border-gray-200');
    expect(screen.getByTestId('choice-option-choice-2')).toHaveClass('bg-white', 'border-gray-200');
  });
});
