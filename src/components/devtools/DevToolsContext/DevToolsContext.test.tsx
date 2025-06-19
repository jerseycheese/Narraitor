import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevToolsContext, DevToolsProvider } from './DevToolsContext';

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
  it('provides default values when no provider is present', () => {
    render(<TestConsumer />);
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
  });

  it('provides initial state through provider', () => {
    // Mock the environment to ensure rendering
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <DevToolsProvider initialIsOpen={true}>
        <TestConsumer />
      </DevToolsProvider>
    );
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('open');
    
    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('toggles the state when toggle function is called', () => {
    // Mock the environment to ensure rendering
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <DevToolsProvider>
        <TestConsumer />
      </DevToolsProvider>
    );
    
    // Default state should be closed
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
    
    // Toggle to open
    fireEvent.click(screen.getByTestId('devtools-toggle'));
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('open');
    
    // Toggle back to closed
    fireEvent.click(screen.getByTestId('devtools-toggle'));
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
    
    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  it('renders children in production but disables DevTools functionality', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Mock production environment
    process.env.NODE_ENV = 'production';
    render(
      <DevToolsProvider>
        <TestConsumer />
        <div data-testid="child-component">Child</div>
      </DevToolsProvider>
    );
    // Children should render in production
    expect(screen.getByTestId('child-component')).toHaveTextContent('Child');
    // But DevTools should be disabled (always closed)
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
    
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('renders children in development with full DevTools functionality', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Mock development environment
    process.env.NODE_ENV = 'development';
    render(
      <DevToolsProvider initialIsOpen={true}>
        <TestConsumer />
        <div data-testid="child-component-dev">Child</div>
      </DevToolsProvider>
    );
    // Children should render in development
    expect(screen.getByTestId('child-component-dev')).toHaveTextContent('Child');
    // And DevTools should work normally (can be open)
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('open');
    
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
  });
});
