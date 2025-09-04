import React from 'react';
import { render, screen } from '@testing-library/react';
import EditWorldPage from '../page';

// Mock the React.use hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn((promise) => {
    // For testing, immediately resolve the promise
    if (promise && promise.then) {
      // This is a simplified mock - in a real test you might want to handle this differently
      return { id: 'test-world-123' };
    }
    return promise;
  })
}));

// Mock the WorldEditor component
jest.mock('@/components/WorldEditor/WorldEditor', () => {
  return function MockWorldEditor({ worldId }: { worldId: string }) {
    return <div data-testid="world-editor">World Editor for {worldId}</div>;
  };
});

describe('EditWorldPage - MVP Level Tests', () => {
  beforeEach(() => {
    // Reset the mock before each test
    const mockReact = jest.requireMock('react');
    mockReact.use.mockClear();
  });

  // Test that the page renders with basic structure
  test('renders edit world page with title and editor component', () => {
    const mockParams = Promise.resolve({
      id: 'test-world-123'
    });
    
    const mockReact = jest.requireMock('react');
    mockReact.use.mockImplementation(() => ({ id: 'test-world-123' }));

    render(<EditWorldPage params={mockParams} />);

    // Check if the page has a title
    expect(screen.getByText('Edit World')).toBeInTheDocument();

    // Check if WorldEditor is rendered
    expect(screen.getByTestId('world-editor')).toBeInTheDocument();
  });

  // Test that worldId is passed correctly to the editor
  test('passes worldId from URL params to WorldEditor', () => {
    const mockParams = Promise.resolve({
      id: 'world-456'
    });
    
    const mockReact = jest.requireMock('react');
    mockReact.use.mockImplementation(() => ({ id: 'world-456' }));

    render(<EditWorldPage params={mockParams} />);

    // Verify the WorldEditor receives the correct worldId
    expect(screen.getByText('World Editor for world-456')).toBeInTheDocument();
  });
});
