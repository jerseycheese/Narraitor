import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeStep from './FinalizeStep';
import { World } from '@/types/world.types';

describe('FinalizeStep', () => {
  const mockWorldData: Partial<World> = {
    name: 'Test World',
    description: 'A test world description',
    genre: 'fantasy',
    attributes: [],
    skills: [],
  };

  test('renders provider key requirement disclosure with accessible alert role', () => {
    render(
      <FinalizeStep
        worldData={mockWorldData}
        errors={{}}
        onComplete={jest.fn()}
      />
    );

    const disclosure = screen.getByTestId('finalize-provider-key-disclosure');
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveAttribute('role', 'alert');
    expect(disclosure).toHaveTextContent(
      /Stories and images are generated using your own provider key/i
    );
    expect(disclosure).toHaveTextContent(
      /It's kept in your browser, and there's no account needed/i
    );
  });
});
