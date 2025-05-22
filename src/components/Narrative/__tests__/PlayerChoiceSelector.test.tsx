import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerChoiceSelector from '../PlayerChoiceSelector';
import { Decision } from '@/types/narrative.types';

describe('PlayerChoiceSelector', () => {
  // Mock decision with options
  const mockDecision: Decision = {
    id: 'decision-1',
    prompt: 'What will you do?',
    options: [
      { id: 'option-1', text: 'Investigate the noise' },
      { id: 'option-2', text: 'Run away' },
      { id: 'option-3', text: 'Call for help' }
    ]
  };

  it('renders the decision prompt and options', () => {
    render(
      <PlayerChoiceSelector 
        decision={mockDecision} 
        onSelect={jest.fn()} 
      />
    );
    
    // Check prompt is rendered
    expect(screen.getByText('What will you do?')).toBeInTheDocument();
    
    // Check all options are rendered
    expect(screen.getByText('Investigate the noise')).toBeInTheDocument();
    expect(screen.getByText('Run away')).toBeInTheDocument();
    expect(screen.getByText('Call for help')).toBeInTheDocument();
  });

  it('calls onSelect when an option is clicked', () => {
    const handleSelect = jest.fn();
    
    render(
      <PlayerChoiceSelector 
        decision={mockDecision} 
        onSelect={handleSelect} 
      />
    );
    
    // Click the first option
    fireEvent.click(screen.getByText('Investigate the noise'));
    
    // Check that onSelect was called with the correct option ID
    expect(handleSelect).toHaveBeenCalledWith('option-1');
  });

  it('disables all options when isDisabled is true', () => {
    render(
      <PlayerChoiceSelector 
        decision={mockDecision} 
        onSelect={jest.fn()} 
        isDisabled={true} 
      />
    );
    
    // Get all option buttons
    const options = screen.getAllByRole('radio');
    
    // Check that all options are disabled
    options.forEach(option => {
      expect(option).toBeDisabled();
    });
  });

  it('highlights the selected option', () => {
    const decisionWithSelection = {
      ...mockDecision,
      selectedOptionId: 'option-2'
    };
    
    render(
      <PlayerChoiceSelector 
        decision={decisionWithSelection} 
        onSelect={jest.fn()} 
      />
    );
    
    // Get option buttons (selected option has "➤ " prefix)
    const selectedOption = screen.getByText('➤ Run away');
    
    // Check that the selected option has the selected styling
    // The selected option text is inside the button, so we check the button itself
    expect(selectedOption).toHaveClass('bg-blue-100');
    expect(selectedOption).toHaveAttribute('aria-checked', 'true');
  });
  
  it('renders option hints when available', () => {
    const decisionWithHints: Decision = {
      id: 'decision-1',
      prompt: 'What will you do?',
      options: [
        { id: 'option-1', text: 'Investigate the noise', hint: 'Might be dangerous' },
        { id: 'option-2', text: 'Run away' }
      ]
    };
    
    render(
      <PlayerChoiceSelector 
        decision={decisionWithHints} 
        onSelect={jest.fn()} 
      />
    );
    
    // Check that the hint is rendered
    expect(screen.getByText('Might be dangerous')).toBeInTheDocument();
  });
  
  it('returns null when there are no options', () => {
    const emptyDecision: Decision = {
      id: 'empty-decision',
      prompt: 'Empty prompt',
      options: []
    };
    
    const { container } = render(
      <PlayerChoiceSelector 
        decision={emptyDecision} 
        onSelect={jest.fn()} 
      />
    );
    
    // Container should be empty
    expect(container.firstChild).toBeNull();
  });
});