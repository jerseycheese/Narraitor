import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BasicInfoStep from './BasicInfoStep';
import { World } from '@/types/world.types';

describe('BasicInfoStep', () => {
  const mockWorldData: Partial<World> = {
    name: '',
    description: '',
    genre: 'fantasy',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all required form fields', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByPlaceholderText(/enter your world's name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/provide a brief description/i)).toBeInTheDocument();
    // Genre select - using test ID as fallback since component doesn't have proper label
    expect(screen.getByTestId('world-genre-select')).toBeInTheDocument();
  });

  test('displays error for world name when provided', () => {
    // Since BasicInfoStep no longer handles validation directly,
    // we test that errors passed in are displayed correctly
    const errors = { name: 'World name must be at least 3 characters' };
    
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'ab' }}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    // Should display the error
    expect(screen.getByText('World name must be at least 3 characters')).toBeInTheDocument();
  });

  test('displays error for description when provided', () => {
    // Since BasicInfoStep no longer handles validation directly,
    // we test that errors passed in are displayed correctly
    const errors = { description: 'Description must be at least 10 characters' };
    
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'Valid Name', description: 'Too short' }}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    // Should display the error
    expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
  });

  test('updates world data through form interactions', () => {
    const TestWrapper = () => {
      const [worldData, setWorldData] = React.useState(mockWorldData);
      
      return (
        <div>
          <BasicInfoStep
            worldData={worldData}
            errors={{}}
            onUpdate={setWorldData}
          />
          <div data-testid="world-preview">
            Name: {worldData.name || 'Not set'} | 
            Genre: {worldData.genre} | 
            Description: {worldData.description || 'Not set'}
          </div>
        </div>
      );
    };

    render(<TestWrapper />);

    // Initially should show empty values
    expect(screen.getByTestId('world-preview')).toHaveTextContent('Name: Not set');
    expect(screen.getByTestId('world-preview')).toHaveTextContent('Genre: fantasy');

    // Change name
    fireEvent.change(screen.getByPlaceholderText(/enter your world's name/i), {
      target: { value: 'My New World' },
    });
    expect(screen.getByTestId('world-preview')).toHaveTextContent('Name: My New World');

    // Change description
    fireEvent.change(screen.getByPlaceholderText(/provide a brief description/i), {
      target: { value: 'A detailed description' },
    });
    expect(screen.getByTestId('world-preview')).toHaveTextContent('Description: A detailed description');

    // Change genre
    const genreSelect = screen.getByTestId('world-genre-select');
    fireEvent.change(genreSelect, {
      target: { value: 'sci-fi' },
    });
    expect(screen.getByTestId('world-preview')).toHaveTextContent('Genre: sci-fi');
  });

  test('renders with valid data', () => {
    render(
      <BasicInfoStep
        worldData={{
          name: 'Valid World Name',
          description: 'This is a valid description for our world',
          genre: 'fantasy',
        }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByDisplayValue('Valid World Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a valid description for our world')).toBeInTheDocument();
    // Check that genre select has the correct value
    const genreSelect = screen.getByTestId('world-genre-select');
    expect(genreSelect).toHaveValue('fantasy');
  });

  test('displays error messages for invalid inputs', () => {
    const errors = {
      name: 'Name is too short',
      description: 'Description is required',
    };

    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Name is too short')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  test('allows entering all basic info fields', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Test all inputs are functional
    const nameInput = screen.getByPlaceholderText(/enter your world's name/i);
    const descriptionTextarea = screen.getByPlaceholderText(/provide a brief description/i);
    const genreSelect = screen.getByTestId('world-genre-select');

    expect(nameInput).toBeEnabled();
    expect(descriptionTextarea).toBeEnabled();
    expect(genreSelect).toBeEnabled();
  });

  test('genre dropdown has options', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const genreSelect = screen.getByTestId('world-genre-select');
    const options = genreSelect.querySelectorAll('option');

    // Just verify dropdown has multiple options available
    expect(options.length).toBeGreaterThan(1);
  });

  test('preserves field values when re-rendered', () => {
    const { rerender } = render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Update values - use placeholder text to target the right input
    const nameInput = screen.getByPlaceholderText(/enter your world's name/i);
    fireEvent.change(nameInput, {
      target: { value: 'Test World' },
    });

    // Re-render with updated data
    rerender(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'Test World' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Value should be preserved
    expect(screen.getByDisplayValue('Test World')).toBeInTheDocument();
  });

});
