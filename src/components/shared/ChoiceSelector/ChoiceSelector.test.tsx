import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoiceSelector, { SimpleChoice } from './ChoiceSelector';
import { Decision } from '@/types/narrative.types';

describe('ChoiceSelector', () => {
  const mockOnSelect = jest.fn();
  const mockOnCustomSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('Basic functionality', () => {
    it('renders simple choices correctly', () => {
      render(<ChoiceSelector choices={simpleChoices} onSelect={mockOnSelect} />);
      
      expect(screen.getByText('Go north')).toBeInTheDocument();
      expect(screen.getByText('Go south')).toBeInTheDocument();
      expect(screen.getByText('Rest here')).toBeInTheDocument();
    });

    it('renders decision with hints correctly', () => {
      render(<ChoiceSelector decision={decision} onSelect={mockOnSelect} showHints />);
      
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Requires courage')).toBeInTheDocument();
      expect(screen.getByText('Defend')).toBeInTheDocument();
      expect(screen.getByText('Safe option')).toBeInTheDocument();
    });

    it('calls onSelect when choice is clicked', async () => {
      const user = userEvent.setup();
      render(<ChoiceSelector choices={simpleChoices} onSelect={mockOnSelect} />);
      
      await user.click(screen.getByText('Go north'));
      expect(mockOnSelect).toHaveBeenCalledWith('choice-1');
    });
  });

  describe('Custom input functionality', () => {
    it('shows custom input field when enableCustomInput is true', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      expect(screen.getByPlaceholderText('Type your custom response...')).toBeInTheDocument();
    });

    it('does not show custom input field when enableCustomInput is false', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput={false}
        />
      );
      
      expect(screen.queryByPlaceholderText('Type your custom response...')).not.toBeInTheDocument();
    });

    it('shows custom input field at the top before choices', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const customInput = screen.getByPlaceholderText('Type your custom response...');
      const firstChoice = screen.getByText('Go north');
      
      // Custom input should appear before the first choice in DOM order
      expect(customInput.compareDocumentPosition(firstChoice)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('shows text input and submit button by default', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      expect(screen.getByPlaceholderText('Type your custom response...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('allows typing in the input field', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      await user.type(input, 'Hello world');
      
      expect(input).toHaveValue('Hello world');
    });

    it('shows character count as user types', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      await user.type(input, 'Hello world');
      
      expect(screen.getByText('11/250')).toBeInTheDocument();
    });

    it('enforces character limit of 250 characters', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      const longText = 'a'.repeat(300);
      await user.type(input, longText);
      
      expect(input).toHaveValue('a'.repeat(250));
      expect(screen.getByText('250/250')).toBeInTheDocument();
    });

    it('shows warning when approaching character limit', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      const nearLimitText = 'a'.repeat(240);
      await user.type(input, nearLimitText);
      
      const characterCount = screen.getByText('240/250');
      expect(characterCount).toHaveClass('text-amber-600');
    });

    it('submits custom input when submit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      await user.type(input, 'My custom action');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      expect(mockOnCustomSubmit).toHaveBeenCalledWith('My custom action');
    });

    it('submits custom input when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      await user.type(input, 'My custom action{enter}');
      
      expect(mockOnCustomSubmit).toHaveBeenCalledWith('My custom action');
    });

    it('creates newline when Shift+Enter is pressed without submitting', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      await user.type(input, 'Line 1{shift>}{enter}Line 2');
      
      // Should not submit
      expect(mockOnCustomSubmit).not.toHaveBeenCalled();
      // Should have both lines with newline character
      expect(input).toHaveValue('Line 1\nLine 2');
    });

    it('does not submit empty custom input', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      expect(mockOnCustomSubmit).not.toHaveBeenCalled();
    });

    it('does not submit whitespace-only custom input', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      await user.type(input, '   ');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      expect(mockOnCustomSubmit).not.toHaveBeenCalled();
    });

    it('clears input field after successful submission', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      await user.type(input, 'My custom action');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      // Wait for the component to update
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      expect(screen.getByText('0/250')).toBeInTheDocument();
    });

    it('input field remains visible when predefined choice is selected', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      // Input should be visible from the start
      expect(screen.getByPlaceholderText('Type your custom response...')).toBeInTheDocument();
      
      // Selecting a predefined choice should not hide the input
      await user.click(screen.getByText('Go north'));
      expect(screen.getByPlaceholderText('Type your custom response...')).toBeInTheDocument();
      expect(mockOnSelect).toHaveBeenCalledWith('choice-1');
    });

    it('uses custom placeholder text when provided', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
          customInputPlaceholder="Describe your action..."
        />
      );
      
      expect(screen.getByPlaceholderText('Describe your action...')).toBeInTheDocument();
    });

    it('uses custom character limit when provided', async () => {
      const user = userEvent.setup();
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
          maxCustomLength={100}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      
      await user.type(input, 'test');
      
      expect(screen.getByText('4/100')).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('disables all choices including custom input when isDisabled is true', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
          isDisabled
        />
      );
      
      const customInput = screen.getByPlaceholderText('Type your custom response...');
      expect(customInput).toBeDisabled();
      
      simpleChoices.forEach(choice => {
        const option = screen.getByText(choice.text);
        expect(option.closest('button')).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for custom input', () => {
      render(
        <ChoiceSelector 
          choices={simpleChoices} 
          onSelect={mockOnSelect}
          enableCustomInput
          onCustomSubmit={mockOnCustomSubmit}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your custom response...');
      expect(input).toHaveAttribute('aria-label', 'Custom response input');
    });
  });
});