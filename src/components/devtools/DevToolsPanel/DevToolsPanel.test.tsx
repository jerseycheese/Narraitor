import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevToolsPanel } from './DevToolsPanel';
import * as DevToolsContextModule from '../DevToolsContext';

// Mock the DevToolsContext module
jest.mock('../DevToolsContext', () => {
  const originalModule = jest.requireActual('../DevToolsContext');
  return {
    ...originalModule,
    useDevTools: jest.fn()
  };
});

// Mock the StateSection component
jest.mock('../StateSection', () => ({
  StateSection: () => <div data-testid="devtools-state-section">State Section</div>
}));

describe.skip('DevToolsPanel', () => {
  // Default mock implementation with collapsed state
  beforeEach(() => {
    (DevToolsContextModule.useDevTools as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleDevTools: jest.fn()
    });
  });

  afterEach(() => {
    // Clean up between tests
    jest.clearAllMocks();
  });

  it('renders with default collapsed state', () => {
    // Mock the environment
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    render(<DevToolsPanel />);
    
    // Panel header should always be visible
    expect(screen.getByTestId('devtools-panel-header')).toBeInTheDocument();
    
    // Content should be hidden by default
    const content = screen.queryByTestId('devtools-panel-content');
    expect(content).not.toBeInTheDocument();

    // Restore original environment
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });
  
  it('expands when toggle button is clicked', () => {
    // Mock the environment
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    const mockToggle = jest.fn();
    (DevToolsContextModule.useDevTools as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleDevTools: mockToggle
    });
    
    render(<DevToolsPanel />);
    
    // Click the toggle button
    fireEvent.click(screen.getByTestId('devtools-panel-toggle'));
    
    // Expect the toggle function to be called
    expect(mockToggle).toHaveBeenCalled();

    // Restore original environment
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });
  
  it('renders with expanded state when context isOpen is true', () => {
    // Mock the environment
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    // Set isOpen to true
    (DevToolsContextModule.useDevTools as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleDevTools: jest.fn()
    });
    
    render(<DevToolsPanel />);
    
    // Content should be visible
    const content = screen.getByTestId('devtools-panel-content');
    expect(content).toBeInTheDocument();

    // Restore original environment
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });
  
  it('displays correct toggle button text based on state', () => {
    // Mock the environment
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    // First render with isOpen false
    (DevToolsContextModule.useDevTools as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleDevTools: jest.fn()
    });
    
    const { rerender } = render(<DevToolsPanel />);
    
    // Default collapsed state
    expect(screen.getByTestId('devtools-panel-toggle')).toHaveTextContent('Show DevTools');
    
    // Update mock to simulate expanded state
    (DevToolsContextModule.useDevTools as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleDevTools: jest.fn()
    });
    
    // Re-render with updated state
    rerender(<DevToolsPanel />);
    
    // Now should show the hide text
    expect(screen.getByTestId('devtools-panel-toggle')).toHaveTextContent('Hide DevTools');

    // Restore original environment
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });
  
  it('renders state section in panel content', () => {
    // Mock the environment
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    // Set isOpen to true
    (DevToolsContextModule.useDevTools as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleDevTools: jest.fn()
    });
    
    render(<DevToolsPanel />);
    
    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();

    // Restore original environment
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });
  
  it('only renders in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Mock production environment
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const { container: prodContainer } = render(<DevToolsPanel />);
    expect(prodContainer.textContent).toBe('');
    
    // Mock development environment
    process.env.NODE_ENV = 'development';
    const { container: devContainer } = render(<DevToolsPanel />);
    expect(devContainer.textContent).not.toBe('');
    
    // Restore original environment
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });
});
