import { renderHook, act } from '@testing-library/react';
import { useWizardState, WizardStep } from '../useWizardState';

interface TestData {
  name: string;
  age: number;
  email: string;
}

const testSteps: WizardStep[] = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
];

const initialData: TestData = {
  name: '',
  age: 0,
  email: '',
};

describe('useWizardState', () => {
  it('should initialize with provided data and step', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        initialStep: 1,
        steps: testSteps,
      })
    );

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.currentStepConfig).toEqual(testSteps[1]);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should handle step navigation correctly', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
      })
    );

    // Initial state
    expect(result.current.state.currentStep).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoNext).toBe(true);

    // Go to next step
    act(() => {
      result.current.goNext();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoNext).toBe(true);

    // Go to last step
    act(() => {
      result.current.goNext();
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.isLastStep).toBe(true);
    expect(result.current.canGoNext).toBe(false);

    // Go back
    act(() => {
      result.current.goBack();
    });

    expect(result.current.state.currentStep).toBe(1);
  });

  it('should update data correctly', () => {
    const onDataChange = jest.fn();
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
        onDataChange,
      })
    );

    act(() => {
      result.current.updateData({ name: 'John', age: 30 });
    });

    expect(result.current.state.data).toEqual({
      name: 'John',
      age: 30,
      email: '',
    });
    expect(onDataChange).toHaveBeenCalledWith({
      name: 'John',
      age: 30,
      email: '',
    });
  });

  it('should handle validation correctly', () => {
    const onStepValidation = jest.fn((stepIndex, data: TestData) => {
      if (stepIndex === 0) {
        return {
          valid: data.name.length > 0,
          errors: data.name.length === 0 ? ['Name is required'] : [],
          touched: true,
        };
      }
      return { valid: true, errors: [], touched: true };
    });

    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
        onStepValidation,
      })
    );

    // Update data to trigger validation
    act(() => {
      result.current.updateData({ name: 'John' });
    });

    expect(onStepValidation).toHaveBeenCalledWith(0, {
      name: 'John',
      age: 0,
      email: '',
    });

    expect(result.current.state.validation[0]).toEqual({
      valid: true,
      errors: [],
      touched: true,
    });
  });

  it('should manage validation state correctly', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
      })
    );

    act(() => {
      result.current.setValidation(1, {
        valid: false,
        errors: ['Age is required'],
        touched: true,
      });
    });

    expect(result.current.state.validation[1]).toEqual({
      valid: false,
      errors: ['Age is required'],
      touched: true,
    });
  });

  it('should handle processing state', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
      })
    );

    act(() => {
      result.current.setProcessing(true);
    });

    expect(result.current.state.isProcessing).toBe(true);
    expect(result.current.canGoNext).toBe(false); // Should be disabled during processing

    act(() => {
      result.current.setProcessing(false);
    });

    expect(result.current.state.isProcessing).toBe(false);
  });

  it('should handle errors correctly', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
      })
    );

    act(() => {
      result.current.setError('submit', 'Submission failed');
    });

    expect(result.current.state.errors).toEqual({
      submit: 'Submission failed',
    });

    act(() => {
      result.current.clearError('submit');
    });

    expect(result.current.state.errors).toEqual({});
  });

  it('should navigate to specific steps', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
      })
    );

    act(() => {
      result.current.goToStep(2);
    });

    expect(result.current.state.currentStep).toBe(2);

    // Should not navigate to invalid step indices
    act(() => {
      result.current.goToStep(-1);
    });

    expect(result.current.state.currentStep).toBe(2); // Should remain unchanged

    act(() => {
      result.current.goToStep(5);
    });

    expect(result.current.state.currentStep).toBe(2); // Should remain unchanged
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        initialStep: 1,
        steps: testSteps,
      })
    );

    // Make some changes
    act(() => {
      result.current.updateData({ name: 'John' });
      result.current.goNext();
      result.current.setError('test', 'Test error');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(1); // Should reset to initial step
    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.state.validation).toEqual({});
    expect(result.current.state.errors).toEqual({});
  });

  it('should handle validation edge cases correctly', () => {
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
      })
    );

    // Test case 1: Missing validation object should allow navigation
    expect(result.current.canGoNext).toBe(true);

    // Test case 2: Untouched validation with no errors should allow navigation
    act(() => {
      result.current.setValidation(0, { valid: false, errors: [], touched: false });
    });
    expect(result.current.canGoNext).toBe(true);

    // Test case 3: Touched validation with errors should prevent navigation
    act(() => {
      result.current.setValidation(0, { valid: false, errors: ['Error'], touched: true });
    });
    expect(result.current.canGoNext).toBe(false);

    // Test case 4: Touched validation that is valid should allow navigation
    act(() => {
      result.current.setValidation(0, { valid: true, errors: [], touched: true });
    });
    expect(result.current.canGoNext).toBe(true);

    // Test case 5: Processing state should prevent navigation even if valid
    act(() => {
      result.current.setProcessing(true);
    });
    expect(result.current.canGoNext).toBe(false);
  });
});