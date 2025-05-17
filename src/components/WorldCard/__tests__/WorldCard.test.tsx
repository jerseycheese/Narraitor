import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCard from '../WorldCard';
import { World } from '../../../types/world.types';

// No need to mock dependencies anymore
// We'll pass them directly to the component

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
  // Test case for displaying world data (updated to address all acceptance criteria)
  test('displays all required world information', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Verify name is displayed
    expect(screen.getByTestId('world-card-name')).toHaveTextContent(mockWorld.name);
    
    // Verify description is displayed
    expect(screen.getByTestId('world-card-description')).toHaveTextContent(mockWorld.description);
    
    // Verify genre (theme) is displayed
    expect(screen.getByTestId('world-card-theme')).toHaveTextContent(`Theme: ${mockWorld.theme}`);
    
    // Verify timestamps are displayed
    expect(screen.getByTestId('world-card-createdAt')).toHaveTextContent(`Created: ${new Date(mockWorld.createdAt).toLocaleDateString()}`);
    expect(screen.getByTestId('world-card-updatedAt')).toHaveTextContent(`Updated: ${new Date(mockWorld.updatedAt).toLocaleDateString()}`);
  });

  // Test case for visual presentation
  test('presents information in a clean, readable format', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Verify key elements are present in the proper structure
    const card = screen.getByTestId('world-card');
    expect(card).toBeInTheDocument();
    
    // Verify header contains the name
    const header = screen.getByRole('heading', { name: mockWorld.name });
    expect(header).toBeInTheDocument();
    
    // Verify footer contains timestamps
    const footer = card.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(/Created:.*Updated:/);
  });
  
  // Test case for edge cases in data display
  test('handles missing or incomplete data gracefully', () => {
    const incompleteWorld: World = {
      ...mockWorld,
      description: '',
      theme: '',
    };
    
    render(<WorldCard world={incompleteWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Should still render without crashing
    expect(screen.getByTestId('world-card')).toBeInTheDocument();
    
    // Empty description should render empty
    expect(screen.getByTestId('world-card-description')).toHaveTextContent('');
    
    // Empty theme should still show "Theme:" (without space after colon)
    expect(screen.getByTestId('world-card-theme')).toHaveTextContent('Theme:');
  });

  // Test case for triggering selection
  test('calls onSelect when clicked', () => {
    const mockOnSelect = jest.fn();
    render(<WorldCard world={mockWorld} onSelect={mockOnSelect} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTestId('world-card')); // Assuming the card itself is clickable
    expect(mockOnSelect).toHaveBeenCalledWith(mockWorld.id);
  });

  // New test for Play functionality
  test('sets current world and navigates to game session when Play is clicked', () => {
    // Setup mocks
    const mockSetCurrentWorld = jest.fn();
    const mockRouterPush = jest.fn();
    
    // Directly pass mock dependencies to the component
    render(
      <WorldCard 
        world={mockWorld} 
        onSelect={jest.fn()} 
        onDelete={jest.fn()}
        _storeActions={{ setCurrentWorld: mockSetCurrentWorld }}
        _router={{ push: mockRouterPush }}
      />
    );
    
    // Find and click the Play button
    fireEvent.click(screen.getByTestId('world-card-actions-play-button'));
    
    // Verify world is set as current world
    expect(mockSetCurrentWorld).toHaveBeenCalledWith(mockWorld.id);
    
    // Verify navigation to game session page
    expect(mockRouterPush).toHaveBeenCalledWith(`/world/${mockWorld.id}/play`);
  });
});
