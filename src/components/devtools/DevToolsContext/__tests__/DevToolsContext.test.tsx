/**
 * MVP Tests for DevTools section visibility toggles
 * Issue #147: Individual debugging components can be toggled visible/hidden within the DevTools panel
 */

import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { DevToolsProvider, useDevTools } from '../DevToolsContext';

describe('DevTools Section Visibility - MVP', () => {
  test('provides section visibility functions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DevToolsProvider>{children}</DevToolsProvider>
    );

    const { result } = renderHook(() => useDevTools(), { wrapper });

    expect(typeof result.current.isSectionVisible).toBe('function');
    expect(typeof result.current.toggleSectionVisibility).toBe('function');
  });

  test('sections are visible by default', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DevToolsProvider>{children}</DevToolsProvider>
    );

    const { result } = renderHook(() => useDevTools(), { wrapper });

    expect(result.current.isSectionVisible?.('stateSection')).toBe(true);
  });

  test('can toggle section visibility', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DevToolsProvider>{children}</DevToolsProvider>
    );

    const { result } = renderHook(() => useDevTools(), { wrapper });

    act(() => {
      result.current.toggleSectionVisibility?.('stateSection');
    });

    expect(result.current.isSectionVisible?.('stateSection')).toBe(false);
  });
});