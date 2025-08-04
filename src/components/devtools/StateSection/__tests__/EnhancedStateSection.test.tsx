import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedStateSection } from '../EnhancedStateSection';
import { StateInspector } from '@/lib/utils/StateInspector';

// Mock the StateInspector
jest.mock('@/lib/utils/StateInspector');

// Mock the CollapsibleSection component
jest.mock('../../CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children, initialCollapsed }: { 
    title: string; 
    children: React.ReactNode; 
    initialCollapsed?: boolean;
  }) => (
    <div data-testid="collapsible-section">
      <button data-testid="toggle-button">{title}</button>
      {!initialCollapsed && (
        <div data-testid="collapsible-content">{children}</div>
      )}
    </div>
  )
}));

describe('EnhancedStateSection', () => {
  let mockStateInspector: jest.Mocked<StateInspector>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockStateInspector = {
      getStateSnapshot: jest.fn(),
      getValueAtPath: jest.fn(),
      getPathMetadata: jest.fn(),
      getChildPaths: jest.fn(),
      watchPath: jest.fn(),
    } as any;

    (StateInspector as jest.MockedClass<typeof StateInspector>).mockImplementation(() => mockStateInspector);

    // Setup default mock responses
    mockStateInspector.getStateSnapshot.mockReturnValue({
      worldStore: {
        worlds: { 'world-1': { id: 'world-1', name: 'Test World' } },
        currentWorldId: 'world-1'
      },
      characterStore: {
        characters: { 'char-1': { id: 'char-1', name: 'Test Character' } },
        currentCharacterId: 'char-1'
      }
    });

    mockStateInspector.getPathMetadata.mockReturnValue({
      exists: true,
      type: 'object',
      depth: 2,
      hasChildren: true,
      childCount: 2
    });

    mockStateInspector.getChildPaths.mockReturnValue([
      'worldStore.worlds',
      'worldStore.currentWorldId'
    ]);
  });

  describe('hierarchical state exploration', () => {
    it('should display current application state in expandable tree structure', () => {
      render(<EnhancedStateSection />);
      
      expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      expect(screen.getByText('Application State Inspector')).toBeInTheDocument();
      
      // Should show top-level stores
      expect(screen.getByText(/worldStore/)).toBeInTheDocument();
      expect(screen.getByText(/characterStore/)).toBeInTheDocument();
    });

    it('should show expandable nodes for complex objects', () => {
      mockStateInspector.getPathMetadata.mockReturnValue({
        exists: true,
        type: 'object',
        depth: 1,
        hasChildren: true,
        childCount: 3
      });

      render(<EnhancedStateSection />);
      
      const expandableNodes = screen.getAllByTestId('expandable-node');
      expect(expandableNodes.length).toBeGreaterThan(0);
      
      // Should show expand/collapse indicators
      const expandButtons = screen.getAllByTestId('expand-button');
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should expand child nodes when clicked', async () => {
      const user = userEvent.setup();
      
      mockStateInspector.getChildPaths.mockReturnValue([
        'worldStore.worlds.world-1.id',
        'worldStore.worlds.world-1.name'
      ]);

      render(<EnhancedStateSection />);
      
      const expandButton = screen.getByTestId('expand-button');
      await user.click(expandButton);
      
      expect(mockStateInspector.getChildPaths).toHaveBeenCalled();
      
      // Should show child nodes after expansion
      await waitFor(() => {
        expect(screen.getByText(/id/)).toBeInTheDocument();
        expect(screen.getByText(/name/)).toBeInTheDocument();
      });
    });

    it('should navigate to specific paths via breadcrumb navigation', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedStateSection />);
      
      const pathInput = screen.getByTestId('path-input');
      await user.type(pathInput, 'worldStore.worlds.world-1');
      
      const navigateButton = screen.getByTestId('navigate-path-button');
      await user.click(navigateButton);
      
      expect(mockStateInspector.getValueAtPath).toHaveBeenCalledWith('worldStore.worlds.world-1');
    });

    it('should show current navigation path as breadcrumbs', () => {
      render(<EnhancedStateSection currentPath="worldStore.worlds.world-1" />);
      
      const breadcrumbs = screen.getByTestId('breadcrumb-navigation');
      expect(breadcrumbs).toBeInTheDocument();
      
      expect(screen.getByText('worldStore')).toBeInTheDocument();
      expect(screen.getByText('worlds')).toBeInTheDocument();
      expect(screen.getByText('world-1')).toBeInTheDocument();
    });
  });

  describe('state change monitoring', () => {
    it('should provide options to watch specific paths', () => {
      render(<EnhancedStateSection />);
      
      const watchSection = screen.getByTestId('watch-section');
      expect(watchSection).toBeInTheDocument();
      
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      expect(watchInput).toBeInTheDocument();
      expect(watchButton).toBeInTheDocument();
    });

    it('should add path to watch list when requested', async () => {
      const user = userEvent.setup();
      
      mockStateInspector.watchPath.mockReturnValue(jest.fn()); // Mock unsubscribe function
      
      render(<EnhancedStateSection />);
      
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);
      
      expect(mockStateInspector.watchPath).toHaveBeenCalledWith(
        'worldStore.currentWorldId',
        expect.any(Function)
      );
      
      // Should show the watched path in the list
      expect(screen.getByTestId('watched-paths-list')).toBeInTheDocument();
      expect(screen.getByText('worldStore.currentWorldId')).toBeInTheDocument();
    });

    it('should display change notifications for watched paths', async () => {
      const user = userEvent.setup();
      
      let watchCallback: Function;
      mockStateInspector.watchPath.mockImplementation((path, callback) => {
        watchCallback = callback;
        return jest.fn();
      });
      
      render(<EnhancedStateSection />);
      
      // Add a watch
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);
      
      // Simulate a state change
      watchCallback!('world-2', 'world-1', 'worldStore.currentWorldId');
      
      await waitFor(() => {
        const changeNotification = screen.getByTestId('change-notification');
        expect(changeNotification).toBeInTheDocument();
        expect(changeNotification).toHaveTextContent('world-1 → world-2');
      });
    });

    it('should allow removing watched paths', async () => {
      const user = userEvent.setup();
      
      const mockUnsubscribe = jest.fn();
      mockStateInspector.watchPath.mockReturnValue(mockUnsubscribe);
      
      render(<EnhancedStateSection />);
      
      // Add a watch first
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);
      
      // Remove the watch
      const removeButton = screen.getByTestId('remove-watch-button');
      await user.click(removeButton);
      
      expect(mockUnsubscribe).toHaveBeenCalled();
      
      // Should no longer appear in watched paths list
      expect(screen.queryByText('worldStore.currentWorldId')).not.toBeInTheDocument();
    });

    it('should show change history for monitored paths', async () => {
      const user = userEvent.setup();
      
      let watchCallback: Function;
      mockStateInspector.watchPath.mockImplementation((path, callback) => {
        watchCallback = callback;
        return jest.fn();
      });
      
      render(<EnhancedStateSection />);
      
      // Add a watch
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);
      
      // Simulate multiple state changes
      watchCallback!('world-2', 'world-1', 'worldStore.currentWorldId');
      watchCallback!('world-3', 'world-2', 'worldStore.currentWorldId');
      
      const historySection = screen.getByTestId('change-history');
      expect(historySection).toBeInTheDocument();
      
      // Should show both changes in history
      expect(screen.getByText(/world-1 → world-2/)).toBeInTheDocument();
      expect(screen.getByText(/world-2 → world-3/)).toBeInTheDocument();
    });
  });

  describe('performance considerations', () => {
    it('should not impact application performance when not open', () => {
      render(<EnhancedStateSection collapsed={true} />);
      
      // Should not initialize StateInspector when collapsed
      expect(StateInspector).not.toHaveBeenCalled();
    });

    it('should initialize StateInspector only when needed', () => {
      const { rerender } = render(<EnhancedStateSection collapsed={true} />);
      
      expect(StateInspector).not.toHaveBeenCalled();
      
      // Expand the section
      rerender(<EnhancedStateSection collapsed={false} />);
      
      expect(StateInspector).toHaveBeenCalled();
    });

    it('should cleanup subscriptions when component unmounts', () => {
      const mockUnsubscribe = jest.fn();
      mockStateInspector.watchPath.mockReturnValue(mockUnsubscribe);
      
      const { unmount } = render(<EnhancedStateSection />);
      
      // Add a watch to create a subscription
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      fireEvent.change(watchInput, { target: { value: 'worldStore.currentWorldId' } });
      fireEvent.click(watchButton);
      
      // Unmount component
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should limit the number of simultaneously watched paths', async () => {
      const user = userEvent.setup();
      
      mockStateInspector.watchPath.mockReturnValue(jest.fn());
      
      render(<EnhancedStateSection maxWatchedPaths={2} />);
      
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      // Add first watch
      await user.clear(watchInput);
      await user.type(watchInput, 'worldStore.path1');
      await user.click(watchButton);
      
      // Add second watch
      await user.clear(watchInput);
      await user.type(watchInput, 'worldStore.path2');
      await user.click(watchButton);
      
      // Try to add third watch (should be prevented)
      await user.clear(watchInput);
      await user.type(watchInput, 'worldStore.path3');
      await user.click(watchButton);
      
      const watchedPaths = screen.getByTestId('watched-paths-list');
      const pathItems = watchedPaths.querySelectorAll('[data-testid="watched-path-item"]');
      
      expect(pathItems.length).toBe(2); // Should be limited to max
      expect(screen.getByTestId('max-watches-warning')).toBeInTheDocument();
    });
  });

  describe('development-only functionality', () => {
    it('should only render in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test in production environment
      process.env.NODE_ENV = 'production';
      
      const { container } = render(<EnhancedStateSection />);
      expect(container.firstChild).toBeNull();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should render in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      render(<EnhancedStateSection />);
      expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle StateInspector initialization failures gracefully', () => {
      (StateInspector as jest.MockedClass<typeof StateInspector>).mockImplementation(() => {
        throw new Error('StateInspector not available in production');
      });
      
      expect(() => render(<EnhancedStateSection />)).not.toThrow();
      
      // Should show error state instead of crashing
      expect(screen.getByTestId('inspector-error-state')).toBeInTheDocument();
      expect(screen.getByText(/State inspection not available/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedStateSection />);
      
      const pathInput = screen.getByTestId('path-input');
      const navigateButton = screen.getByTestId('navigate-path-button');
      
      // Should be able to tab between interactive elements
      await user.tab();
      expect(pathInput).toHaveFocus();
      
      await user.tab();
      expect(navigateButton).toHaveFocus();
    });

    it('should have proper ARIA labels for screen readers', () => {
      render(<EnhancedStateSection />);
      
      const pathInput = screen.getByTestId('path-input');
      const watchSection = screen.getByTestId('watch-section');
      
      expect(pathInput).toHaveAttribute('aria-label', expect.stringContaining('navigation path'));
      expect(watchSection).toHaveAttribute('aria-label', expect.stringContaining('watch paths'));
    });

    it('should announce state changes to screen readers', async () => {
      const user = userEvent.setup();
      
      let watchCallback: Function;
      mockStateInspector.watchPath.mockImplementation((path, callback) => {
        watchCallback = callback;
        return jest.fn();
      });
      
      render(<EnhancedStateSection />);
      
      // Add a watch
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');
      
      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);
      
      // Simulate a state change
      watchCallback!('world-2', 'world-1', 'worldStore.currentWorldId');
      
      const announcement = screen.getByTestId('sr-announcement');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveTextContent(/State changed/);
    });
  });
});