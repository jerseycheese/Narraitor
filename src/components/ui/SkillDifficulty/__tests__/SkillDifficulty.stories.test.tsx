import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../SkillDifficulty.stories';

// Compose all stories from the stories file
const { InContext } = composeStories(stories);

describe('SkillDifficulty Stories', () => {
  test('InContext story uses "Difficulty" terminology consistently', () => {
    render(<InContext />);
    
    // Should display "Difficulty" labels for consistency
    const difficultyLabels = screen.getAllByText(/Difficulty:/);
    expect(difficultyLabels).toHaveLength(3); // Three skills in the context story
    
    // Should NOT display "Learning Curve" terminology
    expect(screen.queryByText(/Learning Curve:/)).not.toBeInTheDocument();
  });

  test('story displays all required skill information with consistent terminology', () => {
    render(<InContext />);
    
    // Verify skill names are displayed
    expect(screen.getByText('Skill: Arcane Mastery')).toBeInTheDocument();
    expect(screen.getByText('Skill: Animal Handling')).toBeInTheDocument();
    expect(screen.getByText('Skill: Observation')).toBeInTheDocument();
    
    // Verify descriptions are displayed
    expect(screen.getByText('The ability to manipulate magical energies')).toBeInTheDocument();
    expect(screen.getByText('Calming and controlling animals')).toBeInTheDocument();
    expect(screen.getByText('Noticing details in your surroundings')).toBeInTheDocument();
    
    // Verify consistent use of "Difficulty" label
    const difficultyLabels = screen.getAllByText(/Difficulty:/);
    expect(difficultyLabels.length).toBeGreaterThan(0);
  });
});