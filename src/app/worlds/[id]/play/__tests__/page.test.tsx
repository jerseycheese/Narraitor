import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import PlayPage from '../page';
import { notFound, useParams } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import type { World } from '@/types/world.types';
import type { StoryEnding } from '@/types/narrative.types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: jest.fn().mockReturnValue({ id: 'world-1' }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  notFound: jest.fn(),
}));

// Mock the GameSession component
jest.mock('@/components/GameSession/GameSession', () => {
  return function DummyGameSession({ worldId }: { worldId: string }) {
    return <div data-testid="mock-game-session">Game Session for {worldId}</div>;
  };
});

describe('Play Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially on server', () => {
    // Mock useState to simulate server-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
    
    // Act
    render(<PlayPage />);
    
    // Assert - should show loading message
    expect(screen.getByText('Creating your game...')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-game-session')).not.toBeInTheDocument();
  });

  test('renders GameSession with worldId from params on client', async () => {
    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);

    // Act
    render(<PlayPage />);

    // Assert — GameSession is loaded via next/dynamic, so await its appearance
    expect(await screen.findByTestId('mock-game-session')).toBeInTheDocument();
    expect(screen.getByTestId('mock-game-session')).toHaveTextContent('Game Session for world-1');
  });

  test('calls notFound when worldId is empty', () => {
    // Mock useParams to return an empty ID
    (useParams as jest.Mock).mockReturnValueOnce({ id: '' });

    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);

    // Act
    render(<PlayPage />);

    // Assert
    expect(notFound).toHaveBeenCalled();
  });
  
  test('calls notFound when worldId is undefined', () => {
    // Mock useParams to return undefined id
    (useParams as jest.Mock).mockReturnValueOnce({});

    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);

    // Act
    render(<PlayPage />);

    // Assert
    expect(notFound).toHaveBeenCalled();
  });
  
  test('calls notFound when worldId is just whitespace', () => {
    // Mock useParams to return a whitespace ID
    (useParams as jest.Mock).mockReturnValueOnce({ id: '   ' });

    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);

    // Act
    render(<PlayPage />);

    // Assert
    expect(notFound).toHaveBeenCalled();
  });
  
  test('passes the worldId correctly to GameSession component', async () => {
    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);

    // Test with a specific worldId
    const testWorldId = 'test-world-123';
    (useParams as jest.Mock).mockReturnValueOnce({ id: testWorldId });

    // Act
    render(<PlayPage />);

    // Assert — GameSession is loaded via next/dynamic, so await its appearance
    expect(await screen.findByTestId('mock-game-session')).toHaveTextContent(`Game Session for ${testWorldId}`);
  });

  // The immersive play route is chrome-free (no PageLayout), so the page
  // renders its own screen-reader-only h1 (#1532). No React.useState spy
  // here: the real mount effect flips isClient under act(), and the spy
  // breaks hook order once store updates re-render the page.
  describe('page-level heading', () => {
    afterEach(() => {
      // Unmount before resetting stores so the real narrativeStore doesn't
      // re-render a mounted page outside act().
      cleanup();
      useNarrativeStore.setState({ currentEnding: null });
      (useWorldStore as unknown as { __resetMocks: () => void }).__resetMocks();
    });

    test('active play exposes exactly one sr-only h1 naming the world', () => {
      // worldStore is globally mocked (jest.setup.ts); seed via its own API.
      const worldId = useWorldStore
        .getState()
        .createWorld({ name: 'Neo-Tokyo' } as Omit<World, 'id' | 'createdAt' | 'updatedAt'>);
      (useParams as jest.Mock).mockReturnValue({ id: worldId });

      render(<PlayPage />);

      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent('Playing in Neo-Tokyo');
      expect(headings[0]).toHaveClass('sr-only');
    });

    test('h1 switches to Story Complete when an ending is active', () => {
      useNarrativeStore.setState({
        currentEnding: { id: 'ending-1' } as StoryEnding,
      });

      render(<PlayPage />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Story Complete');
    });
  });
});
