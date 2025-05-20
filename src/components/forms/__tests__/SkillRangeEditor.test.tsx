import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillRangeEditor from '../SkillRangeEditor';
import { WorldSkill } from '@/types/world.types';

describe('SkillRangeEditor', () => {
  const mockSkill: WorldSkill = {
    id: 'test-skill-1',
    worldId: 'test-world-1',
    name: 'Test Skill',
    description: 'A test skill',
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the correct default value', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    const valueDisplay = screen.getByTestId('current-value');
    expect(valueDisplay).toHaveTextContent('5');
  });

  it('shows min and max values', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    const valueLabels = screen.getAllByText(/[0-9]+/);
    expect(valueLabels).toHaveLength(3); // min, current, max
    expect(valueLabels[1]).toHaveTextContent('1'); // min
    expect(valueLabels[2]).toHaveTextContent('10'); // max
  });

  it('changes value when slider is moved', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '8' } });

    const valueDisplay = screen.getByTestId('current-value');
    expect(valueDisplay).toHaveTextContent('8');
    expect(mockOnChange).toHaveBeenCalledWith({ baseValue: 8 });
  });

  it('clamps values to min/max range', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    const slider = screen.getByRole('slider');
    
    // Test value below minimum
    fireEvent.change(slider, { target: { value: '-5' } });
    expect(mockOnChange).toHaveBeenCalledWith({ baseValue: 1 });
    
    // Test value above maximum
    fireEvent.change(slider, { target: { value: '15' } });
    expect(mockOnChange).toHaveBeenCalledWith({ baseValue: 10 });
  });

  it('disables the slider when disabled prop is true', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });

  it('hides labels when showLabels is false', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
        showLabels={false}
      />
    );

    expect(screen.queryByText('Default Value')).not.toBeInTheDocument();
  });

  it('updates when skill prop changes', () => {
    const { rerender } = render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByTestId('current-value')).toHaveTextContent('5');
    
    const updatedSkill = { ...mockSkill, baseValue: 7 };
    rerender(
      <SkillRangeEditor 
        skill={updatedSkill} 
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByTestId('current-value')).toHaveTextContent('7');
  });
});