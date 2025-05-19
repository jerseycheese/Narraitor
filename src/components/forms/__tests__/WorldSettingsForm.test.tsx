import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldSettingsForm from '@/components/forms/WorldSettingsForm';
import { WorldSettings } from '@/types/world.types';

describe('WorldSettingsForm - MVP Level Tests', () => {
  const mockSettings: WorldSettings = {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 25,
    skillPointPool: 30,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test displaying current settings
  test('displays all current settings', () => {
    render(
      <WorldSettingsForm 
        settings={mockSettings} 
        onChange={mockOnChange} 
      />
    );

    // Check if all settings are displayed with correct values
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  // Test updating maximum attributes
  test('allows updating maximum attributes', () => {
    render(
      <WorldSettingsForm 
        settings={mockSettings} 
        onChange={mockOnChange} 
      />
    );

    const maxAttributesInput = screen.getByLabelText(/Maximum Attributes/i);
    fireEvent.change(maxAttributesInput, { target: { value: '15' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      maxAttributes: 15,
    });
  });

  // Test updating skill point pool
  test('allows updating skill point pool', () => {
    render(
      <WorldSettingsForm 
        settings={mockSettings} 
        onChange={mockOnChange} 
      />
    );

    const skillPointPoolInput = screen.getByLabelText(/Skill Point Pool/i);
    fireEvent.change(skillPointPoolInput, { target: { value: '40' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      skillPointPool: 40,
    });
  });

  // Test section heading
  test('displays correct section heading', () => {
    render(
      <WorldSettingsForm 
        settings={mockSettings} 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText('World Settings')).toBeInTheDocument();
  });

  // Test that all setting fields have appropriate labels
  test('all settings have appropriate labels', () => {
    render(
      <WorldSettingsForm 
        settings={mockSettings} 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByLabelText(/Maximum Attributes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maximum Skills/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Attribute Point Pool/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Skill Point Pool/i)).toBeInTheDocument();
  });
});