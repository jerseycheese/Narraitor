// src/state/__tests__/mockConfigurationStore.test.ts

import { act, renderHook } from '@testing-library/react';
import { useMockConfigurationStore } from '../mockConfigurationStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('MockConfigurationStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to default state
    act(() => {
      useMockConfigurationStore.getState().resetToDefaults();
    });
  });

  it('should enable and disable mock mode', () => {
    const { result } = renderHook(() => useMockConfigurationStore());

    expect(result.current.configuration.enabled).toBe(false);

    act(() => {
      result.current.enableMock(true);
    });

    expect(result.current.configuration.enabled).toBe(true);
  });

  it('should set active scenario', () => {
    const { result } = renderHook(() => useMockConfigurationStore());

    act(() => {
      result.current.setActiveScenario('success-fast');
    });

    expect(result.current.configuration.activeScenario).toBe('success-fast');
  });

  it('should add custom scenario', () => {
    const { result } = renderHook(() => useMockConfigurationStore());
    
    const initialCount = result.current.configuration.scenarios.length;

    act(() => {
      result.current.addScenario({
        name: 'Test Scenario',
        type: 'success',
        delay: 1000,
        description: 'Test scenario'
      });
    });

    expect(result.current.configuration.scenarios.length).toBe(initialCount + 1);
    const addedScenario = result.current.configuration.scenarios.find(s => s.name === 'Test Scenario');
    expect(addedScenario).toBeDefined();
    expect(addedScenario?.id).toMatch(/^custom-\d+$/);
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() => useMockConfigurationStore());

    // Modify configuration
    act(() => {
      result.current.enableMock(true);
      result.current.updateGlobalDelay(5000);
    });

    // Reset
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.configuration.enabled).toBe(false);
    expect(result.current.configuration.globalDelay).toBe(1000);
  });
});