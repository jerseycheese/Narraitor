import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface WizardStep {
  id: string;
  label: string;
}

export interface WizardState<T> {
  currentStep: number;
  data: T;
  errors: Record<string, string>;
  isProcessing: boolean;
  validation: Record<number, ValidationState>;
}

export interface ValidationState {
  valid: boolean;
  errors: string[];
  touched: boolean;
}

export interface WizardConfig<T> {
  steps: WizardStep[];
  initialData: T;
  onComplete: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  validateStep?: (step: number, data: T) => ValidationState;
  persistKey?: string;
  debug?: boolean;
}

export interface WizardHandlers<T> {
  handleNext: () => void;
  handleBack: () => void;
  handleCancel: () => void;
  handleComplete: () => void;
  updateData: (updates: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
}

export function useWizardState<T>(config: WizardConfig<T>) {
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
  const [state, setState] = useState<WizardState<T>>(() => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // State restored from persistence
          return parsed;
        } catch {
          // Failed to parse saved state, will use initial state
        }
      }
    }

    return {
      currentStep: 0,
      data: initialData,
      errors: {},
      isProcessing: false,
      validation: {},
    };
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

    setState(prev => ({ ...prev, isProcessing: true }));
    
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = prev.errors;
      return { ...prev, errors: rest };
    });
  }, []);

  const handlers: WizardHandlers<T> = {
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
