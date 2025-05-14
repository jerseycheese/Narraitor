import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { World } from '../../../types/world.types';

// Create mock functions at the module level
const mockFetchWorlds = jest.fn();
const mockSetCurrentWorld = jest.fn();
const mockDeleteWorld = jest.fn();
const mockGetState = jest.fn();

// Mock the child components
jest.mock('../../WorldList/WorldList', () => {
  return {
    __esModule: true,
    default: ({ worlds, onSelectWorld, onDeleteWorld }: { worlds: World[], onSelectWorld: (id: string) => void, onDeleteWorld: (id: string) => void }) => {
      return (
        <div data-testid="world-list-container">
          {worlds.length === 0 ? (
            <div data-testid="world-list-empty-message">No worlds created yet.</div>
          ) : (
            worlds.map(world => (
              <div key={world.id} data-testid={`world-item-${world.id}`}>
                {world.name}
                <button onClick={() => onSelectWorld(world.id)}>Select</button>
                <button onClick={() => onDeleteWorld(world.id)}>Delete</button>
              </div>
            ))
          )}
        </div>
      );
    }
  };
});

jest.mock('../../DeleteConfirmationDialog/DeleteConfirmationDialog', () => {
  return {
    __esModule: true,
    default: ({ isOpen, onClose, onConfirm, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, message: string }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="delete-confirmation-dialog">
          <p>{message}</p>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      );
    }
  };
});

// Mock worldStore properly
type MockWorldStore = {
  worlds: Record<string, World>;
  currentWorldId: string | null;
  loading: boolean;
  error: string | null;
  fetchWorlds: jest.Mock;
  setCurrentWorld: jest.Mock;
  deleteWorld: jest.Mock;
};

let mockState: MockWorldStore = {
  worlds: {},
  currentWorldId: null,
  loading: false,
  error: null,
  fetchWorlds: mockFetchWorlds,
  setCurrentWorld: mockSetCurrentWorld,
  deleteWorld: mockDeleteWorld,
};

// Mock the worldStore
jest.mock('../../../state/worldStore', () => ({
  worldStore: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockState);
    }
    return mockState;
  })
}));

// Define type for worldStore function
type WorldStoreFunction = {
  (selector: (state: MockWorldStore) => unknown): unknown;
  getState: () => MockWorldStore;
};

// Mock getState for the store
(jest.requireMock('../../../state/worldStore').worldStore as WorldStoreFunction).getState = mockGetState;

// Import after mocks are set up
import WorldListScreen from '../WorldListScreen';

describe('WorldListScreen', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock state
    mockState = {
      worlds: {},
      currentWorldId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
    };
    
    // Setup getState to return current mock state
    mockGetState.mockReturnValue(mockState);
  });

  test('renders loading indicator when loading', () => {
    mockState.loading = true;

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-screen-loading-indicator')).toBeInTheDocument();
  });

  test('renders error message when there is an error', () => {
    mockState.loading = false;
    mockState.error = 'Failed to fetch worlds';

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-screen-error-message')).toBeInTheDocument();
    expect(screen.getByText('Error: Failed to fetch worlds')).toBeInTheDocument();
  });

  test('renders WorldList when worlds are available', () => {
    const mockWorlds: Record<string, World> = {
      '1': {
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
      '2': {
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
    };

    mockState.worlds = mockWorlds;
    mockState.loading = false;
    mockState.error = null;

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
    expect(screen.getByTestId('world-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('world-item-2')).toBeInTheDocument();
    expect(screen.queryByTestId('world-list-empty-message')).not.toBeInTheDocument();
  });

  test('renders empty message when no worlds are available', () => {
    mockState.worlds = {};
    mockState.loading = false;
    mockState.error = null;

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-empty-message')).toBeInTheDocument();
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
  });

  test('calls action handlers when triggered', async () => {
    const user = userEvent.setup();

    const mockWorlds: Record<string, World> = {
      '1': {
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
    };

    mockState.worlds = mockWorlds;
    mockState.loading = false;
    mockState.error = null;

    render(<WorldListScreen />);

    // Simulate selecting a world
    const selectButton = screen.getByRole('button', { name: /Select/i });
    await user.click(selectButton);
    expect(mockSetCurrentWorld).toHaveBeenCalledWith('1');

    // Simulate deleting a world
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    // Check if the confirmation dialog is open
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
    });

    // Check for the correct message
    expect(screen.getByText('Are you sure you want to delete the world "World 1"?')).toBeInTheDocument();

    // Simulate confirming deletion
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    await user.click(confirmButton);
    expect(mockDeleteWorld).toHaveBeenCalledWith('1');
  });
});
