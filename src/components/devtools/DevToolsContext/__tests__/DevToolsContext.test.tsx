/**
 * Tests for DevToolsContext component visibility toggles
 * Issue #147: Individual debugging components can be toggled visible/hidden within the DevTools panel
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Test component to access context
const TestComponent = () => {
  const context = useDevTools();
  
  return (
    <div>
      <div data-testid="is-open">{String(context.isOpen)}</div>
      <div data-testid="section-visibility">
        {JSON.stringify(context.sectionVisibility || {})}
      </div>
      <button onClick={context.toggleDevTools}>Toggle DevTools</button>
      <button 
        onClick={() => context.toggleSectionVisibility?.('stateSection')}
        data-testid="toggle-state-section"
      >
        Toggle State Section
      </button>
      <button 
        onClick={() => context.toggleSectionVisibility?.('aiTestingPanel')}
        data-testid="toggle-ai-testing"
      >
        Toggle AI Testing
      </button>
      <div data-testid="state-section-visible">
        {String(context.isSectionVisible?.('stateSection') ?? true)}
      </div>
      <div data-testid="ai-testing-visible">
        {String(context.isSectionVisible?.('aiTestingPanel') ?? true)}
      </div>
    </div>
  );
};

describe('DevToolsContext - Component Visibility Toggles', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to development for these tests
    originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original NODE_ENV
    if (originalEnv !== undefined) {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      });
    }
  });

  describe('Section Visibility Management', () => {
    test('provides default visibility state for all sections', () => {
      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // All sections should be visible by default
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('true');
    });

    test('allows toggling individual section visibility', () => {
      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Initially visible
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');

      // Toggle section visibility
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Should now be hidden
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');

      // Toggle back
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Should be visible again
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');
    });

    test('maintains independent visibility states for different sections', () => {
      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Both sections initially visible
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('true');

      // Hide state section
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Only state section should be hidden
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('true');

      // Hide AI testing
      fireEvent.click(screen.getByTestId('toggle-ai-testing'));

      // Both should now be hidden
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('false');
    });

    test('persists section visibility state to localStorage', () => {
      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Toggle section visibility
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'narraitor-devtools-section-visibility',
        expect.stringContaining('"stateSection":false')
      );
    });

    test('restores section visibility state from localStorage on initialization', () => {
      // Mock localStorage to return saved state
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          stateSection: false,
          aiTestingPanel: true,
        })
      );

      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Should restore from localStorage
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('true');
    });

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Should not throw when toggling visibility
      expect(() => {
        fireEvent.click(screen.getByTestId('toggle-state-section'));
      }).not.toThrow();

      // State should still update in memory
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
    });

    test('handles corrupted localStorage data gracefully', () => {
      // Mock localStorage to return invalid JSON
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Should fall back to default visibility (all visible)
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('true');
    });
  });

  describe('DevTools Panel Integration', () => {
    test('section visibility only works when DevTools panel is open', () => {
      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // DevTools closed by default
      expect(screen.getByTestId('is-open')).toHaveTextContent('false');

      // Section visibility should still work (for when panel is opened)
      fireEvent.click(screen.getByTestId('toggle-state-section'));
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
    });

    test('provides isSectionVisible function that works with or without DevTools open', () => {
      render(
        <DevToolsProvider>
          <TestComponent />
        </DevToolsProvider>
      );

      // Should work even when DevTools is closed
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');

      // Toggle and verify it works
      fireEvent.click(screen.getByTestId('toggle-state-section'));
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
    });
  });

  describe('Default Section Visibility Configuration', () => {
    test('supports custom default visibility via provider props', () => {
      const initialSectionVisibility = {
        stateSection: false,
        aiTestingPanel: true,
      };

      render(
        <DevToolsProvider defaultSectionVisibility={initialSectionVisibility}>
          <TestComponent />
        </DevToolsProvider>
      );

      // Should use provided defaults
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('false');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('true');
    });

    test('localStorage overrides provider defaults', () => {
      // Mock localStorage to return different state
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          stateSection: true,
          aiTestingPanel: false,
        })
      );

      const initialSectionVisibility = {
        stateSection: false,
        aiTestingPanel: true,
      };

      render(
        <DevToolsProvider defaultSectionVisibility={initialSectionVisibility}>
          <TestComponent />
        </DevToolsProvider>
      );

      // Should use localStorage values, not provider defaults
      expect(screen.getByTestId('state-section-visible')).toHaveTextContent('true');
      expect(screen.getByTestId('ai-testing-visible')).toHaveTextContent('false');
    });
  });
});