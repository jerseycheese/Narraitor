import { render, screen } from '@testing-library/react';
import EditWorldPage from '../page';

// Mock the WorldEditor component
jest.mock('@/components/WorldEditor/WorldEditor', () => {
  return function MockWorldEditor({ worldId }: { worldId: string }) {
    return <div data-testid="world-editor">World Editor for {worldId}</div>;
  };
});

describe('EditWorldPage - MVP Level Tests', () => {
  // Test that the page renders with basic structure
  test('renders edit world page with title and editor component', () => {
    const params = {
      id: 'test-world-123'
    };

    render(<EditWorldPage params={params} />);

    // Check if the page has a title
    expect(screen.getByText('Edit World')).toBeInTheDocument();

    // Check if WorldEditor is rendered
    expect(screen.getByTestId('world-editor')).toBeInTheDocument();
  });

  // Test that worldId is passed correctly to the editor
  test('passes worldId from URL params to WorldEditor', () => {
    const params = {
      id: 'world-456'
    };

    render(<EditWorldPage params={params} />);

    // Verify the WorldEditor receives the correct worldId
    expect(screen.getByText('World Editor for world-456')).toBeInTheDocument();
  });
});