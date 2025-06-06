import React from 'react';
import { render, screen } from '@testing-library/react';
import ChoiceSelector from '../ChoiceSelector';
import { Decision } from '@/types/narrative.types';

describe('ChoiceSelector Context Display', () => {
  const mockDecisionWithContext: Decision = {
    id: 'decision-1',
    prompt: 'What will you do next?',
    contextSummary: 'You have just discovered the ancient map hidden in the library. The town guards are approaching.',
    decisionWeight: 'major',
    options: [
      { id: 'option-1', text: 'Hide the map and pretend to read' },
      { id: 'option-2', text: 'Confront the guards directly' },
      { id: 'option-3', text: 'Try to escape through the window' }
    ]
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays context summary when provided', () => {
    render(<ChoiceSelector decision={mockDecisionWithContext} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('You have just discovered the ancient map hidden in the library. The town guards are approaching.')).toBeInTheDocument();
  });

  it('applies major decision weight styling', () => {
    render(<ChoiceSelector decision={mockDecisionWithContext} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-amber-400', 'bg-amber-50/30');
  });

  it('shows decision weight indicator', () => {
    render(<ChoiceSelector decision={mockDecisionWithContext} onSelect={mockOnSelect} />);
    
    const weightIndicator = screen.getByTestId('decision-weight-indicator');
    expect(weightIndicator).toBeInTheDocument();
    expect(weightIndicator).toHaveClass('bg-amber-500');
  });

  it('displays decision point label', () => {
    render(<ChoiceSelector decision={mockDecisionWithContext} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Decision Point')).toBeInTheDocument();
  });

  it('works without context summary', () => {
    const decisionWithoutContext: Decision = {
      ...mockDecisionWithContext,
      contextSummary: undefined
    };

    render(<ChoiceSelector decision={decisionWithoutContext} onSelect={mockOnSelect} />);
    
    // Should still render without context
    expect(screen.getByText('What will you do next?')).toBeInTheDocument();
    expect(screen.queryByTestId('context-summary')).not.toBeInTheDocument();
  });

  it('applies critical decision weight styling', () => {
    const criticalDecision: Decision = {
      ...mockDecisionWithContext,
      decisionWeight: 'critical'
    };

    render(<ChoiceSelector decision={criticalDecision} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-red-400', 'bg-red-50/30');
    
    const weightIndicator = screen.getByTestId('decision-weight-indicator');
    expect(weightIndicator).toHaveClass('bg-red-500');
  });

  it('applies minor decision weight styling', () => {
    const minorDecision: Decision = {
      ...mockDecisionWithContext,
      decisionWeight: 'minor'
    };

    render(<ChoiceSelector decision={minorDecision} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-blue-300', 'bg-blue-50/30');
    
    const weightIndicator = screen.getByTestId('decision-weight-indicator');
    expect(weightIndicator).toHaveClass('bg-blue-500');
  });

  it('defaults to minor weight when not specified', () => {
    const decisionWithoutWeight: Decision = {
      ...mockDecisionWithContext,
      decisionWeight: undefined
    };

    render(<ChoiceSelector decision={decisionWithoutWeight} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-blue-300', 'bg-blue-50/30');
  });

  it('maintains accessibility with enhanced styling', () => {
    render(<ChoiceSelector decision={mockDecisionWithContext} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveAttribute('role', 'group');
    expect(container).toHaveAttribute('aria-labelledby', 'choices-heading');
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveAttribute('id', 'choices-heading');
  });
});