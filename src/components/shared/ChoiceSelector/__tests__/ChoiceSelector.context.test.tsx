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
    expect(container).toHaveClass('border-4', 'border-gray-500', 'bg-gray-500/10');
  });


  it('applies decision weight container styling', () => {
    render(<ChoiceSelector decision={mockDecisionWithContext} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-4', 'border-gray-500', 'bg-gray-500/10');
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
    expect(container).toHaveClass('border-6', 'border-red-600', 'bg-red-100/20');
  });

  it('applies minor decision weight styling', () => {
    const minorDecision: Decision = {
      ...mockDecisionWithContext,
      decisionWeight: 'minor'
    };

    render(<ChoiceSelector decision={minorDecision} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-2', 'border-gray-500', 'bg-gray-500/5');
  });

  it('defaults to minor weight when not specified', () => {
    const decisionWithoutWeight: Decision = {
      ...mockDecisionWithContext,
      decisionWeight: undefined
    };

    render(<ChoiceSelector decision={decisionWithoutWeight} onSelect={mockOnSelect} />);
    
    const container = screen.getByTestId('choice-selector');
    expect(container).toHaveClass('border-2', 'border-gray-500', 'bg-gray-500/5');
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