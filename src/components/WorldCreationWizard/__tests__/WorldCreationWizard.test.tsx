import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the hooks with simple implementations
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(() => ({
    data: {},
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
  })),
  useErrorState: jest.fn(() => ({
    error: null,
    setError: jest.fn(),
    clearError: jest.fn(),
    hasError: false
  }))
}));

// Mock the world store
const mockStoreState = {
  worlds: {},
  currentWorldId: null,
  error: null,
  loading: false,
  createWorld: jest.fn().mockReturnValue('mock-world-id'),
  updateWorld: jest.fn(),
  deleteWorld: jest.fn(),
  setCurrentWorld: jest.fn(),
  fetchWorlds: jest.fn(),
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
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  }),
  worldStore: {
    getState: jest.fn(() => mockStoreState),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }
}));

// Import the component after mocks are set up
import WorldCreationWizard from '../WorldCreationWizard';

describe('WorldCreationWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<WorldCreationWizard />);
    expect(screen.getByText('Create New World')).toBeInTheDocument();
  });

  test('renders wizard container', () => {
    render(<WorldCreationWizard />);
    expect(screen.getByTestId('wizard-container')).toBeInTheDocument();
  });

  test('shows template selection on initial render', () => {
    render(<WorldCreationWizard />);
    expect(screen.getAllByText('Choose Template')).toHaveLength(2); // Step indicator + button
  });

  test('displays wizard step indicators', () => {
    render(<WorldCreationWizard />);
    // Check that step indicators are present
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});