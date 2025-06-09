import { useState, useCallback, useMemo } from 'react';

export interface WizardStep {
  id: string;
  label: string;
  isOptional?: boolean;
}

export interface WizardValidation {
  valid: boolean;
  errors: string[];
  touched: boolean;
}

export interface WizardState<TData = unknown> {
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
  reset: () => void;
}

export function useWizardState<TData = unknown>({
  initialData,
  initialStep = 0,
  steps,
  onStepValidation,
  onDataChange,
}: UseWizardStateOptions<TData>): UseWizardStateReturn<TData> {
  const [state, setState] = useState<WizardState<TData>>({
    currentStep: initialStep,
    data: initialData,
    validation: {},
    isProcessing: false,
    errors: {},
  });

  // Memoized step config
  const currentStepConfig = useMemo(() => {
    return steps[state.currentStep] || steps[0];
  }, [steps, state.currentStep]);

  // Navigation helpers
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === steps.length - 1;
  const canGoBack = !isFirstStep;

  // Check if current step is valid
  const currentStepValidation = state.validation[state.currentStep];
  const isCurrentStepValid = !currentStepValidation || currentStepValidation.valid;
  const canGoNext = !isLastStep && isCurrentStepValid && !state.isProcessing;

  // Actions
  const updateData = useCallback((updates: Partial<TData>) => {
    setState(prev => {
      const newData = { ...prev.data, ...updates };
      
      // Trigger validation if handler provided
      let newValidation = prev.validation;
      if (onStepValidation) {
        const validation = onStepValidation(prev.currentStep, newData);
        newValidation = {
          ...prev.validation,
          [prev.currentStep]: validation,
        };
      }

      const newState = {
        ...prev,
        data: newData,
        validation: newValidation,
      };

      // Call data change handler
      if (onDataChange) {
        onDataChange(newData);
      }

      return newState;
    });
  }, [onStepValidation, onDataChange]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;

    setState(prev => {
      const nextStep = Math.min(prev.currentStep + 1, steps.length - 1);
      return {
        ...prev,
        currentStep: nextStep,
      };
    });
  }, [canGoNext, steps.length]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;

    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, [canGoBack]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    setState(prev => ({
      ...prev,
      currentStep: stepIndex,
    }));
  }, [steps.length]);

  const setValidation = useCallback((stepIndex: number, validation: WizardValidation) => {
    setState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [stepIndex]: validation,
      },
    }));
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({
      ...prev,
      isProcessing,
    }));
  }, []);

  const setError = useCallback((key: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [key]: error,
      },
    }));
  }, []);

  const clearError = useCallback((key: string) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[key];
      return {
        ...prev,
        errors: newErrors,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      currentStep: initialStep,
      data: initialData,
      validation: {},
      isProcessing: false,
      errors: {},
    });
  }, [initialData, initialStep]);

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