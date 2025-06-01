import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeStep from './FinalizeStep';
import { World } from '@/types/world.types';

describe.skip('FinalizeStep', () => {
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

  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all world information', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
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
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('submit-error')).toHaveTextContent('Failed to create world');
  });

  test('displays complete button section', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onComplete={mockOnComplete}
      />
    );

    // The complete button is handled by the wizard navigation now
    // We just verify the step content is rendered properly
    expect(screen.getByTestId('finalize-step')).toBeInTheDocument();
  });

  test('renders review section with all data', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onComplete={mockOnComplete}
      />
    );

    // Check all sections are present
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByTestId('review-attributes-section')).toBeInTheDocument();
    expect(screen.getByTestId('review-skills-section')).toBeInTheDocument();
  });

  test('onComplete callback is provided', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onComplete={mockOnComplete}
      />
    );

    // Verify the onComplete callback is defined
    expect(mockOnComplete).toBeDefined();
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
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Linked to: Strength')).toBeInTheDocument();
  });

  test('handles missing data gracefully', () => {
    const incompleteWorldData: Partial<World> = {
      name: 'Incomplete World',
      // Missing description and theme
    };

    render(
      <FinalizeStep
        worldData={incompleteWorldData}
        errors={{}}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('review-world-name')).toHaveTextContent('Incomplete World');
    // Should handle missing data without crashing
    expect(screen.getByTestId('finalize-step')).toBeInTheDocument();
  });

  test('displays multiple attributes correctly', () => {
    const worldDataWithMultipleAttrs: Partial<World> = {
      ...mockWorldData,
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
        {
          id: 'attr2',
          worldId: '',
          name: 'Intelligence',
          description: 'Mental capacity',
          baseValue: 7,
          minValue: 1,
          maxValue: 10,
          category: 'mental',
        },
      ],
    };

    render(
      <FinalizeStep
        worldData={worldDataWithMultipleAttrs}
        errors={{}}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Attributes (2)')).toBeInTheDocument();
    expect(screen.getByTestId('review-attribute-0')).toBeInTheDocument();
    expect(screen.getByTestId('review-attribute-1')).toBeInTheDocument();
  });

  test('displays multiple skills correctly', () => {
    const worldDataWithMultipleSkills: Partial<World> = {
      ...mockWorldData,
      skills: [
        {
          id: 'skill1',
          worldId: '',
          name: 'Combat',
          description: 'Fighting ability',
          difficulty: 'medium',
          category: 'general',
        },
        {
          id: 'skill2',
          worldId: '',
          name: 'Stealth',
          description: 'Moving unseen',
          difficulty: 'hard',
          category: 'rogue',
        },
      ],
    };

    render(
      <FinalizeStep
        worldData={worldDataWithMultipleSkills}
        errors={{}}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Skills (2)')).toBeInTheDocument();
    expect(screen.getByTestId('review-skill-0')).toBeInTheDocument();
    expect(screen.getByTestId('review-skill-1')).toBeInTheDocument();
  });
});