import React from 'react';
import { render, screen } from '@testing-library/react';
import WorldList from '../WorldList';

import { World } from '../../../types/world.types';

const mockWorlds: World[] = [
  {
    id: '1',
    name: 'World 1',
    description: 'Desc 1',
    theme: 'Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'World 2',
    description: 'Desc 2',
    theme: 'Sci-Fi',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
];

describe('WorldList', () => {
  // Test case for normal rendering with worlds
  test('renders a list of WorldCard components when worlds are provided', () => {
    render(<WorldList worlds={mockWorlds} onSelectWorld={jest.fn()} onDeleteWorld={jest.fn()} />);
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('world-card')).toHaveLength(mockWorlds.length);
  });

  // Test case for empty state
  test('renders an empty message when no worlds are provided', () => {
    render(<WorldList worlds={[]} onSelectWorld={jest.fn()} onDeleteWorld={jest.fn()} />);
    expect(screen.getByTestId('world-list-empty-message')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to Narraitor!/i)).toBeInTheDocument();
    expect(screen.getByText(/Begin your storytelling journey by creating your first world/i)).toBeInTheDocument();
  });
});
