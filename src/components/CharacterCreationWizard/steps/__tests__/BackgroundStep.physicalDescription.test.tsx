import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackgroundStep } from '../BackgroundStep';

describe('BackgroundStep - Physical Description', () => {
  const mockData = {
    characterData: {
      background: {
        history: 'A detailed character history that meets minimum requirements.',
        personality: 'A brave and cheerful adventurer',
        motivation: 'To protect the innocent',
        goals: ['Save the world'],
        physicalDescription: ''
      }
    },
    validation: {
      3: { valid: true, errors: [], touched: false }
    }
  };

  const mockOnUpdate = jest.fn();
  const mockOnValidation = jest.fn();
  const mockWorldConfig = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders physical description field', () => {
    render(
      <BackgroundStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        worldConfig={mockWorldConfig}
      />
    );

    const physicalDescriptionField = screen.getByLabelText('Physical Appearance (Optional)');
    expect(physicalDescriptionField).toBeInTheDocument();
    expect(physicalDescriptionField).toHaveAttribute('placeholder', 'Describe your character\'s physical appearance... (optional)');
  });

  it('displays current physical description value', () => {
    const dataWithDescription = {
      ...mockData,
      characterData: {
        ...mockData.characterData,
        background: {
          ...mockData.characterData.background,
          physicalDescription: 'Tall with dark hair and piercing blue eyes'
        }
      }
    };

    render(
      <BackgroundStep
        data={dataWithDescription}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        worldConfig={mockWorldConfig}
      />
    );

    const physicalDescriptionField = screen.getByLabelText('Physical Appearance (Optional)');
    expect(physicalDescriptionField).toHaveValue('Tall with dark hair and piercing blue eyes');
  });

  it('calls onUpdate when physical description changes', () => {
    render(
      <BackgroundStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        worldConfig={mockWorldConfig}
      />
    );

    const physicalDescriptionField = screen.getByLabelText('Physical Appearance (Optional)');
    fireEvent.change(physicalDescriptionField, {
      target: { value: 'A mysterious figure with a hooded cloak' }
    });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      background: {
        ...mockData.characterData.background,
        physicalDescription: 'A mysterious figure with a hooded cloak'
      }
    });
  });

  it('handles multiline physical description input', () => {
    render(
      <BackgroundStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        worldConfig={mockWorldConfig}
      />
    );

    const physicalDescriptionField = screen.getByLabelText('Physical Appearance (Optional)');
    const multilineDescription = 'Tall and lean with weathered hands.\nScar across the left cheek from an old battle.\nEyes that seem to hold ancient wisdom.';
    
    fireEvent.change(physicalDescriptionField, {
      target: { value: multilineDescription }
    });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      background: {
        ...mockData.characterData.background,
        physicalDescription: multilineDescription
      }
    });
  });

  it('physical description field is optional (no validation errors)', () => {
    render(
      <BackgroundStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        worldConfig={mockWorldConfig}
      />
    );

    const physicalDescriptionField = screen.getByLabelText('Physical Appearance (Optional)');
    
    // Field should not have required attribute
    expect(physicalDescriptionField).not.toHaveAttribute('required');
    
    // No asterisk (*) should be present for required field indicator (already handled by "(Optional)" suffix)
    expect(screen.queryByText('Physical Appearance *')).not.toBeInTheDocument();
  });

  it('renders field in correct position between personality and motivation', () => {
    render(
      <BackgroundStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        worldConfig={mockWorldConfig}
      />
    );

    const personalityField = screen.getByLabelText(/Personality/);
    const physicalDescriptionField = screen.getByLabelText('Physical Appearance (Optional)');
    const motivationField = screen.getByLabelText('Motivation');

    // Check that physical description comes after personality in DOM order
    expect(personalityField.compareDocumentPosition(physicalDescriptionField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    
    // Check that motivation comes after physical description in DOM order
    expect(physicalDescriptionField.compareDocumentPosition(motivationField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});