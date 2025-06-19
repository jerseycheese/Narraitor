import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttributesStep } from '../AttributesStep';

describe.skip('AttributesStep', () => {
  const mockOnUpdate = jest.fn();
  const mockOnValidation = jest.fn();
  const mockWorldConfig = {
    id: 'world-1',
    name: 'Test World',
    description: 'Test Description',
    theme: 'fantasy',
    attributes: [
      { id: 'attr-1', name: 'Strength', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-2', name: 'Intelligence', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-3', name: 'Dexterity', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 10 },
    ],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27, // 3 attributes * 9 points each
      skillPointPool: 15,
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  const defaultProps = {
    data: {
      currentStep: 1,
      worldId: 'world-1',
      characterData: {
        name: 'Test Hero',
        description: 'A test character',
        portraitPlaceholder: '',
        attributes: [
          { attributeId: 'attr-1', name: 'Strength', value: 1, minValue: 1, maxValue: 10 },
          { attributeId: 'attr-2', name: 'Intelligence', value: 1, minValue: 1, maxValue: 10 },
          { attributeId: 'attr-3', name: 'Dexterity', value: 1, minValue: 1, maxValue: 10 },
        ],
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
        attributes: { total: 27, spent: 3, remaining: 24 },
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

  it('displays all world attributes', () => {
    render(<AttributesStep {...defaultProps} />);
    
    expect(screen.getByText(/strength/i)).toBeInTheDocument();
    expect(screen.getByText(/intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/dexterity/i)).toBeInTheDocument();
  });

  it('shows point pool information', () => {
    render(<AttributesStep {...defaultProps} />);
    
    expect(screen.getByText(/attribute points/i)).toBeInTheDocument();
    expect(screen.getByText(/24.*remaining/i)).toBeInTheDocument(); // 24 points remaining
  });

  it('renders range sliders for each attribute', () => {
    render(<AttributesStep {...defaultProps} />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(3); // One for each attribute
  });

  it('updates attribute value when slider changes', () => {
    render(<AttributesStep {...defaultProps} />);
    
    const strengthSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(strengthSlider, { target: { value: '5' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      attributes: expect.arrayContaining([
        expect.objectContaining({ attributeId: 'attr-1', value: 5 }),
      ]),
    });
  });

  it('validates point allocation on change', () => {
    render(<AttributesStep {...defaultProps} />);
    
    const slider = screen.getAllByRole('slider')[0];
    fireEvent.change(slider, { target: { value: '5' } });
    
    expect(mockOnValidation).toHaveBeenCalled();
  });

  it('displays validation error when points not fully allocated', () => {
    const propsWithError = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        validation: {
          1: {
            valid: false,
            errors: ['Must spend exactly 27 points (3 spent)'],
            touched: true,
          },
        },
      },
    };
    
    render(<AttributesStep {...propsWithError} />);
    
    expect(screen.getByText(/must spend exactly 27 points/i)).toBeInTheDocument();
  });

  it('enforces minimum and maximum values for attributes', () => {
    render(<AttributesStep {...defaultProps} />);
    
    const sliders = screen.getAllByRole('slider');
    sliders.forEach(slider => {
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '10');
    });
  });

  it('updates point pool display when attributes change', () => {
    const propsWithSpentPoints = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        characterData: {
          ...defaultProps.data.characterData,
          attributes: [
            { attributeId: 'attr-1', name: 'Strength', value: 10, minValue: 1, maxValue: 10 },
            { attributeId: 'attr-2', name: 'Intelligence', value: 10, minValue: 1, maxValue: 10 },
            { attributeId: 'attr-3', name: 'Dexterity', value: 7, minValue: 1, maxValue: 10 },
          ],
        },
        pointPools: {
          ...defaultProps.data.pointPools,
          attributes: { total: 27, spent: 27, remaining: 0 },
        },
      },
    };
    
    render(<AttributesStep {...propsWithSpentPoints} />);
    
    expect(screen.getByText(/0.*remaining/i)).toBeInTheDocument(); // 0 points remaining
    expect(screen.getByText(/27.*spent/i)).toBeInTheDocument(); // 27 points spent
  });
});
