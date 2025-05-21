import React from 'react';
import { render, screen } from '@testing-library/react';
import SkillDifficulty from '../SkillDifficulty';
import { SKILL_DIFFICULTIES } from '@/lib/constants/skillDifficultyLevels';

describe('SkillDifficulty', () => {
  test('renders easy difficulty correctly', () => {
    render(<SkillDifficulty difficulty="easy" />);
    const badge = screen.getByTestId('skill-difficulty-badge');
    
    expect(badge).toHaveTextContent('Easy');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });
  
  test('renders medium difficulty correctly', () => {
    render(<SkillDifficulty difficulty="medium" />);
    const badge = screen.getByTestId('skill-difficulty-badge');
    
    expect(badge).toHaveTextContent('Medium');
    expect(badge.className).toContain('bg-blue-100');
    expect(badge.className).toContain('text-blue-800');
  });
  
  test('renders hard difficulty correctly', () => {
    render(<SkillDifficulty difficulty="hard" />);
    const badge = screen.getByTestId('skill-difficulty-badge');
    
    expect(badge).toHaveTextContent('Hard');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-800');
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
  
  test('renders nothing if difficulty is invalid', () => {
    // @ts-expect-error - Testing invalid input
    render(<SkillDifficulty difficulty="invalid" />);
    
    expect(screen.queryByTestId('skill-difficulty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skill-difficulty-badge')).not.toBeInTheDocument();
  });
});