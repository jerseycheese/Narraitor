import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCard from '../WorldCard';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';

describe('WorldCard', () => {
  const mockWorld = createMockWorld({
    name: 'Fantasy Realm',
    description: 'A magical world of adventure',
    theme: 'High Fantasy',
  });

  // Test case for displaying world data (updated to address all acceptance criteria)
  test('displays all required world information', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Verify name is displayed
    expect(screen.getByTestId('world-card-name')).toHaveTextContent(mockWorld.name);
    
    // Verify description is displayed
    expect(screen.getByTestId('world-card-description')).toHaveTextContent(mockWorld.description);
    
    // Verify genre (theme) is displayed
    expect(screen.getByTestId('world-card-theme')).toHaveTextContent(mockWorld.theme);
    
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
    const incompleteWorld = createMockWorld({
      description: '',
      theme: '',
    });
    
    render(<WorldCard world={incompleteWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Should still render without crashing
    expect(screen.getByTestId('world-card')).toBeInTheDocument();
    
    // Empty description should render empty
    expect(screen.getByTestId('world-card-description')).toHaveTextContent('');
    
    // Empty theme should not render the theme element at all
    expect(screen.queryByTestId('world-card-theme')).not.toBeInTheDocument();
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

  // Test for Edit functionality
  test('navigates to edit page when Edit is clicked', () => {
    // Setup mocks
    const mockRouterPush = jest.fn();
    
    // Directly pass mock dependencies to the component
    render(
      <WorldCard 
        world={mockWorld} 
        onSelect={jest.fn()} 
        onDelete={jest.fn()}
        _router={{ push: mockRouterPush }}
      />
    );
    
    // Find and click the Edit button
    fireEvent.click(screen.getByTestId('world-card-actions-edit-button'));
    
    // Verify navigation to edit page
    expect(mockRouterPush).toHaveBeenCalledWith(`/world/${mockWorld.id}/edit`);
  });
});
