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
  
  it('only renders children in development environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Mock production environment
    process.env.NODE_ENV = 'production';
    const { container: prodContainer } = render(
      <DevToolsProvider>
        <div data-testid="child-component">Child</div>
      </DevToolsProvider>
    );
    expect(prodContainer.textContent).toBe('');
    
    // Mock development environment
    process.env.NODE_ENV = 'development';
    const { container: devContainer } = render(
      <DevToolsProvider>
        <div data-testid="child-component">Child</div>
      </DevToolsProvider>
    );
    expect(devContainer.textContent).toBe('Child');
    
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
  });
});