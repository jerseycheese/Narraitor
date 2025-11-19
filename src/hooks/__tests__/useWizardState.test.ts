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