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
          <div aria-label="World preview">
            Name: {worldData.name || 'Not set'} | 
            Genre: {worldData.genre} | 
            Description: {worldData.description || 'Not set'}
          </div>
        </div>
      );
    };

    render(<TestWrapper />);

    // Initially should show empty values
    expect(screen.getByLabelText('World preview')).toHaveTextContent('Name: Not set');
    expect(screen.getByLabelText('World preview')).toHaveTextContent('Genre: fantasy');

    // Change name
    fireEvent.change(screen.getByPlaceholderText(/enter your world's name/i), {
      target: { value: 'My New World' },
    });
    expect(screen.getByLabelText('World preview')).toHaveTextContent('Name: My New World');

    // Change genre
    const genreSelect = screen.getByTestId('world-genre-select');
    fireEvent.change(genreSelect, {
      target: { value: 'sci-fi' },
    });
    expect(screen.getByLabelText('World preview')).toHaveTextContent('Genre: sci-fi');
  });

  test('renders with valid data', () => {
    render(
      <BasicInfoStep
        worldData={{
          name: 'Valid World Name',
          genre: 'fantasy',
        }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByDisplayValue('Valid World Name')).toBeInTheDocument();
    const genreSelect = screen.getByTestId('world-genre-select');
    expect(genreSelect).toHaveValue('fantasy');
  });

  test('displays error messages for invalid inputs', () => {
    const errors = {
      name: 'Name is too short',
    };

    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Name is too short')).toBeInTheDocument();
  });

});
