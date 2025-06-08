import React from 'react';
import { render, screen } from '@testing-library/react';
import SkillDifficulty from '../SkillDifficulty';
import { SKILL_DIFFICULTIES } from '@/lib/constants/skillDifficultyLevels';

describe('SkillDifficulty', () => {
  test('renders difficulty levels correctly', () => {
    const { rerender } = render(<SkillDifficulty difficulty="easy" />);
    expect(screen.getByTestId('skill-difficulty-badge')).toHaveTextContent('Easy');
    
    rerender(<SkillDifficulty difficulty="medium" />);
    expect(screen.getByTestId('skill-difficulty-badge')).toHaveTextContent('Medium');
    
    rerender(<SkillDifficulty difficulty="hard" />);
    expect(screen.getByTestId('skill-difficulty-badge')).toHaveTextContent('Hard');
  });
  
  test('does not render description by default', () => {
    render(<SkillDifficulty difficulty="medium" />);
    
    expect(screen.queryByTestId('skill-difficulty-description')).not.toBeInTheDocument();
  });
  
  test('renders description when showDescription is true', () => {
    render(<SkillDifficulty difficulty="medium" showDescription={true} />);
    
    const description = screen.getByTestId('skill-difficulty-description');
    const mediumDifficulty = SKILL_DIFFICULTIES.find(d => d.value === 'medium');
    
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(mediumDifficulty?.description || '');
  });
  
  test('applies custom className', () => {
    render(<SkillDifficulty difficulty="easy" className="custom-class" />);
    
    const component = screen.getByTestId('skill-difficulty');
    expect(component.className).toContain('custom-class');
  });
  
  test('uses custom testId when provided', () => {
    render(<SkillDifficulty difficulty="easy" testId="custom-test-id" />);
    
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('custom-test-id-badge')).toBeInTheDocument();
  });
  
});
