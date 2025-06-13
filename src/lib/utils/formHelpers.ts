/**
 * Generic form state updater that preserves immutability
 */
export function createFormUpdater<T>(
  currentState: T,
  onStateChange: (newState: T) => void
) {
  return {
    /**
     * Updates a single field in the form state
     */
    updateField: <K extends keyof T>(field: K, value: T[K]) => {
      onStateChange({
        ...currentState,
        [field]: value
      });
    },

    /**
     * Updates multiple fields at once
     */
    updateFields: (updates: Partial<T>) => {
      onStateChange({
        ...currentState,
        ...updates
      });
    },

    /**
     * Updates a nested field (for object properties)
     */
    updateNestedField: <K extends keyof T, NK extends keyof T[K]>(
      field: K,
      nestedField: NK,
      value: T[K][NK]
    ) => {
      onStateChange({
        ...currentState,
        [field]: {
          ...(currentState[field] as object),
          [nestedField]: value
        }
      });
    },

    /**
     * Resets form to initial state
     */
    reset: (initialState: T) => {
      onStateChange(initialState);
    }
  };
}

/**
 * Utility for handling optional string fields (converts empty strings to undefined)
 */
export function normalizeOptionalString(value: string): string | undefined {
  return value.trim() === '' ? undefined : value.trim();
}

/**
 * Debounced form handler for expensive operations
 */
export function createDebouncedHandler<T extends unknown[]>(
  handler: (...args: T) => void,
  delay: number = 300
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler(...args), delay);
  };
}

/**
 * Creates a type-safe form field props generator
 */
export function createFieldProps<T, K extends keyof T>(
  state: T,
  updateField: (field: K, value: T[K]) => void,
  field: K
) {
  return {
    value: state[field],
    onChange: (value: T[K]) => updateField(field, value),
  };
}