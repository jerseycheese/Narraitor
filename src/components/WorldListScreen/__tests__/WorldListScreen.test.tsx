import React from 'react';
import { render, screen } from '@testing-library/react';
import type { World } from '../../../types/world.types';

// Mock the child components with simple implementations
jest.mock('../../WorldList/WorldList', () => {
  return {
    __esModule: true,
    default: ({ worlds }: { worlds: World[] }) => {
      return (
        <div data-testid="world-list-container">
          {worlds.length === 0 ? (
            <div data-testid="world-list-empty-message">No worlds created yet.</div>
          ) : (
            worlds.map(world => (
              <div key={world.id} data-testid={`world-item-${world.id}`}>
                {world.name}
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
    default: () => null
  };
});

// Mock the hooks to return simple, predictable values
jest.mock('../../../hooks', () => ({
  useFormState: jest.fn(() => ({
    data: { worlds: [], currentWorldId: null, worldToDeleteId: null },
    updateData: jest.fn(),
    updateField: jest.fn(),
    setData: jest.fn(),
    reset: jest.fn(),
    errors: [],
    hasErrors: false,
    isDirty: false,
    setErrors: jest.fn(),
    clearErrors: jest.fn(),
    validate: jest.fn(() => []),
    isValid: jest.fn(() => true)
  })),
  useAsyncState: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    execute: jest.fn(async (fn) => await fn()),
    reset: jest.fn(),
    clearError: jest.fn()
  })),
  useModal: jest.fn(() => ({
    isOpen: false,
    open: jest.fn(),
    close: jest.fn(),
    toggle: jest.fn(),
    modalProps: {
      isOpen: false,
      onClose: jest.fn()
    }
  }))
}));

// Mock worldStore with simple implementation
const mockWorldStore = {
  getState: jest.fn(() => ({
    worlds: {},
    currentWorldId: null,
    loading: false,
    error: null
  })),
  subscribe: jest.fn(() => () => {}) // Return unsubscribe function
};

jest.mock('../../../state/worldStore', () => ({
  useWorldStore: mockWorldStore
}));

// Import the component after mocks are set up
import WorldListScreen from '../WorldListScreen';

describe('WorldListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
  });

  test('calls worldStore on mount', () => {
    render(<WorldListScreen />);
    expect(mockWorldStore.getState).toHaveBeenCalled();
    expect(mockWorldStore.subscribe).toHaveBeenCalled();
  });

  test('renders world list container', () => {
    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
  });
});