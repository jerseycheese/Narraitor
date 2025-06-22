import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldTypeSelector } from './WorldTypeSelector';

describe('WorldTypeSelector - MVP Tests', () => {
  const mockOnChange = jest.fn();
  const mockValue = {
    worldType: 'original' as const,
    worldReference: '',
    additionalDetails: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles undefined value gracefully', () => {
    const { container } = render(<WorldTypeSelector value={undefined as unknown as Parameters<typeof WorldTypeSelector>[0]['value']} onChange={mockOnChange} />);
    
    // Component should render nothing when value is undefined
    expect(container.firstChild).toBeNull();
  });

  test('renders world type options', () => {
    render(<WorldTypeSelector value={mockValue} onChange={mockOnChange} />);
    
    expect(screen.getByDisplayValue('original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('inspired_by')).toBeInTheDocument();
    expect(screen.getByDisplayValue('set_within')).toBeInTheDocument();
  });

  test('calls onChange when world type is selected', () => {
    render(<WorldTypeSelector value={mockValue} onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByDisplayValue('inspired_by'));
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        worldType: 'inspired_by'
      })
    );
  });

  test('shows reference input when non-original type is selected', () => {
    const valueWithReference = {
      worldType: 'inspired_by' as const,
      worldReference: '',
      additionalDetails: ''
    };

    render(<WorldTypeSelector value={valueWithReference} onChange={mockOnChange} />);
    
    // Check that additional input fields appear for non-original world types
    expect(screen.getByPlaceholderText(/e.g., Star Wars, The Office, Breaking Bad/i)).toBeInTheDocument();
  });

  test('updates reference when input changes', () => {
    const valueWithReference = {
      worldType: 'inspired_by' as const,
      worldReference: '',
      additionalDetails: ''
    };

    render(<WorldTypeSelector value={valueWithReference} onChange={mockOnChange} />);
    
    const referenceInput = screen.getByPlaceholderText(/e.g., Star Wars, The Office, Breaking Bad/i);
    fireEvent.change(referenceInput, { target: { value: 'Star Wars' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        worldReference: 'Star Wars'
      })
    );
  });
});