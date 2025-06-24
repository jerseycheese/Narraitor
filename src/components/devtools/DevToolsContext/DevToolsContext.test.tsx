import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevToolsContext, DevToolsProvider } from './DevToolsContext';

// Mock the hooks using mock utilities but handle environment conditions
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.stateful()
  });
});

// Using a function component instead of consumer pattern
const TestConsumer = () => {
  const value = React.useContext(DevToolsContext);
  return (
    <div>
      <div data-testid="devtools-status">{value.isOpen ? 'open' : 'closed'}</div>
      <button data-testid="devtools-toggle" onClick={value.toggleDevTools}>Toggle</button>
    </div>
  );
};

describe('DevToolsContext', () => {
  afterEach(() => {
    // Clean up between tests to avoid element conflicts
    document.body.innerHTML = '';
  });

  it('provides default values when no provider is present', () => {
    render(<TestConsumer />);
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
  });

  it('renders children and provides DevTools context based on environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Test production environment - DevTools disabled
    process.env.NODE_ENV = 'production';
    const { unmount: unmountProd } = render(
      <DevToolsProvider>
        <TestConsumer />
        <div data-testid="child-component">Child</div>
      </DevToolsProvider>
    );
    expect(screen.getByTestId('child-component')).toHaveTextContent('Child');
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
    unmountProd();
    
    // Test development environment - DevTools enabled
    process.env.NODE_ENV = 'development';
    render(
      <DevToolsProvider>
        <TestConsumer />
        <div data-testid="child-component-dev">Child</div>
      </DevToolsProvider>
    );
    expect(screen.getByTestId('child-component-dev')).toHaveTextContent('Child');
    // Context functions should be available for interaction
    expect(screen.getByTestId('devtools-toggle')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalNodeEnv;
  });
});
