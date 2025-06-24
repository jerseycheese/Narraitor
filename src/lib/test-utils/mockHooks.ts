/**
 * Test Utilities for Mocking Custom Hooks
 * 
 * This file provides utility functions to consistently mock custom hooks
 * (@/hooks) for testing components, reducing code duplication and ensuring
 * consistent behavior across tests.
 */

// Import React type definitions for component typing

// Type definitions for configuration objects
export interface MockFormStateConfig {
  behavior?: 'static' | 'stateful' | 'validation';
  initialData?: Record<string, unknown>;
  customValidation?: (data: Record<string, unknown>) => string[];
  enableDirtyTracking?: boolean;
}

export interface MockAsyncStateConfig {
  status?: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string | null;
  enableExecution?: boolean;
  mockExecute?: (fn: () => Promise<unknown>) => Promise<unknown>;
}

export interface MockModalConfig {
  initialOpen?: boolean;
  enableStateManagement?: boolean;
  includeModalProps?: boolean;
}

export interface MockErrorStateConfig {
  initialError?: string | null;
  enableErrorManagement?: boolean;
}

export interface MockHookModuleConfig {
  formState?: ReturnType<typeof createMockFormState>;
  asyncState?: ReturnType<typeof createMockAsyncState>;
  modal?: ReturnType<typeof createMockModal>;
  errorState?: ReturnType<typeof createMockErrorState>;
}

/**
 * Creates a mock implementation for useFormState hook
 */
export const createMockFormState = (config: MockFormStateConfig = {}) => {
  const {
    behavior = 'stateful',
    initialData = {},
    customValidation,
    enableDirtyTracking = false
  } = config;

  // Shared state object that persists across mock calls
  const sharedState = {
    data: { ...initialData },
    errors: [] as string[],
    isDirty: false
  };

  return jest.fn((options?: { initialData?: Record<string, unknown>; validate?: (data: Record<string, unknown>) => string[] }) => {
    if (behavior === 'static') {
      // Static behavior - no state management
      return {
        data: options?.initialData || initialData,
        updateField: jest.fn(),
        updateData: jest.fn(),
        setData: jest.fn(),
        reset: jest.fn(),
        errors: [],
        hasErrors: false,
        isDirty: enableDirtyTracking,
        setErrors: jest.fn(),
        clearErrors: jest.fn(),
        validate: jest.fn(() => []),
        isValid: jest.fn(() => true)
      };
    }

    // Initialize shared state if options provided and not already set
    if (options?.initialData && Object.keys(sharedState.data).length === 0) {
      sharedState.data = { ...options.initialData };
    }

    const validate = jest.fn(() => {
      let validationErrors: string[] = [];
      
      // Use custom validation if provided
      if (customValidation) {
        validationErrors = customValidation(sharedState.data);
      } else if (options?.validate) {
        validationErrors = options.validate(sharedState.data);
      }
      
      sharedState.errors = validationErrors;
      return validationErrors;
    });

    const isValid = jest.fn(() => {
      const currentErrors = validate();
      return currentErrors.length === 0;
    });

    const updateField = jest.fn((field: string, value: unknown) => {
      sharedState.data = { ...sharedState.data, [field]: value };
      if (enableDirtyTracking) {
        sharedState.isDirty = true;
      }
      // Clear errors when field is updated (common behavior)
      if (value && value.toString().trim && value.toString().trim()) {
        sharedState.errors = [];
      }
      // Debug logging can be enabled if needed
      // console.log('[MockFormState] updateField:', { field, value, newData: sharedState.data });
    });

    const updateData = jest.fn((updates: Record<string, unknown>) => {
      sharedState.data = { ...sharedState.data, ...updates };
      if (enableDirtyTracking) {
        sharedState.isDirty = true;
      }
    });

    const setData = jest.fn((newData: Record<string, unknown>) => {
      sharedState.data = { ...newData };
      if (enableDirtyTracking) {
        sharedState.isDirty = true;
      }
    });

    return {
      data: sharedState.data,
      updateField,
      updateData,
      setData,
      reset: jest.fn(() => {
        sharedState.data = { ...(options?.initialData || initialData) };
        sharedState.errors = [];
        sharedState.isDirty = false;
      }),
      errors: sharedState.errors,
      hasErrors: sharedState.errors.length > 0,
      isDirty: sharedState.isDirty,
      setErrors: jest.fn((newErrors: string[]) => { 
        sharedState.errors = newErrors; 
      }),
      clearErrors: jest.fn(() => { 
        sharedState.errors = []; 
      }),
      validate,
      isValid
    };
  });
};

/**
 * Creates a mock implementation for useAsyncState hook
 */
export const createMockAsyncState = (config: MockAsyncStateConfig = {}) => {
  const {
    status = 'idle',
    data = null,
    error = null,
    enableExecution = true,
    mockExecute
  } = config;

  return jest.fn(() => {
    if (!enableExecution) {
      // Static behavior
      return {
        data,
        isLoading: status === 'loading',
        error,
        status,
        execute: jest.fn(),
        reset: jest.fn(),
        setData: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn()
      };
    }

    // For test environments, use mock state to avoid memory leaks
    let mockAsyncData = data;
    let mockIsLoading = status === 'loading';
    let mockAsyncError = error;

    const execute = jest.fn(async (fn: () => Promise<unknown>) => {
      if (mockExecute) {
        return mockExecute(fn);
      }

      mockIsLoading = true;
      mockAsyncError = null;
      
      try {
        // Actually execute the provided function
        const result = await fn();
        mockAsyncData = result;
        mockIsLoading = false;
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        mockAsyncError = errorMessage;
        mockIsLoading = false;
        throw err; // Re-throw to maintain error handling behavior
      }
    });

    return {
      get data() { return mockAsyncData; },
      get isLoading() { return mockIsLoading; },
      get error() { return mockAsyncError; },
      get status() { 
        return mockIsLoading ? 'loading' : (mockAsyncError ? 'error' : (mockAsyncData ? 'success' : 'idle'));
      },
      execute,
      reset: jest.fn(() => {
        mockAsyncData = null;
        mockIsLoading = false;
        mockAsyncError = null;
      }),
      setData: jest.fn((newData: unknown) => {
        mockAsyncData = newData;
      }),
      setError: jest.fn((newError: string) => {
        mockAsyncError = newError;
      }),
      clearError: jest.fn(() => {
        mockAsyncError = null;
      })
    };
  });
};

/**
 * Creates a mock implementation for useModal hook
 */
export const createMockModal = (config: MockModalConfig = {}) => {
  const {
    initialOpen = false,
    enableStateManagement = true,
    includeModalProps = true
  } = config;

  return jest.fn((options?: { initialOpen?: boolean }) => {
    if (!enableStateManagement) {
      // Static behavior
      const isOpen = options?.initialOpen ?? initialOpen;
      const mockReturn = {
        isOpen,
        open: jest.fn(),
        close: jest.fn(),
        toggle: jest.fn()
      };

      if (includeModalProps) {
        (mockReturn as typeof mockReturn & { modalProps: { isOpen: boolean; onClose: jest.Mock } }).modalProps = {
          isOpen,
          onClose: jest.fn()
        };
      }

      return mockReturn;
    }

    // For test environments, use mock state to avoid memory leaks
    let mockIsOpen = options?.initialOpen ?? initialOpen;

    const mockReturn = {
      get isOpen() { return mockIsOpen; },
      open: jest.fn(() => { mockIsOpen = true; }),
      close: jest.fn(() => { mockIsOpen = false; }),
      toggle: jest.fn(() => { mockIsOpen = !mockIsOpen; })
    };

    if (includeModalProps) {
      (mockReturn as typeof mockReturn & { modalProps: { isOpen: boolean; onClose: jest.Mock } }).modalProps = {
        get isOpen() { return mockIsOpen; },
        onClose: jest.fn(() => { mockIsOpen = false; })
      };
    }

    return mockReturn;
  });
};

/**
 * Creates a mock implementation for useErrorState hook
 */
export const createMockErrorState = (config: MockErrorStateConfig = {}) => {
  const {
    initialError = null,
    enableErrorManagement = true
  } = config;

  return jest.fn(() => {
    if (!enableErrorManagement) {
      // Static behavior
      return {
        error: initialError,
        hasError: !!initialError,
        setError: jest.fn(),
        clearError: jest.fn(),
        setErrorFromCatch: jest.fn()
      };
    }

    // For test environments, use mock state to avoid memory leaks
    let mockError = initialError;

    return {
      get error() { return mockError; },
      get hasError() { return !!mockError; },
      setError: jest.fn((err: string | null) => { mockError = err; }),
      clearError: jest.fn(() => { mockError = null; }),
      setErrorFromCatch: jest.fn((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        mockError = errorMessage;
      })
    };
  });
};

/**
 * Preset configurations for common testing scenarios
 */
export const mockHookPresets = {
  formState: {
    static: () => createMockFormState({ behavior: 'static' }),
    stateful: () => createMockFormState({ behavior: 'stateful' }),
    withValidation: (customValidation?: (data: Record<string, unknown>) => string[]) => 
      createMockFormState({ behavior: 'validation', customValidation }),
    withDirtyTracking: () => createMockFormState({ behavior: 'stateful', enableDirtyTracking: true })
  },
  asyncState: {
    idle: () => createMockAsyncState({ status: 'idle' }),
    loading: () => createMockAsyncState({ status: 'loading' }),
    success: (data: unknown) => createMockAsyncState({ status: 'success', data }),
    error: (error: string) => createMockAsyncState({ status: 'error', error }),
    withExecution: () => createMockAsyncState({ enableExecution: true }),
    static: () => createMockAsyncState({ enableExecution: false })
  },
  modal: {
    closed: () => createMockModal({ initialOpen: false }),
    open: () => createMockModal({ initialOpen: true }),
    withProps: () => createMockModal({ includeModalProps: true }),
    static: () => createMockModal({ enableStateManagement: false })
  },
  errorState: {
    clean: () => createMockErrorState({ initialError: null }),
    withError: (error: string) => createMockErrorState({ initialError: error }),
    static: () => createMockErrorState({ enableErrorManagement: false })
  }
};

/**
 * Creates a complete mock module for @/hooks with specified configurations
 */
export const createHookMockModule = (config: MockHookModuleConfig = {}) => {
  return {
    useFormState: config.formState || mockHookPresets.formState.stateful(),
    useAsyncState: config.asyncState || mockHookPresets.asyncState.idle(),
    useModal: config.modal || mockHookPresets.modal.closed(),
    useErrorState: config.errorState || mockHookPresets.errorState.clean(),
    // Re-export other hooks that might be imported (from jest.setup.ts)
    useCharacterCreationAutoSave: jest.fn(),
    useNavigationFlow: jest.fn(),
    useNavigationLoading: jest.fn(),
    useNavigationPersistence: jest.fn(),
    usePointPoolManager: jest.fn(),
    useWizardState: jest.fn(),
    useAutoSave: jest.fn()
  };
};

/**
 * Convenience function to mock all hooks with default configurations
 */
export const mockAllHooks = (overrides: MockHookModuleConfig = {}) => {
  return createHookMockModule({
    formState: mockHookPresets.formState.stateful(),
    asyncState: mockHookPresets.asyncState.idle(),
    modal: mockHookPresets.modal.closed(),
    errorState: mockHookPresets.errorState.clean(),
    ...overrides
  });
};

/**
 * Quick setup for common testing patterns
 */
export const quickMockSetups = {
  // For form testing
  formTesting: () => createHookMockModule({
    formState: mockHookPresets.formState.withValidation(),
    modal: mockHookPresets.modal.withProps(),
    errorState: mockHookPresets.errorState.clean()
  }),
  
  // For async operations testing
  asyncTesting: () => createHookMockModule({
    asyncState: mockHookPresets.asyncState.withExecution(),
    errorState: mockHookPresets.errorState.clean()
  }),
  
  // For modal testing
  modalTesting: () => createHookMockModule({
    modal: mockHookPresets.modal.withProps(),
    formState: mockHookPresets.formState.stateful()
  }),
  
  // For simple component testing (static mocks)
  simpleTesting: () => createHookMockModule({
    formState: mockHookPresets.formState.static(),
    asyncState: mockHookPresets.asyncState.static(),
    modal: mockHookPresets.modal.static(),
    errorState: mockHookPresets.errorState.static()
  })
};