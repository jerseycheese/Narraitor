import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useRouter } from 'next/navigation';
import WorldViewPage from '../page';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Keep the body presentational; this test only cares about heading levels.
jest.mock('@/components/world/WorldDetailsDisplay', () => ({
  WorldDetailsDisplay: () => <div data-testid="world-details" />,
}));

const world = {
  id: 'world-1',
  name: 'Fantasy Realm',
  genre: 'fantasy',
  image: { url: 'https://example.test/world.png', type: 'ai-generated' },
};

const worldState = {
  worlds: { 'world-1': world },
  currentWorldId: 'world-1',
  setCurrentWorld: jest.fn(),
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (state: typeof worldState) => unknown) =>
    selector(worldState),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: (selector: (state: { characters: object }) => unknown) =>
    selector({ characters: {} }),
}));

describe('WorldViewPage heading hierarchy', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'world-1' });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('renders exactly one h1 even when the hero is shown (#1473)', () => {
    render(<WorldViewPage />);

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Fantasy Realm');
  });

  it('does not repeat the world name in lower-level headings (#1542)', () => {
    render(<WorldViewPage />);

    // The name appears exactly once in the heading outline (the page h1);
    // the hero is a decorative image band and no longer repeats it.
    expect(
      screen.getAllByRole('heading', { name: 'Fantasy Realm' })
    ).toHaveLength(1);
    expect(screen.getByAltText('Fantasy Realm world')).toBeInTheDocument();
  });
});
