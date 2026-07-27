import React, { ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicInfoStep } from '../BasicInfoStep';

type BasicInfoStepData = ComponentProps<typeof BasicInfoStep>['data'];

// Physical description was consolidated from BackgroundStep into BasicInfoStep (#1434 / F9).
// It is asked once here, next to the portrait preview and the "used to generate your portrait" hint.
describe('BasicInfoStep - Physical Description', () => {
  const mockData = {
    characterData: {
      worldId: 'world-1',
      name: 'Jamie Holt',
      description: 'A returning camp counselor',
      background: {
        history: '',
        personality: '',
        motivation: '',
        goals: [],
        physicalDescription: '',
      },
    },
    validation: {
      1: { valid: true, errors: [], touched: false },
    },
  } as unknown as BasicInfoStepData;

  const mockOnUpdate = jest.fn();
  const mockOnValidation = jest.fn();
  const validateStep = jest.fn(() => ({ valid: true, errors: [], touched: true }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the physical description field', () => {
    render(
      <BasicInfoStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        validateStep={validateStep}
      />
    );

    const field = screen.getByLabelText('Physical Description (optional)');
    expect(field).toBeInTheDocument();
    expect(field).not.toHaveAttribute('required');
  });

  it('displays the current physical description value', () => {
    const dataWithDescription = {
      ...mockData,
      characterData: {
        ...mockData.characterData,
        background: {
          ...mockData.characterData.background,
          physicalDescription: 'Tall with dark hair and piercing blue eyes',
        },
      },
    } as unknown as BasicInfoStepData;

    render(
      <BasicInfoStep
        data={dataWithDescription}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        validateStep={validateStep}
      />
    );

    expect(screen.getByLabelText('Physical Description (optional)')).toHaveValue(
      'Tall with dark hair and piercing blue eyes'
    );
  });

  it('round-trips changes to background.physicalDescription', () => {
    render(
      <BasicInfoStep
        data={mockData}
        onUpdate={mockOnUpdate}
        onValidation={mockOnValidation}
        validateStep={validateStep}
      />
    );

    fireEvent.change(screen.getByLabelText('Physical Description (optional)'), {
      target: { value: 'A mysterious figure with a hooded cloak' },
    });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      background: {
        ...mockData.characterData.background,
        physicalDescription: 'A mysterious figure with a hooded cloak',
      },
    });
  });
});
