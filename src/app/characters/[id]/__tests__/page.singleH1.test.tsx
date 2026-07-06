import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useRouter } from 'next/navigation';
import CharacterViewPage from '../page';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/components/characters/CharacterDetailsDisplay', () => ({
  CharacterDetailsDisplay: () => <div data-testid="character-details" />,
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({
    characters: {
      'char-123': {
        id: 'char-123',
        name: 'Aria',
        level: 5,
        worldId: 'world-1',
        background: {
          history: 'A wandering scholar.',
          personality: 'Curious and patient',
          goals: [],
          fears: [],
          physicalDescription: '',
        },
      },
    },
    setCurrentCharacter: jest.fn(),
    deleteCharacter: jest.fn(),
  }),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    worlds: {
      'world-1': {
        id: 'world-1',
        name: 'Fantasy Realm',
        genre: 'fantasy',
        // A world image makes the page render the Hero banner — the path that
        // previously produced a second <h1> (#1473).
        image: { url: 'https://example.test/world.png', type: 'ai-generated' },
      },
    },
  }),
}));

describe('CharacterViewPage heading hierarchy', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'char-123' });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('renders exactly one h1 when the world hero is shown (#1473)', () => {
    render(<CharacterViewPage />);

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Aria');
  });
});
