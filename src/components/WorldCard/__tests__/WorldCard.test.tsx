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

  // New test for Play functionality (navigates to characters when no characters exist)
  test('sets current world and navigates to characters when Play is clicked', () => {
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
    
    // Verify navigation to characters page (since no characters exist in the world)
    expect(mockRouterPush).toHaveBeenCalledWith(`/characters?worldId=${mockWorld.id}`);
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

  // Test for world type badges
  test('displays correct world type badges', () => {
    const mockOnSelect = jest.fn();
    const mockOnDelete = jest.fn();

    // Test "Set In" world
    const setInWorld = createMockWorld({
      name: 'Star Wars Adventure',
      reference: 'Star Wars',
      relationship: 'set_in'
    });
    const { rerender } = render(
      <WorldCard 
        world={setInWorld} 
        onSelect={mockOnSelect} 
        onDelete={mockOnDelete}
      />
    );
    // Check badge content and styling
    const setBadge = screen.getByTestId('world-card-type');
    expect(setBadge).toHaveTextContent('Set in Star Wars');
    expect(setBadge).toHaveClass('bg-purple-100', 'text-purple-800');

    // Test "Based On" world
    const basedOnWorld = createMockWorld({
      name: 'Fantasy Adventure',
      reference: 'Lord of the Rings',
      relationship: 'based_on'
    });
    rerender(
      <WorldCard 
        world={basedOnWorld} 
        onSelect={mockOnSelect} 
        onDelete={mockOnDelete}
      />
    );
    const basedBadge = screen.getByTestId('world-card-type');
    expect(basedBadge).toHaveTextContent('Inspired by Lord of the Rings');
    expect(basedBadge).toHaveClass('bg-green-100', 'text-green-800');

    // Test Original world (no reference/relationship)
    const originalWorld = createMockWorld({
      name: 'My Custom World',
      reference: undefined,
      relationship: undefined
    });
    rerender(
      <WorldCard 
        world={originalWorld} 
        onSelect={mockOnSelect} 
        onDelete={mockOnDelete}
      />
    );
    const originalBadge = screen.getByTestId('world-card-type');
    expect(originalBadge).toHaveTextContent('Original World');
    expect(originalBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });
});
