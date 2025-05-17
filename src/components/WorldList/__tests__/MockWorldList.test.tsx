import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MockWorldList from '../MockWorldList';
import { World } from '../../../types/world.types';

const mockWorlds: World[] = [
  {
    id: '1',
    name: 'World 1',
    description: 'Desc 1',
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
  },
  {
    id: '2',
    name: 'World 2',
    description: 'Desc 2',
    theme: 'Sci-Fi',
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
  },
];

describe('MockWorldList', () => {
  // Test case for normal rendering with worlds
  test('renders a list of WorldCard components when worlds are provided', () => {
    render(
      <MockWorldList 
        worlds={mockWorlds} 
        onSelectWorld={jest.fn()} 
        onDeleteWorld={jest.fn()} 
      />
    );
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('world-card')).toHaveLength(mockWorlds.length);
  });

  // Test case for empty state
  test('renders an empty message when no worlds are provided', () => {
    render(
      <MockWorldList 
        worlds={[]} 
        onSelectWorld={jest.fn()} 
        onDeleteWorld={jest.fn()} 
      />
    );
    expect(screen.getByTestId('world-list-empty-message')).toBeInTheDocument();
    expect(screen.getByText('No worlds created yet. Create your first world to get started.')).toBeInTheDocument();
  });

  // Test case for Play functionality
  test('calls onPlayWorld when Play button is clicked on a world card', () => {
    const mockOnPlayWorld = jest.fn();
    render(
      <MockWorldList 
        worlds={[mockWorlds[0]]} 
        onSelectWorld={jest.fn()} 
        onDeleteWorld={jest.fn()} 
        onPlayWorld={mockOnPlayWorld}
      />
    );
    
    // Find and click the Play button
    const playButton = screen.getByTestId('world-card-actions-play-button');
    fireEvent.click(playButton);
    
    // Verify onPlayWorld was called with the correct world ID
    expect(mockOnPlayWorld).toHaveBeenCalledWith(mockWorlds[0].id);
  });

  // Test case for selection functionality
  test('calls onSelectWorld when a world card is clicked', () => {
    const mockOnSelectWorld = jest.fn();
    render(
      <MockWorldList 
        worlds={[mockWorlds[0]]} 
        onSelectWorld={mockOnSelectWorld} 
        onDeleteWorld={jest.fn()} 
      />
    );
    
    // Find and click the world card (not a button within it)
    const worldCard = screen.getByTestId('world-card');
    fireEvent.click(worldCard);
    
    // Verify onSelectWorld was called with the correct world ID
    expect(mockOnSelectWorld).toHaveBeenCalledWith(mockWorlds[0].id);
  });

  // Test case for delete functionality
  test('calls onDeleteWorld when Delete button is clicked on a world card', () => {
    const mockOnDeleteWorld = jest.fn();
    render(
      <MockWorldList 
        worlds={[mockWorlds[0]]} 
        onSelectWorld={jest.fn()} 
        onDeleteWorld={mockOnDeleteWorld} 
      />
    );
    
    // Find and click the Delete button
    const deleteButton = screen.getByTestId('world-card-actions-delete-button');
    fireEvent.click(deleteButton);
    
    // Verify onDeleteWorld was called with the correct world ID
    expect(mockOnDeleteWorld).toHaveBeenCalledWith(mockWorlds[0].id);
  });
});