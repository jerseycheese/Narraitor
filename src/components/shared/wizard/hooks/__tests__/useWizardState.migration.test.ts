import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { useWizardState } from '../useWizardState';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

interface TestData {
  name: string;
  genre: string;
  worldTypeData: {
    worldType: 'original' | 'inspired_by' | 'set_within';
    worldReference: string;
    additionalDetails: string;
  };
}

describe('useWizardState - localStorage migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles migration when worldTypeData is missing from persisted state', () => {
    // Simulate old persisted state without worldTypeData
    const oldPersistedState = {
      currentStep: 1,
      data: {
        name: 'Test World',
        genre: 'fantasy',
        // Missing worldTypeData property
      },
      errors: {},
      isProcessing: false,
      validation: {},
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(oldPersistedState));

    const initialData: TestData = {
      name: '',
      genre: 'fantasy',
      worldTypeData: {
        worldType: 'original',
        worldReference: '',
        additionalDetails: ''
      }
    };

    const { result } = renderHook(() =>
      useWizardState({
        steps: [{ id: 'test', label: 'Test' }],
        initialData,
        onComplete: () => {},
        persistKey: 'test-wizard',
      })
    );

    // Should have merged the missing worldTypeData from initialData
    expect(result.current.state.data.worldTypeData).toEqual({
      worldType: 'original',
      worldReference: '',
      additionalDetails: ''
    });

    // Should preserve the existing data from localStorage
    expect(result.current.state.data.name).toBe('Test World');
    expect(result.current.state.data.genre).toBe('fantasy');
    expect(result.current.state.currentStep).toBe(1);
  });

  test('uses initial data when no persisted state exists', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const initialData: TestData = {
      name: '',
      genre: 'fantasy',
      worldTypeData: {
        worldType: 'original',
        worldReference: '',
        additionalDetails: ''
      }
    };

    const { result } = renderHook(() =>
      useWizardState({
        steps: [{ id: 'test', label: 'Test' }],
        initialData,
        onComplete: () => {},
        persistKey: 'test-wizard',
      })
    );

    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.state.currentStep).toBe(0);
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    const initialData: TestData = {
      name: '',
      genre: 'fantasy',
      worldTypeData: {
        worldType: 'original',
        worldReference: '',
        additionalDetails: ''
      }
    };

    const { result } = renderHook(() =>
      useWizardState({
        steps: [{ id: 'test', label: 'Test' }],
        initialData,
        onComplete: () => {},
        persistKey: 'test-wizard',
      })
    );

    // Should fall back to initial data when localStorage is corrupted
    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.state.currentStep).toBe(0);
  });

  test('computes initial step validation on first render when validateStep is provided', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const initialData: TestData = {
      name: '',
      genre: 'fantasy',
      worldTypeData: {
        worldType: 'original',
        worldReference: '',
        additionalDetails: ''
      }
    };

    const validateStep = jest.fn(() => ({
      valid: true,
      errors: [],
      touched: true,
    }));

    const WizardTest = () => {
      const wizard = useWizardState({
        steps: [{ id: 'test', label: 'Test' }],
        initialData,
        onComplete: () => {},
        validateStep,
        persistKey: 'test-wizard',
      });

      return createElement('button', { disabled: !wizard.stepValidation?.valid }, 'Next');
    };

    const { renderToString } = require('react-dom/server.node');
    const html = renderToString(createElement(WizardTest));

    expect(html).not.toContain('disabled');
  });
});
