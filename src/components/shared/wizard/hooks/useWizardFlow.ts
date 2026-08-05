import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeJsonParse } from '@/lib/safeJsonParse';

// Wizard state plus the surrounding flow: optional localStorage persistence,
// a submit lifecycle, and cancel-routing. For step state with none of that,
// use `useWizardState` in @/hooks instead.

interface WizardStep {
  id: string;
  label: string;
}

export interface WizardFlowState<T> {
  currentStep: number;
  data: T;
  errors: Record<string, string>;
  isProcessing: boolean;
  validation: Record<number, ValidationState>;
}

interface ValidationState {
  valid: boolean;
  errors: string[];
  touched: boolean;
}

export interface WizardFlowConfig<T> {
  steps: WizardStep[];
  initialData: T;
  onComplete: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  validateStep?: (step: number, data: T) => ValidationState;
  persistKey?: string;
  debug?: boolean;
}

export interface WizardFlowHandlers<T> {
  handleNext: () => void;
  handleBack: () => void;
  handleCancel: () => void;
  handleComplete: () => void;
  updateData: (updates: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
}

export function useWizardFlow<T>(config: WizardFlowConfig<T>) {
  const router = useRouter();
  const { 
    steps, 
    initialData, 
    onComplete, 
    onCancel, 
    validateStep, 
    persistKey,
    debug = false 
  } = config;

  // Initialize state from localStorage if persist key provided
  const [state, setState] = useState<WizardFlowState<T>>(() => {
    if (persistKey && typeof window !== 'undefined') {
      const parsed = safeJsonParse<unknown>(
        localStorage.getItem(persistKey),
        null
      );

      // Only restore if the persisted value is actually a wizard state.
      // localStorage under a persistKey is untrusted input — it can hold
      // a value that isn't a WizardFlowState (foreign writer, manual edit,
      // corruption). Spreading that produced a state missing required
      // fields like `errors`, which crashed downstream consumers.
      const isWizardFlowState =
        parsed !== null &&
        typeof parsed === 'object' &&
        typeof (parsed as { currentStep?: unknown }).currentStep === 'number' &&
        typeof (parsed as { data?: unknown }).data === 'object';

      if (isWizardFlowState) {
        const persisted = parsed as Partial<WizardFlowState<T>> & {
          currentStep: number;
          data: Partial<T>;
        };
        // Merge saved data with initial data to handle schema migrations.
        // This ensures new fields in initialData are present even if not
        // in the saved state. Each top-level field is rebuilt explicitly
        // so a partial persisted state can never yield an undefined field.
        const initialState: WizardFlowState<T> = {
          currentStep: persisted.currentStep,
          data: { ...initialData, ...persisted.data },
          errors: persisted.errors ?? {},
          isProcessing: false,
          validation: persisted.validation ?? {},
        };

        if (validateStep) {
          const validation = validateStep(initialState.currentStep, initialState.data);
          return {
            ...initialState,
            validation: {
              ...initialState.validation,
              [initialState.currentStep]: { ...validation, touched: true },
            },
          };
        }

        return initialState;
      }
    }

    const initialState = {
      currentStep: 0,
      data: initialData,
      errors: {},
      isProcessing: false,
      validation: {},
    };

    if (validateStep) {
      const validation = validateStep(initialState.currentStep, initialState.data);
      return {
        ...initialState,
        validation: {
          ...initialState.validation,
          [initialState.currentStep]: { ...validation, touched: true },
        },
      };
    }

    return initialState;
  });

  // Persist state to localStorage
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(persistKey, JSON.stringify(state));
      // State persisted
    }
  }, [state, persistKey, debug]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    if (!validateStep) return { valid: true, errors: [], touched: true };
    
    const validation = validateStep(state.currentStep, state.data);
    setState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [state.currentStep]: { ...validation, touched: true },
      },
    }));
    
    return validation;
  }, [state.currentStep, state.data, validateStep]);

  // Validate current step when it changes
  useEffect(() => {
    if (!validateStep) return;
    
    const validation = validateStep(state.currentStep, state.data);
    setState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [state.currentStep]: { ...validation, touched: true },
      },
    }));
  }, [state.currentStep, state.data, validateStep]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    const validation = validateCurrentStep();
    if (!validation.valid) return;

    if (state.currentStep < steps.length - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [state.currentStep, steps.length, validateCurrentStep]);

  const handleBack = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const handleCancel = useCallback(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey);
    }
    
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [persistKey, onCancel, router]);

  const handleComplete = useCallback(async () => {
    // Validate all steps
    if (validateStep) {
      for (let i = 0; i < steps.length; i++) {
        const validation = validateStep(i, state.data);
        if (!validation.valid) {
          setState(prev => ({
            ...prev,
            currentStep: i,
            validation: {
              ...prev.validation,
              [i]: { ...validation, touched: true },
            },
          }));
          return;
        }
      }
    }

    setState(prev => {
      // Clear previous submit error before starting new attempt
      const { submit: _, ...otherErrors } = prev.errors;
      return { 
        ...prev, 
        isProcessing: true,
        errors: otherErrors
      };
    });
    
    try {
      await onComplete(state.data);
      
      // Clear persisted state on success
      if (persistKey && typeof window !== 'undefined') {
        localStorage.removeItem(persistKey);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        errors: { ...prev.errors, submit: error instanceof Error ? error.message : 'An error occurred' },
      }));
    }
  }, [state.data, steps.length, validateStep, onComplete, persistKey]);

  // Data update handlers
  const updateData = useCallback((updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates },
    }));
  }, []);

  const setError = useCallback((field: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  }, []);

  const clearError = useCallback((field: string) => {
    setState(prev => {
      const { [field]: _, ...rest } = prev.errors;
      return { ...prev, errors: rest };
    });
  }, []);

  const handlers: WizardFlowHandlers<T> = {
    handleNext,
    handleBack,
    handleCancel,
    handleComplete,
    updateData,
    setError,
    clearError,
  };

  return {
    state,
    handlers,
    currentStep: state.currentStep,
    isFirstStep: state.currentStep === 0,
    isLastStep: state.currentStep === steps.length - 1,
    stepValidation: state.validation[state.currentStep],
    currentError: state.errors.submit,
  };
}
