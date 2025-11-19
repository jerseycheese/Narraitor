import React from 'react';
import { render, screen } from '@testing-library/react';
import WorldList from '../WorldList';

import { World } from '../../../types/world.types';

const mockWorlds: World[] = [
  {
    id: '1',
    name: 'World 1',
    description: 'Desc 1',
    genre: 'fantasy',
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
    genre: 'fantasy',
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
});
