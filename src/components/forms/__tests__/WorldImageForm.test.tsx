import React from 'react';
import { render, screen } from '@testing-library/react';
import WorldImageForm from '../WorldImageForm';
import { World } from '@/types/world.types';

describe('WorldImageForm', () => {
  const baseWorld: World = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    genre: 'cyberpunk',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 25,
      skillPointPool: 30,
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  test('renders regenerate and remove buttons when world image exists', () => {
    const worldWithImage: World = {
      ...baseWorld,
      image: {
        type: 'ai-generated',
        url: 'https://example.com/world.png',
      },
    };

    render(<WorldImageForm world={worldWithImage} onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: /regenerate world image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove world image/i })).toBeInTheDocument();
  });

  test('renders generate button when world image is placeholder', () => {
    const worldWithPlaceholder: World = {
      ...baseWorld,
      image: {
        type: 'placeholder',
        url: null,
      },
    };

    render(<WorldImageForm world={worldWithPlaceholder} onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: /generate world image/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove world image/i })).not.toBeInTheDocument();
  });
});
