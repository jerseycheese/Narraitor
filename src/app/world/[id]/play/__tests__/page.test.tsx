import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayPage from '../page';
import { notFound, useParams } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: jest.fn().mockReturnValue({ id: 'world-1' }),
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
    expect(screen.getByText('Loading game session...')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-game-session')).not.toBeInTheDocument();
  });

  test('renders GameSession with worldId from params on client', () => {
    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Act
    render(<PlayPage />);

    // Assert
    expect(screen.getByTestId('mock-game-session')).toBeInTheDocument();
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
  
  test('passes the worldId correctly to GameSession component', () => {
    // Mock useState to simulate client-side rendering
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Test with a specific worldId
    const testWorldId = 'test-world-123';
    (useParams as jest.Mock).mockReturnValueOnce({ id: testWorldId });
    
    // Act
    render(<PlayPage />);
    
    // Assert
    expect(screen.getByTestId('mock-game-session')).toHaveTextContent(`Game Session for ${testWorldId}`);
  });
});
