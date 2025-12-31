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