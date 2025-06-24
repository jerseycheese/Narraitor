// Mock implementations for abstraction hooks
// This file provides Jest mocks for the abstraction hooks to prevent test failures

export const useFormState = jest.fn(() => ({
  data: {},
  updateField: jest.fn(),
  setData: jest.fn(),
  reset: jest.fn(),
  errors: [],
  hasErrors: false,
  isDirty: false,
  updateData: jest.fn(),
  setErrors: jest.fn(),
  clearErrors: jest.fn(),
  validate: jest.fn(() => []),
  isValid: jest.fn(() => true)
}));

export const useAsyncState = jest.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  status: 'idle' as const,
  execute: jest.fn(),
  reset: jest.fn(),
  setData: jest.fn(),
  setError: jest.fn()
}));

export const useModal = jest.fn(() => ({
  isOpen: false,
  open: jest.fn(),
  close: jest.fn(),
  toggle: jest.fn()
}));

export const useErrorState = jest.fn(() => ({
  error: null,
  hasError: false,
  setError: jest.fn(),
  clearError: jest.fn(),
  setErrorFromCatch: jest.fn()
}));

// Re-export other hooks that might be imported
export const useCharacterCreationAutoSave = jest.fn();
export const useNavigationFlow = jest.fn();
export const useNavigationLoading = jest.fn();
export const useNavigationPersistence = jest.fn();
export const usePointPoolManager = jest.fn();
export const useWizardState = jest.fn();
export const useAutoSave = jest.fn();