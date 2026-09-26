import { useState, useCallback, useMemo, useRef } from 'react';

// In-memory step/data/validation state only. If you also want localStorage
// persistence, a submit lifecycle, and cancel-routing, use `useWizardFlow`
// in @/components/shared/wizard/hooks instead.

export interface WizardStep {
  id: string;
  label: string;
  isOptional?: boolean;
}

export interface WizardValidation {
  valid: boolean;
  errors: string[];
  touched: boolean;
  /**
   * Optional per-field error messages, keyed by field name. When a validator
   * populates this, consuming components can show a field's error only once
   * that specific field has been touched, instead of surfacing every
   * failing field in the step as soon as any one of them changes. Falls back
   * to the flat `errors` list (gated by `touched`) when omitted.
   */
  fieldErrors?: Record<string, string>;
}

interface WizardState<TData = unknown> {
  currentStep: number;
  data: TData;
  validation: Record<number, WizardValidation>;
  isProcessing?: boolean;
  errors?: Record<string, string>;
}

export interface UseWizardStateOptions<TData> {
  initialData: TData;
  initialStep?: number;
  steps: WizardStep[];
  onStepValidation?: (stepIndex: number, data: TData) => WizardValidation;
  validateOnUpdate?: boolean;
  onDataChange?: (data: TData) => void;
}

export interface UseWizardStateReturn<TData> {
  // State
  state: WizardState<TData>;
  currentStepConfig: WizardStep;
  canGoNext: boolean;
  canGoBack: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  
  // Actions
  goNext: () => void;
  goBack: () => void;
  goToStep: (stepIndex: number) => void;
  updateData: (updates: Partial<TData>) => void;
  setValidation: (stepIndex: number, validation: WizardValidation) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  reset: (
    newData?: TData,
    newStep?: number,
    newValidation?: Record<number, WizardValidation>
  ) => void;
}

export function useWizardState<TData = unknown>({
  initialData,
  initialStep = 0,
  steps,
  onStepValidation,
  validateOnUpdate = true,
  onDataChange,
}: UseWizardStateOptions<TData>): UseWizardStateReturn<TData> {
  const [state, setState] = useState<WizardState<TData>>({
    currentStep: initialStep,
    data: initialData,
    validation: {},
    isProcessing: false,
    errors: {},
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const onStepValidationRef = useRef(onStepValidation);
  onStepValidationRef.current = onStepValidation;

  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  // Memoized step config
  const currentStepConfig = useMemo(() => {
    return steps[state.currentStep] || steps[0];
  }, [steps, state.currentStep]);

  // Navigation helpers
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === steps.length - 1;
  const canGoBack = !isFirstStep;

  // Check if current step is valid
  // Handle edge cases: missing validation object, untouched state, and invalid state
  const currentStepValidation = state.validation[state.currentStep];
  const isCurrentStepValid = !currentStepValidation || 
                           (!currentStepValidation.touched && !currentStepValidation.errors.length) ||
                           (currentStepValidation.touched && currentStepValidation.valid);
  const canGoNext = !isLastStep && isCurrentStepValid && !state.isProcessing;

  // Actions
  const updateData = useCallback((updates: Partial<TData>) => {
    const prevState = stateRef.current;
    const newData = { ...prevState.data, ...updates };

    // Trigger validation if handler provided
    let newValidation = prevState.validation;
    if (onStepValidationRef.current && validateOnUpdate) {
      const validation = onStepValidationRef.current(prevState.currentStep, newData);
      newValidation = {
        ...prevState.validation,
        [prevState.currentStep]: validation,
      };
    }

    const nextState: WizardState<TData> = {
      ...prevState,
      data: newData,
      validation: newValidation,
    };

    stateRef.current = nextState;
    setState(nextState);

    // Call data change handler outside of the setState updater
    if (onDataChangeRef.current) {
      onDataChangeRef.current(newData);
    }
  }, [validateOnUpdate]);

  const goNext = useCallback(() => {
    const prev = stateRef.current;
    // Re-validate current step with current data before navigating
    let currentStepValid = true;
    let validation: WizardValidation | undefined;
    if (onStepValidationRef.current) {
      validation = onStepValidationRef.current(prev.currentStep, prev.data);
      currentStepValid = validation.valid;
    }
    
    // Only proceed if current step is valid and not processing
    if (!currentStepValid || prev.isProcessing) {
      if (validation) {
        const nextState = {
          ...prev,
          validation: {
            ...prev.validation,
            [prev.currentStep]: validation,
          },
        };
        stateRef.current = nextState;
        setState(nextState);
      }
      return;
    }
    
    const nextStep = Math.min(prev.currentStep + 1, steps.length - 1);
    if (nextStep === prev.currentStep) {
      return; // Already at last step
    }
    
    const nextState = {
      ...prev,
      currentStep: nextStep,
    };
    stateRef.current = nextState;
    setState(nextState);
  }, [steps.length]);

  const goBack = useCallback(() => {
    const prev = stateRef.current;
    if (prev.currentStep === 0) return;

    const nextState = {
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    };
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    const prev = stateRef.current;
    const nextState = {
      ...prev,
      currentStep: stepIndex,
    };
    stateRef.current = nextState;
    setState(nextState);
  }, [steps.length]);

  const setValidation = useCallback((stepIndex: number, validation: WizardValidation) => {
    const prev = stateRef.current;
    const nextState = {
      ...prev,
      validation: {
        ...prev.validation,
        [stepIndex]: validation,
      },
    };
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    const prev = stateRef.current;
    const nextState = {
      ...prev,
      isProcessing,
    };
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const setError = useCallback((key: string, error: string) => {
    const prev = stateRef.current;
    const nextState = {
      ...prev,
      errors: {
        ...prev.errors,
        [key]: error,
      },
    };
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const clearError = useCallback((key: string) => {
    const prev = stateRef.current;
    const newErrors = { ...prev.errors };
    delete newErrors[key];
    const nextState = {
      ...prev,
      errors: newErrors,
    };
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const reset = useCallback(
    (
      newData?: TData,
      newStep?: number,
      newValidation?: Record<number, WizardValidation>
    ) => {
      const nextData = newData ?? initialData;
      let nextStep = newStep ?? initialStep;
      if (nextStep < 0 || nextStep >= steps.length) {
        nextStep = initialStep;
      }
      const nextState: WizardState<TData> = {
        currentStep: nextStep,
        data: nextData,
        validation: newValidation ?? {},
        isProcessing: false,
        errors: {},
      };
      stateRef.current = nextState;
      setState(nextState);
      if (onDataChangeRef.current) {
        onDataChangeRef.current(nextData);
      }
    },
    [initialData, initialStep, steps.length]
  );

  return {
    state,
    currentStepConfig,
    canGoNext,
    canGoBack,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    goToStep,
    updateData,
    setValidation,
    setProcessing,
    setError,
    clearError,
    reset,
  };
}
