import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeStep from './FinalizeStep';
import { World } from '@/types/world.types';

describe('FinalizeStep', () => {
  const mockWorldData: Partial<World> = {
    name: 'Aethelgard',
    description: 'A realm of high fantasy and ancient magic',
    genre: 'fantasy',
    attributes: [
      {
        id: 'attr-1',
        worldId: 'world-1',
        name: 'Might',
        description: 'Physical prowess and raw power',
        baseValue: 10,
        minValue: 1,
        maxValue: 20,
      },
      {
        id: 'attr-2',
        worldId: 'world-1',
        name: 'Wits',
        description: 'Mental agility and cleverness',
        baseValue: 10,
        minValue: 3,
        maxValue: 18,
      },
    ],
    skills: [
      {
        id: 'skill-1',
        worldId: 'world-1',
        name: 'Swordsmanship',
        description: 'Mastery of bladed weapons',
        difficulty: 'medium',
        baseValue: 1,
        minValue: 0,
        maxValue: 10,
      },
    ],
  };

  it('renders all attributes with name, description, and min/max range', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        onUpdateWorldData={jest.fn()}
      />
    );

    expect(screen.getByText('Might')).toBeInTheDocument();
    expect(screen.getByText('Physical prowess and raw power')).toBeInTheDocument();
    expect(screen.getByText('Range: 1 - 20')).toBeInTheDocument();

    expect(screen.getByText('Wits')).toBeInTheDocument();
    expect(screen.getByText('Mental agility and cleverness')).toBeInTheDocument();
    expect(screen.getByText('Range: 3 - 18')).toBeInTheDocument();
  });

  it('renders empty state when no attributes or skills are present', () => {
    render(
      <FinalizeStep
        worldData={{ name: 'Empty World' }}
        onUpdateWorldData={jest.fn()}
      />
    );

    expect(screen.getByText('No attributes selected')).toBeInTheDocument();
    expect(screen.getByText('No skills selected')).toBeInTheDocument();
  });
});
