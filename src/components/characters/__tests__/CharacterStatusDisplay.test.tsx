import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CharacterStatusDisplay } from '../CharacterStatusDisplay';

// Mock data matching the character store structure
const mockStatus = {
  hp: 85,
  mp: 40,
  stamina: 75
};

describe('CharacterStatusDisplay', () => {
  test('displays character status values', () => {
    render(<CharacterStatusDisplay status={mockStatus} />);
    
    // Verify status values are displayed
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  test('shows status labels for each stat', () => {
    render(<CharacterStatusDisplay status={mockStatus} />);
    
    // Should show proper labels
    expect(screen.getByText(/health|hp/i)).toBeInTheDocument();
    expect(screen.getByText(/mana|mp/i)).toBeInTheDocument();
    expect(screen.getByText(/stamina/i)).toBeInTheDocument();
  });

  test('handles zero or negative values correctly', () => {
    const lowStatus = {
      hp: 0,
      mp: -5,
      stamina: 10
    };
    
    render(<CharacterStatusDisplay status={lowStatus} />);
    
    // Should display all values including zero and negative
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});