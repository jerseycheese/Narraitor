import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldBasicInfoForm from '@/components/forms/WorldBasicInfoForm';
import { World } from '@/types/world.types';
import { THEMES } from '@/lib/constants/themes';

describe('WorldBasicInfoForm - MVP Level Tests', () => {
  const mockWorld: World = {
    id: 'world-123',
    name: 'Test World',
    description: 'A test world description',
    theme: 'fantasy',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 25,
      skillPointPool: 30,
    },
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test that basic info fields are displayed with current values
  test('displays all basic info fields with current values', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    // Check if name field is displayed with current value
    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveValue(mockWorld.name);

    // Check if description field is displayed with current value
    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toHaveValue(mockWorld.description);

    // Check if theme field is displayed with current value
    const themeSelect = screen.getByLabelText(/theme/i);
    expect(themeSelect).toHaveValue(mockWorld.theme);
  });

  // Test updating the world name
  test('calls onChange when name is updated', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated World Name' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      name: 'Updated World Name',
    });
  });

  // Test updating the world description
  test('calls onChange when description is updated', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      description: 'Updated description',
    });
  });

  // Test updating the world theme
  test('calls onChange when theme is updated', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    const themeSelect = screen.getByLabelText(/theme/i);
    fireEvent.change(themeSelect, { target: { value: 'sci-fi' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      theme: 'sci-fi',
    });
  });

  // Test that all theme options are available
  test('displays all available theme options', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    const themeSelect = screen.getByLabelText(/theme/i);
    
    // Check that all themes from the constant are available as options
    THEMES.forEach(theme => {
      expect(screen.getByRole('option', { name: theme.label })).toBeInTheDocument();
    });
  });

  // Test section heading
  test('displays correct section heading', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
  });
});
