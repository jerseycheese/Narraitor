import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCard from '../WorldCard';

import { World } from '../../../types/world.types';

const mockWorld: World = {
  id: '1',
  name: 'Test World',
  description: 'This is a test world.', // Ensure description is always a string
  theme: 'Fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z',
};

describe('WorldCard', () => {
  // Test case for displaying world data
  test('renders world data correctly', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByTestId('world-card-name')).toHaveTextContent(mockWorld.name);
    expect(screen.getByTestId('world-card-description')).toHaveTextContent(mockWorld.description || ''); // Handle potential undefined description
    expect(screen.getByTestId('world-card-theme')).toHaveTextContent(mockWorld.theme);
    // Add checks for createdAt and updatedAt if they are displayed
  });

  // Test case for triggering selection
  test('calls onSelect when clicked', () => {
    const mockOnSelect = jest.fn();
    render(<WorldCard world={mockWorld} onSelect={mockOnSelect} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTestId('world-card')); // Assuming the card itself is clickable
    expect(mockOnSelect).toHaveBeenCalledWith(mockWorld.id);
  });
});
