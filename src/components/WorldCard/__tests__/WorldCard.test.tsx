import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCard from '../WorldCard';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { formatDate } from '@/lib/utils';

describe('WorldCard', () => {
  const mockWorld = createMockWorld({
    name: 'Fantasy Realm',
    description: 'A magical world of adventure',
    genre: 'fantasy',
  });

  // Test case for displaying world data (updated to address all acceptance criteria)
  test('displays all required world information', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Verify name is displayed prominently (should be a heading)
    expect(screen.getByRole('heading', { name: mockWorld.name })).toBeInTheDocument();
    
    // Verify description is displayed
    expect(screen.getByText(mockWorld.description)).toBeInTheDocument();
    
    // Verify genre (theme) is displayed
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    
    // Verify timestamp is displayed (check for the formatted date string)
    expect(screen.getByText(`Created: ${formatDate(mockWorld.createdAt)}`)).toBeInTheDocument();
  });

  // Test case for visual presentation
  test('presents information in a clean, readable format', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Verify header contains the name prominently
    const header = screen.getByRole('heading', { name: mockWorld.name });
    expect(header).toBeInTheDocument();
    
    // Verify all essential content is accessible
    expect(screen.getByText(mockWorld.description)).toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    
    // Verify timestamp information is present
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });
  
  // Test case for edge cases in data display
  test('handles missing or incomplete data gracefully', () => {
    const incompleteWorld = createMockWorld({
      description: '',
      genre: 'fantasy',
    });
    
    render(<WorldCard world={incompleteWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Should still render the world name and not crash
    expect(screen.getByRole('heading', { name: incompleteWorld.name })).toBeInTheDocument();
    
    // Should handle empty description gracefully (may not be visible)
    expect(screen.getByText('Fantasy')).toBeInTheDocument(); // Genre should still show
  });

  // Test case for world name navigation
  test('world name links to world detail page', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // World name should be accessible as a heading and the hero link should navigate to detail page
    const worldTitle = screen.getByRole('heading', { name: mockWorld.name });
    expect(worldTitle).toBeInTheDocument();
    
    // The hero link should navigate to the world detail page
    const heroLink = worldTitle.closest('a');
    expect(heroLink).toHaveAttribute('href', `/worlds/${mockWorld.id}`);
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
    expect(mockRouterPush).toHaveBeenCalledWith(`/worlds/${mockWorld.id}/edit`);
  });

  // Test for world type badges
  test('displays correct world type badges', () => {
    const mockOnSelect = jest.fn();
    const mockOnDelete = jest.fn();

    // Test "Set In" world
    const setInWorld = createMockWorld({
      name: 'Star Wars Adventure',
      reference: 'Star Wars',
      relationship: 'set_within'
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
    expect(setBadge).toHaveClass('bg-blue-700', 'text-white');

    // Test "Based On" world
    const basedOnWorld = createMockWorld({
      name: 'Fantasy Adventure',
      reference: 'Lord of the Rings',
      relationship: 'inspired_by'
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
    expect(basedBadge).toHaveClass('bg-green-500', 'text-white');

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
    expect(originalBadge).toHaveClass('bg-gray-700', 'text-white');
  });
});
