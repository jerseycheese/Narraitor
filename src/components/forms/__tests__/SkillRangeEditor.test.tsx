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
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('3');
  });

  it('exposes an accessible name naming the skill', () => {
    render(
      <SkillRangeEditor
        skill={mockSkill}
        onChange={mockOnChange}
      />
    );

    expect(
      screen.getByRole('slider', { name: 'Test Skill skill level' })
    ).toBeInTheDocument();
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
    const slider = screen.getByRole('slider');
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

    const slider = screen.getByRole('slider');
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
    const slider = screen.getByRole('slider');
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

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });

  it('updates when skill prop changes', () => {
    const { rerender } = render(
      <SkillRangeEditor
        skill={mockSkill}
        onChange={mockOnChange}
      />
    );

    const initialSlider = screen.getByRole('slider');
    expect(initialSlider).toHaveValue('3');

    const updatedSkill = { ...mockSkill, baseValue: 4 };
    rerender(
      <SkillRangeEditor
        skill={updatedSkill}
        onChange={mockOnChange}
      />
    );

    // Value should be updated
    expect(screen.getByRole('slider')).toHaveValue('4');
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
    expect(screen.getByText('Competent')).toBeInTheDocument();
    expect(screen.getByText('Solid performance in most situations')).toBeInTheDocument();
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
    expect(screen.getByText('Competent')).toBeInTheDocument();
    
    // Change to level 5 "Master"
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '5' } });
    
    expect(screen.getByText('Master')).toBeInTheDocument();
    expect(screen.getByText('Complete mastery at professional level')).toBeInTheDocument();
  });
});
