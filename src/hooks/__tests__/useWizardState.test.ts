import React, { useState } from 'react';
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

  it('can defer validation until navigation', () => {
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
        validateOnUpdate: false,
      })
    );

    act(() => {
      result.current.updateData({ age: 42 });
    });

    expect(result.current.state.validation[0]).toBeUndefined();

    act(() => {
      result.current.goNext();
    });

    expect(result.current.state.currentStep).toBe(0);
    expect(result.current.state.validation[0]).toEqual({
      valid: false,
      errors: ['Name is required'],
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

  it('resets state to provided restored data, step, and validation', () => {
    const onDataChange = jest.fn();
    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
        onDataChange,
      })
    );

    act(() => {
      result.current.reset(
        { name: 'Alice', age: 30, email: 'alice@example.com' },
        2,
        { 0: { valid: true, errors: [], touched: true } }
      );
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.data).toEqual({
      name: 'Alice',
      age: 30,
      email: 'alice@example.com',
    });
    expect(result.current.state.validation[0]).toEqual({
      valid: true,
      errors: [],
      touched: true,
    });
    expect(onDataChange).toHaveBeenCalledWith({
      name: 'Alice',
      age: 30,
      email: 'alice@example.com',
    });

    // Calling reset() with no args resets back to initial data and step 0
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(0);
    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.state.validation).toEqual({});
  });

  it('does not execute onDataChange inside the setState updater', () => {
    const onDataChange = jest.fn();
    const { result } = renderHook(
      () =>
        useWizardState({
          initialData,
          steps: testSteps,
          onDataChange,
        }),
      { wrapper: React.StrictMode }
    );

    act(() => {
      result.current.updateData({ name: 'Bob' });
    });

    // In React.StrictMode, state updater functions are executed twice in DEV mode.
    // If onDataChange were called inside the updater callback, it would run twice.
    // Executing outside the updater guarantees exactly one invocation.
    expect(onDataChange).toHaveBeenCalledTimes(1);
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bob' })
    );
  });

  it('carries a validator-supplied fieldErrors map through to state untouched', () => {
    const onStepValidation = jest.fn((stepIndex: number, data: TestData) => ({
      valid: data.name.length > 0,
      errors: data.name.length === 0 ? ['Name is required'] : [],
      touched: true,
      fieldErrors: data.name.length === 0 ? { name: 'Name is required' } : {},
    }));

    const { result } = renderHook(() =>
      useWizardState({
        initialData,
        steps: testSteps,
        onStepValidation,
      })
    );

    act(() => {
      result.current.updateData({ name: '' });
    });

    expect(result.current.state.validation[0]?.fieldErrors).toEqual({
      name: 'Name is required',
    });

    act(() => {
      result.current.updateData({ name: 'Ada' });
    });

    expect(result.current.state.validation[0]?.fieldErrors).toEqual({});
  });

  it('allows onDataChange to safely dispatch external state updates without render warnings', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(
      () => {
        const [mirrorName, setMirrorName] = useState('');
        const wizard = useWizardState({
          initialData,
          steps: testSteps,
          onDataChange: (data) => {
            setMirrorName(data.name);
          },
        });
        return { wizard, mirrorName };
      },
      { wrapper: React.StrictMode }
    );

    act(() => {
      result.current.wizard.updateData({ name: 'Charlie' });
    });

    expect(result.current.mirrorName).toBe('Charlie');
    expect(result.current.wizard.state.data.name).toBe('Charlie');

    // Confirm no React warnings such as "Cannot update a component while rendering a different component"
    const badSetStateCalls = consoleErrorSpy.mock.calls.filter((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Cannot update a component') ||
            arg.includes('Maximum update depth exceeded'))
      )
    );
    expect(badSetStateCalls).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });
});
