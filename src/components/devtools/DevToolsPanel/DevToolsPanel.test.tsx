import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevToolsPanel } from './DevToolsPanel';

// Mock the hooks with functional behavior for meaningful testing
jest.mock('@/hooks', () => {
  return {
    useFormState: jest.fn((options) => {
      // Use actual React state for functional testing
      const [data, setData] = React.useState(options?.initialData || {});
      
      const updateField = jest.fn((field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
      });
      
      // Simulate immediate mounting for tests
      React.useEffect(() => {
        setData(prev => ({ ...prev, mounted: true }));
      }, []);
      
      return {
        data,
        updateField,
        updateData: jest.fn(),
        setData: jest.fn(),
        reset: jest.fn(),
        errors: [],
        hasErrors: false,
        isDirty: false,
        setErrors: jest.fn(),
        clearErrors: jest.fn(),
        validate: jest.fn(() => []),
        isValid: jest.fn(() => true)
      };
    })
  };
});

// Mock the DevToolsContext with functional toggle behavior  
jest.mock('../DevToolsContext', () => {
  const originalModule = jest.requireActual('../DevToolsContext');
  return {
    ...originalModule,
    useDevTools: jest.fn(() => ({
      isOpen: false,
      toggleDevTools: jest.fn()
    }))
  };
});

// Mock the StateSection component
jest.mock('../StateSection', () => ({
  StateSection: () => <div data-testid="devtools-state-section">State Section</div>
}));

describe('DevToolsPanel', () => {
  const mockToggleDevTools = jest.fn();
  const mockUseDevTools = require('../DevToolsContext').useDevTools;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDevTools.mockReturnValue({
      isOpen: false,
      toggleDevTools: mockToggleDevTools
    });
  });

  it('renders in development mode and responds to user interaction', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<DevToolsPanel />);
    
    // Should render the panel header in development
    expect(screen.getByTestId('devtools-panel-header')).toBeInTheDocument();
    expect(screen.getByText('Narraitor DevTools')).toBeInTheDocument();
    
    // Should have toggle button that responds to clicks
    const toggleButton = screen.getByTestId('devtools-panel-toggle');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(mockToggleDevTools).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });
  
  it('shows expanded content when open', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    mockUseDevTools.mockReturnValue({
      isOpen: true,
      toggleDevTools: mockToggleDevTools
    });
    
    render(<DevToolsPanel />);
    
    // Should show content sections when expanded
    expect(screen.getByTestId('devtools-panel-content')).toBeInTheDocument();
    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('does not render in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const { container } = render(<DevToolsPanel />);
    // In production, should not render DevTools content
    expect(screen.queryByTestId('devtools-panel-header')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalNodeEnv;
  });
});
