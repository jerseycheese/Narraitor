import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CharacterSkillDisplay } from '../CharacterSkillDisplay';

// Mock data matching the character store structure
const mockSkills = [
  {
    id: 'skill-1',
    characterId: 'char-1',
    name: 'Swordsmanship',
    level: 3,
    category: 'combat'
  },
  {
    id: 'skill-2',
    characterId: 'char-1',
    name: 'Stealth',
    level: 2,
    category: 'agility'
  },
  {
    id: 'skill-3',
    characterId: 'char-1',
    name: 'Persuasion',
    level: 4,
    category: 'social'
  }
];

describe('CharacterSkillDisplay', () => {
  test('displays all character skills with names and levels', () => {
    render(<CharacterSkillDisplay skills={mockSkills} />);
    
    // Verify all skills are displayed
    expect(screen.getByText('Swordsmanship')).toBeInTheDocument();
    expect(screen.getByText('Stealth')).toBeInTheDocument();
    expect(screen.getByText('Persuasion')).toBeInTheDocument();
    
    // Verify skill levels are displayed
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('handles empty skills gracefully', () => {
    render(<CharacterSkillDisplay skills={[]} />);
    
    // Should show empty state message
    expect(screen.getByText(/no skills/i)).toBeInTheDocument();
  });

  test('handles skills without categories as general', () => {
    const skillsWithoutCategory = [
      {
        id: 'skill-1',
        characterId: 'char-1',
        name: 'Luck',
        level: 3
        // No category property
      }
    ];
    
    render(<CharacterSkillDisplay skills={skillsWithoutCategory} showCategories={true} />);
    
    // Should show as general category
    expect(screen.getByText(/general skills/i)).toBeInTheDocument();
    expect(screen.getByText('Luck')).toBeInTheDocument();
  });

  test('groups skills by category when provided', () => {
    render(<CharacterSkillDisplay skills={mockSkills} showCategories={true} />);
    
    // Should show category headers
    expect(screen.getByText(/combat/i)).toBeInTheDocument();
    expect(screen.getByText(/agility/i)).toBeInTheDocument();
    expect(screen.getByText(/social/i)).toBeInTheDocument();
  });
});