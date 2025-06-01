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
  
  it('always renders children but only provides DevTools functionality in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Mock production environment
    process.env.NODE_ENV = 'production';
    const { container: prodContainer } = render(
      <DevToolsProvider>
        <div data-testid="child-component">Child</div>
        <TestConsumer />
      </DevToolsProvider>
    );
    expect(prodContainer.textContent).toContain('Child');
    // In production, isOpen should always be false
    expect(screen.getByTestId('devtools-status')).toHaveTextContent('closed');
    
    // Mock development environment
    process.env.NODE_ENV = 'development';
    render(
      <DevToolsProvider initialIsOpen={true}>
        <div data-testid="child-component">Child</div>
        <TestConsumer />
      </DevToolsProvider>
    );
    // In development, isOpen respects the initialIsOpen prop
    expect(screen.getAllByTestId('devtools-status')[1]).toHaveTextContent('open');
    
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
  });
});