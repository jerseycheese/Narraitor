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

    // Current value is displayed in a span with data-testid
    const valueDisplay = screen.getByTestId('current-value');
    expect(valueDisplay).toBeInTheDocument();
  });

  it('shows min and max values on slider', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    // Check for min/max on the input element
    const slider = screen.getByTestId('skill-range-slider');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '5');
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

    // Current value is displayed in a span with data-testid
    const valueDisplay = screen.getByTestId('current-value');
    expect(valueDisplay).toBeInTheDocument();
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
    expect(valueDisplay).toBeInTheDocument();
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
    
    const initialValueDisplay = screen.getByTestId('current-value');
    expect(initialValueDisplay).toHaveTextContent('3');
    
    const updatedSkill = { ...mockSkill, baseValue: 4 };
    rerender(
      <SkillRangeEditor 
        skill={updatedSkill} 
        onChange={mockOnChange}
      />
    );
    
    // Value should be updated
    expect(screen.getByTestId('current-value')).toHaveTextContent('4');
  });

  it('shows min and max level labels', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
      />
    );

    // Check that we have min and max labels
    expect(screen.getByTestId('level-label-1')).toBeInTheDocument();
    expect(screen.getByTestId('level-label-5')).toBeInTheDocument();
    
    // Should contain the label text
    expect(screen.getByText(/1 - Novice/)).toBeInTheDocument();
    expect(screen.getByText(/5 - Master/)).toBeInTheDocument();
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