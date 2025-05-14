import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { World } from '../../../types/world.types';
import type { WorldStore } from '../../../state/worldStore';

// Create mock functions at the module level
const mockFetchWorlds = jest.fn();
const mockSetCurrentWorld = jest.fn();
const mockDeleteWorld = jest.fn();

// Import the actual worldStore to get its type
import { worldStore as actualWorldStore } from '../../../state/worldStore';

// Type the mocked worldStore properly
type MockedWorldStore = jest.MockedFunction<typeof actualWorldStore> & {
  getState: jest.MockedFunction<() => Pick<WorldStore, 'fetchWorlds' | 'setCurrentWorld' | 'deleteWorld'>>;
};

jest.mock('../../../state/worldStore', () => {
  const mockWorldStore = jest.fn() as unknown as MockedWorldStore;

  // Add getState to the mock with proper typing
  mockWorldStore.getState = jest.fn().mockReturnValue({
    fetchWorlds: mockFetchWorlds,
    setCurrentWorld: mockSetCurrentWorld,
    deleteWorld: mockDeleteWorld,
  });

  return {
    worldStore: mockWorldStore,
  };
});

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

// Import after mocks are set up
import WorldListScreen from '../WorldListScreen';
import { worldStore } from '../../../state/worldStore';


const mockedWorldStore = worldStore as MockedWorldStore;

describe('WorldListScreen', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up default mock implementation
    mockedWorldStore.mockImplementation((selector: (state: WorldStore) => unknown) => selector({
      worlds: {},
      currentWorldId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
      createWorld: jest.fn(),
      updateWorld: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

    // Reset getState
    mockedWorldStore.getState.mockReturnValue({
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
    });
  });

  test('renders loading indicator when loading', () => {
    mockedWorldStore.mockImplementationOnce((selector: (state: WorldStore) => unknown) => selector({
      worlds: {},
      currentWorldId: null,
      loading: true,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
      createWorld: jest.fn(),
      updateWorld: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-screen-loading-indicator')).toBeInTheDocument();
  });

  test('renders error message when there is an error', () => {
    mockedWorldStore.mockImplementationOnce((selector: (state: WorldStore) => unknown) => selector({
      worlds: {},
      currentWorldId: null,
      loading: false,
      error: 'Failed to fetch worlds',
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
      createWorld: jest.fn(),
      updateWorld: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

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

    mockedWorldStore.mockImplementationOnce((selector: (state: WorldStore) => unknown) => selector({
      worlds: mockWorlds,
      currentWorldId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
      createWorld: jest.fn(),
      updateWorld: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
    expect(screen.getByTestId('world-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('world-item-2')).toBeInTheDocument();
    expect(screen.queryByTestId('world-list-empty-message')).not.toBeInTheDocument();
  });

  test('renders empty message when no worlds are available', () => {
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

    // Set up the initial render with worlds
    mockedWorldStore.mockImplementation((selector: (state: WorldStore) => unknown) => selector({
      worlds: mockWorlds,
      currentWorldId: null,
      loading: false,
      error: null,
      fetchWorlds: mockFetchWorlds,
      setCurrentWorld: mockSetCurrentWorld,
      deleteWorld: mockDeleteWorld,
      createWorld: jest.fn(),
      updateWorld: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

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
