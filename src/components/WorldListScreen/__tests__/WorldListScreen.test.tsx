import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { World } from '../../../types/world.types';
import { UserFriendlyError } from '@/lib/utils/errorUtils';

const testSettings = {
  maxAttributes: 10,
  maxSkills: 10,
  attributePointPool: 100,
  skillPointPool: 100,
};

// Create mock functions at the module level
const mockFetchWorlds = jest.fn();
const mockSetCurrentWorld = jest.fn();
const mockDeleteWorld = jest.fn();
const mockGetState: jest.Mock<MockWorldStore> = jest.fn();

// Mock the child components
jest.mock('../../WorldList/WorldList', () => {
  return {
    __esModule: true,
    default: ({ worlds, onDeleteWorld }: { worlds: World[], onDeleteWorld: (id: string) => void }) => {
      return (
        <div data-testid="world-list-container">
          {worlds.length === 0 ? (
            <div data-testid="world-list-empty-message">No worlds created yet.</div>
          ) : (
            worlds.map(world => (
              <div key={world.id} data-testid={`world-item-${world.id}`}>
                {world.name}
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
    default: ({ isOpen, onClose, onConfirm, title, description, itemName }: { 
      isOpen: boolean, 
      onClose: () => void, 
      onConfirm: () => void, 
      title: string,
      description: string,
      itemName: string
    }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="delete-confirmation-dialog">
          <h2>{title}</h2>
          <p>{description}</p>
          <p>{itemName}</p>
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
  entities: Record<string, World>;
  currentWorldId: string | null;
  currentEntityId: string | null;
  loading: boolean;
  error: UserFriendlyError | null;
  fetchWorlds: jest.Mock;
  setCurrentWorld: jest.Mock;
  deleteWorld: jest.Mock;
};

let mockState: MockWorldStore = {
  worlds: {},
  entities: {},
  currentWorldId: null,
  currentEntityId: null,
  loading: false,
  error: null,
  fetchWorlds: mockFetchWorlds,
  setCurrentWorld: mockSetCurrentWorld,
  deleteWorld: mockDeleteWorld,
};

type MockWorldStoreFunction = jest.Mock & {
  getState: () => MockWorldStore;
  setState: (updater: ((state: MockWorldStore) => Partial<MockWorldStore>) | Partial<MockWorldStore>) => void;
  subscribe: (listener: () => void) => () => void;
  listeners: (() => void)[];
};

// Mock the worldStore
jest.mock('../../../state/worldStore', () => {
  // Create a mock store function that can be called with a selector
  const mockStore: MockWorldStoreFunction = jest.fn((selector) => {
    // When called with a selector, apply the selector to our mock state
    if (typeof selector === 'function') {
      return selector(mockState);
    }
    // Otherwise return the mock store
    return mockState;
  }) as MockWorldStoreFunction;
  
  // Add proper store methods
  mockStore.setState = jest.fn((updater: ((state: MockWorldStore) => Partial<MockWorldStore>) | Partial<MockWorldStore>) => {
    if (typeof updater === 'function') {
      const newState = updater(mockState);
      mockState = { ...mockState, ...newState };
    } else {
      mockState = { ...mockState, ...updater };
    }
    // Call any subscribed listeners
    mockStore.listeners.forEach((listener: () => void) => listener());
  });

  mockStore.getState = mockGetState;
  mockStore.listeners = [] as (() => void)[];
  mockStore.subscribe = jest.fn((listener: () => void) => {
    mockStore.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = mockStore.listeners.indexOf(listener);
      if (index !== -1) mockStore.listeners.splice(index, 1);
    };
  });
  
  return {
    useWorldStore: mockStore
  };
});

import WorldListScreen from '../WorldListScreen';

describe('WorldListScreen', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock state
    mockState = {
      worlds: {},
      entities: {},
      currentWorldId: null,
      currentEntityId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
    };
    
    // Setup getState to return current mock state
    mockGetState.mockReturnValue(mockState);
  });

  test('shows empty message when no worlds are available', () => {
    mockGetState.mockReturnValue({
      worlds: {},
      entities: {},
      currentWorldId: null,
      currentEntityId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
    });

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
    expect(screen.getByTestId('world-list-empty-message')).toBeInTheDocument();
    expect(screen.getByText('No worlds created yet.')).toBeInTheDocument();
  });
  
  test('renders root element as a div with worlds-screen class, not a main landmark', () => {
    const { container } = render(<WorldListScreen />);
    const root = container.firstElementChild;
    expect(root?.tagName.toLowerCase()).toBe('div');
    expect(root).toHaveClass('worlds-screen');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  test('renders WorldList when worlds are available', () => {
    const mockWorlds: Record<string, World> = {
      '1': {
        id: '1',
        name: 'World 1',
        description: 'Desc 1',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: testSettings,
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T10:00:00Z',
      },
      '2': {
        id: '2',
        name: 'World 2',
        description: 'Desc 2',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: testSettings,
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T10:00:00Z',
      },
    };

    mockState.worlds = mockWorlds;
    mockState.entities = mockWorlds;
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
    mockState.entities = {};
    mockState.loading = false;
    mockState.error = null;

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-empty-message')).toBeInTheDocument();
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
  });

  test('calls action handlers when triggered', async () => {
    const user = userEvent.setup();

    // Reset mocks
    jest.clearAllMocks();
    
    const mockWorlds: Record<string, World> = {
      '1': {
        id: '1',
        name: 'World 1',
        description: 'Desc 1',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: testSettings,
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T10:00:00Z',
      },
    };

    // Set up the mock implementation
    mockGetState.mockImplementation(() => ({
      worlds: mockWorlds,
      entities: mockWorlds,
      currentWorldId: null,
      currentEntityId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
    }));

    render(<WorldListScreen />);

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
