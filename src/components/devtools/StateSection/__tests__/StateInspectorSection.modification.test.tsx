import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateInspectorSection } from '../StateInspectorSection';
import { stateInspector } from '@/lib/utils/stateInspector';

// Mock the state inspector
jest.mock('@/lib/utils/stateInspector', () => ({
  stateInspector: {
    registerStores: jest.fn(),
    getStateSnapshot: jest.fn(),
    getValueAtPath: jest.fn(),
    getPathMetadata: jest.fn(),
    getChildPaths: jest.fn(),
    watchPath: jest.fn(),
    clearAllWatchers: jest.fn(),
    getWatchCount: jest.fn(),
    setValueAtPath: jest.fn(), // Mock the new method
  }
}));

// Mock the stores module
jest.mock('@/state', () => ({
  testStore: jest.fn()
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  formatForDebug: jest.fn((value) => JSON.stringify(value)),
  getValueTypeInfo: jest.fn((value) => ({
    isArray: Array.isArray(value),
    constructor: value?.constructor?.name || 'Object'
  }))
}));

// Mock CollapsibleSection
jest.mock('../../CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children, ...props }: { title: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid={`collapsible-${title.replace(/\s+/g, '-').toLowerCase()}`} {...props}>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  )
}));

// Mock JsonViewer
jest.mock('../../JsonViewer', () => ({
  JsonViewer: ({ data, ...props }: { data: unknown; [key: string]: unknown }) => (
    <pre data-testid="json-viewer" {...props}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}));

describe('StateInspectorSection - Modification Controls', () => {
  const mockStateInspector = stateInspector as jest.Mocked<typeof stateInspector>;
  
  // Test data setup
  const mockSnapshot = {
    timestamp: Date.now(),
    storeStates: {
      testStore: {
        stringValue: 'test string',
        numberValue: 42,
        booleanValue: true,
        objectValue: { nested: 'value' },
        arrayValue: ['item1', 'item2']
      }
    },
    metadata: {
      totalStores: 1,
      totalPaths: 5,
      performanceWarnings: []
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockStateInspector.registerStores.mockImplementation(() => {});
    mockStateInspector.getStateSnapshot.mockReturnValue(mockSnapshot);
    mockStateInspector.getChildPaths.mockReturnValue([]);
    mockStateInspector.watchPath.mockReturnValue({ unsubscribe: jest.fn() });
    mockStateInspector.clearAllWatchers.mockImplementation(() => {});
    mockStateInspector.getWatchCount.mockReturnValue(0);
    mockStateInspector.setValueAtPath.mockReturnValue(true);
    
    // Mock NODE_ENV as development
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('edit controls rendering', () => {
    it('should render edit controls for modifiable primitive string values', async () => {
      // Mock path metadata for a string value
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'test string',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('test string');

      render(<StateInspectorSection />);

      // Navigate to a string value path
      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        expect(mockStateInspector.getValueAtPath).toHaveBeenCalledWith('testStore.stringValue');
        expect(mockStateInspector.getPathMetadata).toHaveBeenCalledWith('testStore.stringValue');
      });

      // Should show edit button for primitive values
      await waitFor(() => {
        const editButton = screen.queryByTestId('edit-value-button');
        expect(editButton).toBeInTheDocument();
      });
    });

    it('should render edit controls for modifiable primitive number values', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.numberValue',
        value: 42,
        type: 'number',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(42);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.numberValue');

      await waitFor(() => {
        const editButton = screen.queryByTestId('edit-value-button');
        expect(editButton).toBeInTheDocument();
      });
    });

    it('should render edit controls for modifiable primitive boolean values', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.booleanValue',
        value: true,
        type: 'boolean',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(true);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.booleanValue');

      await waitFor(() => {
        const toggleButton = screen.queryByTestId('toggle-boolean-button');
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('should not render edit controls for complex objects', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.objectValue',
        value: { nested: 'value' },
        type: 'object',
        depth: 1,
        hasChildren: true,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue({ nested: 'value' });

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.objectValue');

      await waitFor(() => {
        expect(mockStateInspector.getValueAtPath).toHaveBeenCalledWith('testStore.objectValue');
      });

      // Should NOT show edit controls for complex objects
      const editButton = screen.queryByTestId('edit-value-button');
      const toggleButton = screen.queryByTestId('toggle-boolean-button');
      expect(editButton).not.toBeInTheDocument();
      expect(toggleButton).not.toBeInTheDocument();
    });

    it('should not render edit controls for arrays', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.arrayValue',
        value: ['item1', 'item2'],
        type: 'array',
        depth: 1,
        hasChildren: true,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(['item1', 'item2']);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.arrayValue');

      await waitFor(() => {
        expect(mockStateInspector.getValueAtPath).toHaveBeenCalledWith('testStore.arrayValue');
      });

      // Should NOT show edit controls for arrays
      const editButton = screen.queryByTestId('edit-value-button');
      expect(editButton).not.toBeInTheDocument();
    });
  });

  describe('user input handling', () => {
    it('should handle string value editing workflow', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'original value',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('original value');

      render(<StateInspectorSection />);

      // Navigate to string path
      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      // Should show input field
      await waitFor(() => {
        expect(screen.getByTestId('edit-value-input')).toBeInTheDocument();
      });

      // Type new value
      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'new value');

      // Click save button
      const saveButton = screen.getByTestId('save-value-button');
      await userEvent.click(saveButton);

      // Should call setValueAtPath with new value
      expect(mockStateInspector.setValueAtPath).toHaveBeenCalledWith('testStore.stringValue', 'new value');
    });

    it('should handle number value editing with validation', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.numberValue',
        value: 42,
        type: 'number',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(42);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.numberValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Click edit and enter valid number
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, '100');

      const saveButton = screen.getByTestId('save-value-button');
      await userEvent.click(saveButton);

      expect(mockStateInspector.setValueAtPath).toHaveBeenCalledWith('testStore.numberValue', 100);
    });

    it('should handle boolean value toggling', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.booleanValue',
        value: true,
        type: 'boolean',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(true);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.booleanValue');

      await waitFor(() => {
        expect(screen.getByTestId('toggle-boolean-button')).toBeInTheDocument();
      });

      // Click toggle button
      const toggleButton = screen.getByTestId('toggle-boolean-button');
      await userEvent.click(toggleButton);

      expect(mockStateInspector.setValueAtPath).toHaveBeenCalledWith('testStore.booleanValue', false);
    });

    it('should allow canceling modifications without saving', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'original value',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('original value');

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Start editing
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'changed value');

      // Click cancel instead of save
      const cancelButton = screen.getByTestId('cancel-edit-button');
      await userEvent.click(cancelButton);

      // Should NOT call setValueAtPath
      expect(mockStateInspector.setValueAtPath).not.toHaveBeenCalled();

      // Should return to read-only state
      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
        expect(screen.queryByTestId('edit-value-input')).not.toBeInTheDocument();
      });
    });
  });

  describe('validation error handling', () => {
    it('should display validation errors for invalid number inputs', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.numberValue',
        value: 42,
        type: 'number',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(42);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.numberValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Start editing and enter invalid number
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'not a number');

      const saveButton = screen.getByTestId('save-value-button');
      await userEvent.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument();
        expect(screen.getByTestId('validation-error')).toHaveTextContent(/invalid number/i);
      });

      // Should NOT call setValueAtPath with invalid value
      expect(mockStateInspector.setValueAtPath).not.toHaveBeenCalled();
    });

    it('should display validation errors when setValueAtPath fails', async () => {
      // Mock setValueAtPath to return false (validation failed)
      mockStateInspector.setValueAtPath.mockReturnValue(false);
      
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'original',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('original');

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Edit and save
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'new value');

      const saveButton = screen.getByTestId('save-value-button');
      await userEvent.click(saveButton);

      // Should show error when setValueAtPath returns false
      await waitFor(() => {
        expect(screen.getByTestId('modification-error')).toBeInTheDocument();
        expect(screen.getByTestId('modification-error')).toHaveTextContent(/failed to modify/i);
      });
    });

    it('should clear validation errors when user starts typing again', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.numberValue',
        value: 42,
        type: 'number',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(42);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.numberValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Create validation error
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'invalid');

      const saveButton = screen.getByTestId('save-value-button');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await userEvent.clear(editInput);
      await userEvent.type(editInput, '123');

      await waitFor(() => {
        expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('integration with state changes', () => {
    it('should refresh value display after successful modification', async () => {
      let currentValue = 'original value';
      
      mockStateInspector.getPathMetadata.mockImplementation(() => ({
        path: 'testStore.stringValue',
        value: currentValue,
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      }));
      
      mockStateInspector.getValueAtPath.mockImplementation(() => currentValue);
      
      // Mock successful modification
      mockStateInspector.setValueAtPath.mockImplementation((path, newValue) => {
        currentValue = newValue as string;
        return true;
      });

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Modify value
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      const editInput = screen.getByTestId('edit-value-input');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'modified value');

      const saveButton = screen.getByTestId('save-value-button');
      await userEvent.click(saveButton);

      // Should refresh the display with new value
      await waitFor(() => {
        expect(mockStateInspector.getValueAtPath).toHaveBeenCalledTimes(2); // Initial + refresh
        expect(mockStateInspector.getPathMetadata).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });

    it('should work with path watchers to show real-time updates', async () => {
      jest.fn(); // Mock watch callback
      mockStateInspector.watchPath.mockReturnValue({ unsubscribe: jest.fn() });

      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'watched value',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('watched value');

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      // Set up watcher
      await waitFor(() => {
        const watchButton = screen.getByTestId('toggle-watch-button');
        expect(watchButton).toBeInTheDocument();
      });

      const watchButton = screen.getByTestId('toggle-watch-button');
      await userEvent.click(watchButton);

      expect(mockStateInspector.watchPath).toHaveBeenCalledWith(
        'testStore.stringValue',
        expect.any(Function)
      );
    });
  });

  describe('accessibility and UX', () => {
    it('should have proper ARIA labels for edit controls', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'test value',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('test value');

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-value-button');
        expect(editButton).toBeInTheDocument();
        expect(editButton).toHaveAttribute('aria-label', expect.stringContaining('Edit'));
      });
    });

    it('should provide clear visual feedback during editing states', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.stringValue',
        value: 'test value',
        type: 'string',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue('test value');

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.stringValue');

      await waitFor(() => {
        expect(screen.getByTestId('edit-value-button')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId('edit-value-button');
      await userEvent.click(editButton);

      // Should show edit mode indicators
      await waitFor(() => {
        expect(screen.getByTestId('edit-mode-indicator')).toBeInTheDocument();
        expect(screen.getByTestId('edit-value-input')).toHaveFocus();
      });
    });

    it('should support keyboard navigation for edit controls', async () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        path: 'testStore.booleanValue',
        value: true,
        type: 'boolean',
        depth: 1,
        hasChildren: false,
        isCircular: false
      });
      
      mockStateInspector.getValueAtPath.mockReturnValue(true);

      render(<StateInspectorSection />);

      const pathInput = screen.getByTestId('path-input');
      await userEvent.type(pathInput, 'testStore.booleanValue');

      await waitFor(() => {
        expect(screen.getByTestId('toggle-boolean-button')).toBeInTheDocument();
      });

      // Should support Enter key to toggle
      const toggleButton = screen.getByTestId('toggle-boolean-button');
      fireEvent.keyDown(toggleButton, { key: 'Enter' });

      expect(mockStateInspector.setValueAtPath).toHaveBeenCalledWith('testStore.booleanValue', false);
    });
  });

  describe('production mode behavior', () => {
    it('should not render modification controls in production', () => {
      // Mock production environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      });

      render(<StateInspectorSection />);

      // Should show production message instead of controls
      expect(screen.getByText(/not available in production/i)).toBeInTheDocument();
      
      // Should not show any edit controls
      expect(screen.queryByTestId('edit-value-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-boolean-button')).not.toBeInTheDocument();
    });
  });
});