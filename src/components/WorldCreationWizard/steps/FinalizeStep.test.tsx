import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FinalizeStep from './FinalizeStep';
import { World } from '@/types/world.types';

describe('FinalizeStep', () => {
  const mockWorldData: Partial<World> = {
    name: 'Test World',
    description: 'A test world description',
    theme: 'fantasy',
    attributes: [
      {
        id: 'attr1',
        worldId: '',
        name: 'Strength',
        description: 'Physical power',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        category: 'physical',
      },
    ],
    skills: [
      {
        id: 'skill1',
        worldId: '',
        name: 'Combat',
        description: 'Fighting ability',
        difficulty: 'medium',
        category: 'general',
      },
    ],
  };

  const mockOnBack = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all world information', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('finalize-step')).toBeInTheDocument();
    expect(screen.getByTestId('review-world-name')).toHaveTextContent('Test World');
    expect(screen.getByTestId('review-world-genre')).toHaveTextContent('fantasy');
    expect(screen.getByTestId('review-world-description')).toHaveTextContent('A test world description');
  });

  test('displays attributes section', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('review-attributes-section')).toBeInTheDocument();
    expect(screen.getByText('Attributes (1)')).toBeInTheDocument();
    expect(screen.getByTestId('review-attribute-0')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Physical power')).toBeInTheDocument();
    expect(screen.getByText('Range: 1 - 10')).toBeInTheDocument();
  });

  test('displays skills section', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('review-skills-section')).toBeInTheDocument();
    expect(screen.getByText('Skills (1)')).toBeInTheDocument();
    expect(screen.getByTestId('review-skill-0')).toBeInTheDocument();
    expect(screen.getByText('Combat')).toBeInTheDocument();
    expect(screen.getByText('Fighting ability')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  test('shows empty states when no attributes or skills', () => {
    const emptyWorldData: Partial<World> = {
      name: 'Empty World',
      description: 'An empty world',
      theme: 'fantasy',
      attributes: [],
      skills: [],
    };

    render(
      <FinalizeStep
        worldData={emptyWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('No attributes selected')).toBeInTheDocument();
    expect(screen.getByText('No skills selected')).toBeInTheDocument();
  });

  test('displays submit error when present', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{ submit: 'Failed to create world' }}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('submit-error')).toHaveTextContent('Failed to create world');
  });

  test('calls onBack when back button clicked', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    fireEvent.click(screen.getByTestId('step-back-button'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  test('calls onCancel when cancel button clicked', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    fireEvent.click(screen.getByTestId('step-cancel-button'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('calls onComplete when complete button clicked', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    fireEvent.click(screen.getByTestId('step-complete-button'));
    expect(mockOnComplete).toHaveBeenCalled();
  });

  test('displays skill linked attribute correctly', () => {
    const worldDataWithLinkedSkill: Partial<World> = {
      ...mockWorldData,
      skills: [
        {
          id: 'skill1',
          worldId: '',
          name: 'Combat',
          description: 'Fighting ability',
          difficulty: 'medium',
          category: 'general',
          linkedAttributeId: 'attr1',
        },
      ],
    };

    render(
      <FinalizeStep
        worldData={worldDataWithLinkedSkill}
        errors={{}}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Linked to: Strength')).toBeInTheDocument();
  });
});
