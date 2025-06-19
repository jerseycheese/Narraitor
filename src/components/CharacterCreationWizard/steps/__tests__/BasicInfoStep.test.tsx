import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoStep } from '../BasicInfoStep';

describe.skip('BasicInfoStep', () => {
  const mockOnUpdate = jest.fn();
  const mockOnValidation = jest.fn();
  const mockWorldConfig = {
    id: 'world-1',
    name: 'Test World',
    description: 'Test Description',
    theme: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 20,
      skillPointPool: 15,
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  const defaultProps = {
    data: {
      currentStep: 0,
      worldId: 'world-1',
      characterData: {
        name: '',
        description: '',
        portraitPlaceholder: '',
        attributes: [],
        skills: [],
        background: {
          history: '',
          personality: '',
          goals: [],
          motivation: '',
        },
      },
      validation: {},
      pointPools: {
        attributes: { total: 20, spent: 0, remaining: 20 },
        skills: { total: 15, spent: 0, remaining: 15 },
      },
    },
    onUpdate: mockOnUpdate,
    onValidation: mockOnValidation,
    worldConfig: mockWorldConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders character name and description fields', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('displays character portrait placeholder', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    expect(screen.getByTestId('character-portrait-placeholder')).toBeInTheDocument();
  });

  it('updates character name on input', async () => {
    const user = userEvent.setup();
    render(<BasicInfoStep {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/character name/i);
    await user.type(nameInput, 'Hero Name');
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      name: 'Hero Name',
    });
  });

  it('updates character description on input', async () => {
    const user = userEvent.setup();
    render(<BasicInfoStep {...defaultProps} />);
    
    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'A brave warrior');
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      description: 'A brave warrior',
    });
  });

  it('shows character name in portrait placeholder', () => {
    const propsWithName = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        characterData: {
          ...defaultProps.data.characterData,
          name: 'John Doe',
        },
      },
    };
    
    render(<BasicInfoStep {...propsWithName} />);
    
    const placeholder = screen.getByTestId('character-portrait-placeholder');
    expect(placeholder).toHaveTextContent('JD'); // Initials
  });

  it('validates on field blur', async () => {
    const user = userEvent.setup();
    render(<BasicInfoStep {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/character name/i);
    await user.type(nameInput, 'AB'); // Too short
    fireEvent.blur(nameInput);
    
    expect(mockOnValidation).toHaveBeenCalled();
  });

  it('displays validation errors', () => {
    const propsWithError = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        validation: {
          0: {
            valid: false,
            errors: ['Name must be at least 3 characters'],
            touched: true,
          },
        },
      },
    };
    
    render(<BasicInfoStep {...propsWithError} />);
    
    expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
  });

  it('limits character name to 50 characters', async () => {
    const user = userEvent.setup();
    render(<BasicInfoStep {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/character name/i) as HTMLInputElement;
    const longName = 'A'.repeat(60);
    await user.type(nameInput, longName);
    
    // Should enforce maxLength attribute
    expect(nameInput.maxLength).toBe(50);
  });
});
