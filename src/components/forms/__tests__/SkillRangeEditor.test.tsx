import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillRangeEditor from '../SkillRangeEditor';
import { WorldSkill } from '@/types/world.types';
import { 
  SKILL_MIN_VALUE, 
  SKILL_MAX_VALUE,
  SKILL_LEVEL_DESCRIPTIONS 
} from '@/lib/constants/skillLevelDescriptions';

describe('SkillRangeEditor', () => {
  const mockSkill: WorldSkill = {
    id: 'test-skill-1',
    worldId: 'test-world-1',
    name: 'Test Skill',
    description: 'A test skill',
    difficulty: 'medium',
    baseValue: 3,
    minValue: SKILL_MIN_VALUE,
    maxValue: SKILL_MAX_VALUE,
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
    expect(valueDisplay).toHaveTextContent('3');
  });

  it('shows min and max values', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    // With the current implementation, we now show all tick values 1-5
    const valueLabels = screen.getAllByText(/[0-9]+/);
    
    // We should have all the labels including the current value
    expect(screen.getByText('1')).toBeInTheDocument(); // min
    expect(screen.getByText('5')).toBeInTheDocument(); // max
  });

  it('changes value when slider is moved', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    const slider = screen.getByTestId('skill-range-slider');
    fireEvent.change(slider, { target: { value: '4' } });

    const valueDisplay = screen.getByTestId('current-value');
    expect(valueDisplay).toHaveTextContent('4');
    expect(mockOnChange).toHaveBeenCalledWith({ baseValue: 4 });
  });

  it('clamps values to 1-5 range even if skill has different min/max', () => {
    const legacySkill = {
      ...mockSkill,
      minValue: 0,
      maxValue: 10,
      baseValue: 8,
    };
    
    render(
      <SkillRangeEditor 
        skill={legacySkill} 
        onChange={mockOnChange} 
      />
    );

    // The initial value should be clamped to 5 (the max allowed)
    const valueDisplay = screen.getByTestId('current-value');
    expect(valueDisplay).toHaveTextContent('5');
  });

  it('disables the slider when disabled prop is true', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const slider = screen.getByTestId('skill-range-slider');
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
    
    expect(screen.getByTestId('current-value')).toHaveTextContent('3');
    
    const updatedSkill = { ...mockSkill, baseValue: 4 };
    rerender(
      <SkillRangeEditor 
        skill={updatedSkill} 
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByTestId('current-value')).toHaveTextContent('4');
  });

  it('shows tick marks for each skill level', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
      />
    );

    // Check that we have tick marks for each of the 5 levels
    SKILL_LEVEL_DESCRIPTIONS.forEach((level) => {
      expect(screen.getByTestId(`tick-mark-${level.value}`)).toBeInTheDocument();
    });
  });
  
  it('displays skill level descriptions when showLevelDescriptions is true', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
        showLevelDescriptions={true}
      />
    );

    // Level for value 3 is "Competent"
    expect(screen.getByTestId('skill-level-label')).toHaveTextContent('Competent');
    expect(screen.getByTestId('skill-level-description')).toHaveTextContent('Solid performance in most situations');
  });

  it('updates level description when value changes', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
        showLevelDescriptions={true}
      />
    );

    // Initial level for value 3 is "Competent"
    expect(screen.getByTestId('skill-level-label')).toHaveTextContent('Competent');
    
    // Change to level 5 "Master"
    const slider = screen.getByTestId('skill-range-slider');
    fireEvent.change(slider, { target: { value: '5' } });
    
    expect(screen.getByTestId('skill-level-label')).toHaveTextContent('Master');
    expect(screen.getByTestId('skill-level-description')).toHaveTextContent('Complete mastery at professional level');
  });
});