import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CharacterAttributeDisplay } from '../CharacterAttributeDisplay';

// Mock data matching the character store structure
const mockAttributes = [
  {
    id: 'attr-1',
    characterId: 'char-1',
    name: 'Strength',
    baseValue: 8,
    modifiedValue: 8,
    category: 'physical'
  },
  {
    id: 'attr-2', 
    characterId: 'char-1',
    name: 'Intelligence',
    baseValue: 6,
    modifiedValue: 6,
    category: 'mental'
  },
  {
    id: 'attr-3',
    characterId: 'char-1', 
    name: 'Charisma',
    baseValue: 7,
    modifiedValue: 7,
    category: 'social'
  }
];

describe('CharacterAttributeDisplay', () => {
  test('displays all character attributes with names and values', () => {
    render(<CharacterAttributeDisplay attributes={mockAttributes} />);
    
    // Verify all attributes are displayed
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Charisma')).toBeInTheDocument();
    
    // Verify attribute values are displayed
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('handles empty attributes gracefully', () => {
    render(<CharacterAttributeDisplay attributes={[]} />);
    
    // Should show empty state message
    expect(screen.getByText(/no attributes/i)).toBeInTheDocument();
  });

  test('handles attributes without categories as general', () => {
    const attributesWithoutCategory = [
      {
        id: 'attr-1',
        characterId: 'char-1',
        name: 'Luck',
        baseValue: 5,
        modifiedValue: 5
        // No category property
      }
    ];
    
    render(<CharacterAttributeDisplay attributes={attributesWithoutCategory} showCategories={true} />);
    
    // Should show as general category
    expect(screen.getByText(/general attributes/i)).toBeInTheDocument();
    expect(screen.getByText('Luck')).toBeInTheDocument();
  });

  test('groups attributes by category when provided', () => {
    render(<CharacterAttributeDisplay attributes={mockAttributes} showCategories={true} />);
    
    // Should show category headers
    expect(screen.getByText(/physical/i)).toBeInTheDocument();
    expect(screen.getByText(/mental/i)).toBeInTheDocument();
    expect(screen.getByText(/social/i)).toBeInTheDocument();
  });
});