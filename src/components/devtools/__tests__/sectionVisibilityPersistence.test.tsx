/**
 * Integration tests for DevTools section visibility persistence
 * Issue #147: Component visibility state persists across page refreshes
 */

import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { DevToolsProvider, useDevTools } from '../DevToolsContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock logger
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

describe('DevTools Section Visibility Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    });
  });

  describe('localStorage Integration', () => {
    test('saves section visibility state to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Toggle section visibility
      act(() => {
        result.current.toggleSectionVisibility?.('stateSection');
      });

      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'narraitor-devtools-section-visibility',
        expect.stringContaining('"stateSection":false')
      );
    });

    test('saves multiple section visibility changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Toggle multiple sections
      act(() => {
        result.current.toggleSectionVisibility?.('stateSection');
        result.current.toggleSectionVisibility?.('aiTestingPanel');
        result.current.toggleSectionVisibility?.('testDataGenerator');
      });

      // Should save final state to localStorage
      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
      const savedState = JSON.parse(lastCall[1]);
      
      expect(savedState).toEqual({
        stateSection: false,
        aiTestingPanel: false,
        testDataGenerator: false,
      });
    });

    test('restores section visibility state from localStorage on initialization', () => {
      // Mock localStorage to return saved state
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          stateSection: false,
          aiTestingPanel: true,
          testDataGenerator: false,
        })
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Should restore visibility from localStorage
      expect(result.current.isSectionVisible?.('stateSection')).toBe(false);
      expect(result.current.isSectionVisible?.('aiTestingPanel')).toBe(true);
      expect(result.current.isSectionVisible?.('testDataGenerator')).toBe(false);
    });

    test('uses default visibility when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Should use default visibility (all sections visible)
      expect(result.current.isSectionVisible?.('stateSection')).toBe(true);
      expect(result.current.isSectionVisible?.('aiTestingPanel')).toBe(true);
      expect(result.current.isSectionVisible?.('testDataGenerator')).toBe(true);
    });

    test('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Should fall back to default visibility when JSON is invalid
      expect(result.current.isSectionVisible?.('stateSection')).toBe(true);
      expect(result.current.isSectionVisible?.('aiTestingPanel')).toBe(true);
      expect(result.current.isSectionVisible?.('testDataGenerator')).toBe(true);
    });

    test('handles localStorage quota exceeded errors', () => {
      // Mock localStorage to throw quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Should handle error gracefully and still update in-memory state
      expect(() => {
        act(() => {
          result.current.toggleSectionVisibility?.('stateSection');
        });
      }).not.toThrow();

      // In-memory state should still be updated
      expect(result.current.isSectionVisible?.('stateSection')).toBe(false);
    });

    test('handles general localStorage errors', () => {
      // Mock localStorage to throw general error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Should handle error gracefully
      expect(() => {
        act(() => {
          result.current.toggleSectionVisibility?.('stateSection');
        });
      }).not.toThrow();

      // In-memory state should still be updated
      expect(result.current.isSectionVisible?.('stateSection')).toBe(false);
    });
  });

  describe('State Persistence Across Re-renders', () => {
    test('maintains section visibility state across context re-renders', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result, rerender } = renderHook(() => useDevTools(), { wrapper });

      // Toggle section visibility
      act(() => {
        result.current.toggleSectionVisibility?.('stateSection');
      });

      expect(result.current.isSectionVisible?.('stateSection')).toBe(false);

      // Force re-render
      rerender();

      // State should persist across re-renders
      expect(result.current.isSectionVisible?.('stateSection')).toBe(false);
    });

    test('simulates page refresh by re-initializing provider with localStorage data', () => {
      // First "session" - set some visibility state
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result: result1 } = renderHook(() => useDevTools(), { wrapper: wrapper1 });

      // Toggle some sections
      act(() => {
        result1.current.toggleSectionVisibility?.('stateSection');
        result1.current.toggleSectionVisibility?.('aiTestingPanel');
      });

      // Capture what was saved to localStorage
      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
      const savedState = lastCall[1];

      // "Page refresh" - new provider instance with localStorage data
      mockLocalStorage.getItem.mockReturnValue(savedState);

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result: result2 } = renderHook(() => useDevTools(), { wrapper: wrapper2 });

      // Should restore the same state
      expect(result2.current.isSectionVisible?.('stateSection')).toBe(false);
      expect(result2.current.isSectionVisible?.('aiTestingPanel')).toBe(false);
      expect(result2.current.isSectionVisible?.('testDataGenerator')).toBe(true);
    });
  });

  describe('Section Visibility API', () => {
    test('provides toggleSectionVisibility function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      expect(typeof result.current.toggleSectionVisibility).toBe('function');
    });

    test('provides isSectionVisible function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      expect(typeof result.current.isSectionVisible).toBe('function');
    });

    test('provides setSectionVisibility function for bulk updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      expect(typeof result.current.setSectionVisibility).toBe('function');

      // Test bulk update
      act(() => {
        result.current.setSectionVisibility?.({
          stateSection: false,
          aiTestingPanel: false,
          testDataGenerator: true,
        });
      });

      expect(result.current.isSectionVisible?.('stateSection')).toBe(false);
      expect(result.current.isSectionVisible?.('aiTestingPanel')).toBe(false);
      expect(result.current.isSectionVisible?.('testDataGenerator')).toBe(true);
    });

    test('setSectionVisibility saves to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      act(() => {
        result.current.setSectionVisibility?.({
          stateSection: false,
          aiTestingPanel: true,
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'narraitor-devtools-section-visibility',
        expect.stringContaining('"stateSection":false')
      );
    });
  });

  describe('Known Section IDs', () => {
    test('supports all defined section IDs', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      const knownSections = [
        'stateSection',
        'stateInspectorSection',
        'aiTestingPanel',
        'testDataGenerator',
        'portraitDebug',
        'endingImageDebug',
        'consistencyValidation',
        'textNormalization',
        'loreManagement',
      ];

      knownSections.forEach(sectionId => {
        // Should have default visibility
        expect(result.current.isSectionVisible?.(sectionId)).toBe(true);

        // Should be able to toggle
        act(() => {
          result.current.toggleSectionVisibility?.(sectionId);
        });

        expect(result.current.isSectionVisible?.(sectionId)).toBe(false);
      });
    });

    test('handles unknown section IDs gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DevToolsProvider>{children}</DevToolsProvider>
      );

      const { result } = renderHook(() => useDevTools(), { wrapper });

      // Unknown section should default to visible
      expect(result.current.isSectionVisible?.('unknownSection')).toBe(true);

      // Should be able to toggle unknown sections
      act(() => {
        result.current.toggleSectionVisibility?.('unknownSection');
      });

      expect(result.current.isSectionVisible?.('unknownSection')).toBe(false);
    });
  });
});