/**
 * MVP Tests for DevToolsPanel visibility controls
 * Issue #147: Individual debugging components can be toggled visible/hidden within the DevTools panel
 */

import React from 'react';
import { render } from '@testing-library/react';
import { DevToolsPanel } from '../DevToolsPanel';
import { DevToolsProvider } from '../../DevToolsContext';

describe('DevToolsPanel Visibility Controls - MVP', () => {
  test('renders without errors', () => {
    expect(() => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );
    }).not.toThrow();
  });
});