import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldBasicInfoForm from '@/components/forms/WorldBasicInfoForm';
import { World } from '@/types/world.types';

describe('WorldBasicInfoForm - MVP Level Tests', () => {
  const mockWorld: World = {
    id: 'world-123',
    name: 'Test World',
    description: 'A test world description',
    genre: 'fantasy',
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

    // Check if genre field is displayed with current value
    const genreSelect = screen.getByLabelText(/genre/i);
    expect(genreSelect).toHaveValue(mockWorld.genre);
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

  // Test updating the world genre
  test('calls onChange when genre is updated', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);

    const genreSelect = screen.getByLabelText(/genre/i);
    fireEvent.change(genreSelect, { target: { value: 'sci-fi' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      genre: 'sci-fi',
    });
  });

  // Test that genre dropdown works
  test('genre dropdown has options', () => {
    render(<WorldBasicInfoForm world={mockWorld} onChange={mockOnChange} />);
    
    // Check that genre dropdown has options available
    const genreSelect = screen.getByLabelText(/genre/i);
    const options = genreSelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1);
  });

});
