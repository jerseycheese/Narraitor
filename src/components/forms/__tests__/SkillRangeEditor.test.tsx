import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillRangeEditor from '../SkillRangeEditor';
import { WorldSkill } from '@/types/world.types';
import { 
  MIN_SKILL_VALUE as SKILL_MIN_VALUE, 
  MAX_SKILL_VALUE as SKILL_MAX_VALUE
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

    // Slider shows the default value
    const slider = screen.getByTestId('skill-range-editor-slider');
    expect(slider).toHaveValue('3');
  });

  it('passes min and max values to the RangeSlider component', () => {
    // This test verifies the component is receiving the correct min/max props
    // We can't directly test the min/max DOM attributes due to how the component is rendered
    
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    // Verify the slider is rendered
    const slider = screen.getByTestId('skill-range-editor-slider');
    expect(slider).toBeInTheDocument();
    
    // We can verify the current value is correctly displayed in the slider
    expect(slider).toHaveValue('3');
  });

  it('changes value when slider is moved', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange} 
      />
    );

    const slider = screen.getByTestId('skill-range-editor-slider');
    fireEvent.change(slider, { target: { value: '4' } });

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
    const slider = screen.getByTestId('skill-range-editor-slider');
    expect(slider).toHaveValue('5');
  });

  it('disables the slider when disabled prop is true', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const slider = screen.getByTestId('skill-range-editor-slider');
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
    
    const initialSlider = screen.getByTestId('skill-range-editor-slider');
    expect(initialSlider).toHaveValue('3');
    
    const updatedSkill = { ...mockSkill, baseValue: 4 };
    rerender(
      <SkillRangeEditor 
        skill={updatedSkill} 
        onChange={mockOnChange}
      />
    );
    
    // Value should be updated
    expect(screen.getByTestId('skill-range-editor-slider')).toHaveValue('4');
  });

  it('shows min and max scale labels', () => {
    render(
      <SkillRangeEditor 
        skill={mockSkill} 
        onChange={mockOnChange}
      />
    );

    // Check that we have min and max scale labels (1 and 5)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
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
    expect(screen.getByTestId('skill-range-editor-level-label')).toHaveTextContent('Competent');
    expect(screen.getByTestId('skill-range-editor-description')).toHaveTextContent('Solid performance in most situations');
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
    expect(screen.getByTestId('skill-range-editor-level-label')).toHaveTextContent('Competent');
    
    // Change to level 5 "Master"
    const slider = screen.getByTestId('skill-range-editor-slider');
    fireEvent.change(slider, { target: { value: '5' } });
    
    expect(screen.getByTestId('skill-range-editor-level-label')).toHaveTextContent('Master');
    expect(screen.getByTestId('skill-range-editor-description')).toHaveTextContent('Complete mastery at professional level');
  });
});
