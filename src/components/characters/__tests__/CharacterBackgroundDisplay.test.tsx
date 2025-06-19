import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CharacterBackgroundDisplay } from '../CharacterBackgroundDisplay';

// Mock data matching the character store structure
const mockBackground = {
  history: 'A brave warrior from the northern lands.',
  personality: 'Bold and honorable, with a quick temper.',
  goals: ['To protect the innocent and restore peace.'],
  fears: ['Losing loved ones', 'Failing in duty'],
  physicalDescription: 'Tall and muscular with distinctive scars.'
};

describe('CharacterBackgroundDisplay', () => {
  test('displays all background information when provided', () => {
    render(<CharacterBackgroundDisplay background={mockBackground} />);
    
    // Verify all background sections are displayed
    expect(screen.getByText('A brave warrior from the northern lands.')).toBeInTheDocument();
    expect(screen.getByText('Bold and honorable, with a quick temper.')).toBeInTheDocument();
    expect(screen.getByText('To protect the innocent and restore peace.')).toBeInTheDocument();
    expect(screen.getByText('Losing loved ones')).toBeInTheDocument();
    expect(screen.getByText('Failing in duty')).toBeInTheDocument();
    expect(screen.getByText('Tall and muscular with distinctive scars.')).toBeInTheDocument();
  });

  test('handles missing physical description gracefully', () => {
    const backgroundWithoutPhysical = {
      history: 'A brave warrior from the northern lands.',
      personality: 'Bold and honorable, with a quick temper.',
      goals: ['To protect the innocent and restore peace.'],
      fears: ['Losing loved ones']
    };
    
    render(<CharacterBackgroundDisplay background={backgroundWithoutPhysical} />);
    
    // Should still display other information
    expect(screen.getByText('A brave warrior from the northern lands.')).toBeInTheDocument();
    expect(screen.getByText('Bold and honorable, with a quick temper.')).toBeInTheDocument();
    expect(screen.getByText('To protect the innocent and restore peace.')).toBeInTheDocument();
    expect(screen.getByText('Losing loved ones')).toBeInTheDocument();
    
    // Should not show physical description section
    expect(screen.queryByText('Tall and muscular with distinctive scars.')).not.toBeInTheDocument();
  });

  test('shows section headers for each background component', () => {
    render(<CharacterBackgroundDisplay background={mockBackground} />);
    
    // Should show proper section organization with new field names
    expect(screen.getByText(/history/i)).toBeInTheDocument();
    expect(screen.getByText(/personality/i)).toBeInTheDocument();
    expect(screen.getByText(/goals.*motivations/i)).toBeInTheDocument();
    expect(screen.getByText(/fears/i)).toBeInTheDocument();
    expect(screen.getByText(/physical/i)).toBeInTheDocument();
  });
});
