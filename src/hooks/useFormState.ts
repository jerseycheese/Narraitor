import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Configuration options for useFormState hook
 */
export interface UseFormStateOptions<T> {
  /** Initial form data */
  initialData: T;
  /** Optional validation function that returns array of error messages */
  validate?: (data: T) => string[];
  /** Whether to clear errors when form data changes */
  clearErrorsOnChange?: boolean;
}

/**
 * Return type for useFormState hook
 */
export interface UseFormStateReturn<T> {
  /** Current form data */
  data: T;
  /** Current validation errors */
  errors: string[];
  /** Whether the form has validation errors */
  hasErrors: boolean;
  /** Whether the form data has been modified from initial state */
  isDirty: boolean;
  /** Update a single field in the form data */
  updateField: (field: keyof T, value: T[keyof T]) => void;
  /** Update multiple fields at once */
  updateData: (updates: Partial<T>) => void;
  /** Set the entire form data (useful for loading existing data) */
  setData: (data: T) => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Manually set errors */
  setErrors: (errors: string[]) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Manually trigger validation */
  validate: () => string[];
  /** Check if form is valid (runs validation and returns boolean) */
  isValid: () => boolean;
}

/**
 * Custom hook for managing form state with validation and error handling
 * 
 * This hook abstracts the common pattern of:
 * - Form data state management
 * - Error state management
 * - Validation logic
 * - Dirty state tracking
 * 
 * @param options Configuration options for the form state
 * @returns Form state management object
 * 
 * @example
 * ```tsx
 * const form = useFormState({
 *   initialData: { name: '', email: '' },
 *   validate: (data) => {
 *     const errors = [];
 *     if (!data.name.trim()) errors.push('Name is required');
 *     if (!data.email.includes('@')) errors.push('Invalid email');
 *     return errors;
 *   },
 *   clearErrorsOnChange: true,
 * });
 * 
 * return (
 *   <form>
 *     <input 
 *       value={form.data.name}
 *       onChange={e => form.updateField('name', e.target.value)}
 *     />
 *     {form.errors.map(error => <div key={error}>{error}</div>)}
 *   </form>
 * );
 * ```
 */
export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T>
): UseFormStateReturn<T> {
  const {
    initialData,
    validate: validateFn,
    clearErrorsOnChange = true,
  } = options;

  const [data, setDataState] = useState<T>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [initialDataSnapshot] = useState<T>(() => ({ ...initialData }));

  // Validation function
  const validate = useCallback((): string[] => {
    if (!validateFn) return [];
    const validationErrors = validateFn(data);
    setErrors(validationErrors);
    return validationErrors;
  }, [data, validateFn]);

  // Auto-clear errors when data changes
  useEffect(() => {
    if (clearErrorsOnChange && errors.length > 0) {
      setErrors([]);
    }
  }, [data, clearErrorsOnChange]);

  // Update a single field
  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setDataState(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors if configured to do so
    if (clearErrorsOnChange && errors.length > 0) {
      setErrors([]);
    }
  }, [clearErrorsOnChange, errors.length]);

  // Update multiple fields
  const updateData = useCallback((updates: Partial<T>) => {
    setDataState(prev => ({
      ...prev,
      ...updates,
    }));

    // Clear errors if configured to do so
    if (clearErrorsOnChange && errors.length > 0) {
      setErrors([]);
    }
  }, [clearErrorsOnChange, errors.length]);

  // Set entire form data
  const setData = useCallback((newData: T) => {
    setDataState(newData);
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setDataState({ ...initialData });
    setErrors([]);
  }, [initialData]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Check if form is valid
  const isValid = useCallback((): boolean => {
    const validationErrors = validate();
    return validationErrors.length === 0;
  }, [validate]);

  // Compute derived state with optimized dirty checking
  const hasErrors = errors.length > 0;
  
  // Use memoized shallow comparison instead of JSON.stringify for better performance
  const isDirty = useMemo(() => {
    // For objects with few properties, use shallow comparison
    const dataKeys = Object.keys(data);
    const initialKeys = Object.keys(initialDataSnapshot);
    
    // Quick check: different number of keys means dirty
    if (dataKeys.length !== initialKeys.length) {
      return true;
    }
    
    // Check each key for changes (shallow comparison)
    for (const key of dataKeys) {
      if (data[key] !== initialDataSnapshot[key]) {
        return true;
      }
    }
    
    return false;
  }, [data, initialDataSnapshot]);

  return {
    data,
    errors,
    hasErrors,
    isDirty,
    updateField,
    updateData,
    setData,
    reset,
    setErrors,
    clearErrors,
    validate,
    isValid,
  };
}