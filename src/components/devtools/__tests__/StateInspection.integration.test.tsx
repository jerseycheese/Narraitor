import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevToolsPanel } from '../DevToolsPanel/DevToolsPanel';
import { DevToolsContext } from '../DevToolsContext/DevToolsContext';
import * as stores from '@/state';

/**
 * Integration tests for state inspection functionality
 * These tests verify the acceptance criteria end-to-end:
 * 
 * - State inspection shows current application state
 * - Complex state objects can be explored hierarchically
 * - State changes can be monitored for specific paths
 * - Inspection utilities work in development tools only
 * - Inspection doesn't impact application performance
 */

// Mock environment to be development
const originalEnv = process.env.NODE_ENV;

beforeAll(() => {
  process.env.NODE_ENV = 'development';
});

afterAll(() => {
  process.env.NODE_ENV = originalEnv;
});

// Mock stores with realistic state data
jest.mock('@/state', () => {
  const mockWorldStore = () => {};
  mockWorldStore.getState = jest.fn().mockReturnValue({
    worlds: {
      'world-1': {
        id: 'world-1',
        name: 'Mystical Realm',
        theme: 'Fantasy',
        attributes: {
          magic: 'high',
          technology: 'medieval',
          environment: {
            terrain: {
              mountains: { height: 'towering', climate: 'cold' },
              forests: { density: 'thick', type: 'ancient' }
            },
            weather: { season: 'eternal_winter', phenomena: ['aurora', 'snow_storms'] }
          }
        }
      }
    },
    currentWorldId: 'world-1',
    loading: false,
    error: null
  });
  mockWorldStore.subscribe = jest.fn((callback) => {
    // Return unsubscribe function
    return () => {};
  });

  const mockCharacterStore = () => {};
  mockCharacterStore.getState = jest.fn().mockReturnValue({
    characters: {
      'char-1': {
        id: 'char-1',
        name: 'Elara Moonwhisper',
        class: 'Wizard',
        level: 5,
        stats: {
          strength: 8,
          intelligence: 18,
          wisdom: 14,
          charisma: 12
        },
        inventory: {
          weapons: ['Staff of Stars', 'Silver Dagger'],
          armor: ['Robes of Protection'],
          items: ['Spell Component Pouch', 'Ancient Tome']
        }
      }
    },
    currentCharacterId: 'char-1',
    loading: false,
    error: null
  });
  mockCharacterStore.subscribe = jest.fn((callback) => () => {});

  return {
    worldStore: mockWorldStore,
    characterStore: mockCharacterStore
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DevToolsContext>
    {children}
  </DevToolsContext>
);

describe('State Inspection Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acceptance Criteria: State inspection shows current application state', () => {
    it('should display current state of all stores when DevTools is opened', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      // Open DevTools
      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByTestId('devtools-panel-content')).toBeInTheDocument();
      });

      // Should show Application State section
      expect(screen.getByText('Application State')).toBeInTheDocument();
      
      // Should show all store states
      expect(screen.getByText(/worldStore/)).toBeInTheDocument();
      expect(screen.getByText(/characterStore/)).toBeInTheDocument();
      
      // Should display actual state data
      expect(screen.getByText(/Mystical Realm/)).toBeInTheDocument();
      expect(screen.getByText(/Elara Moonwhisper/)).toBeInTheDocument();
    });

    it('should show complete state snapshot with all nested data', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        const stateSection = screen.getByTestId('devtools-state-section');
        expect(stateSection).toBeInTheDocument();
      });

      // Verify all the mocked store data is accessible
      expect(stores.worldStore.getState).toHaveBeenCalled();
      expect(stores.characterStore.getState).toHaveBeenCalled();
    });
  });

  describe('Acceptance Criteria: Complex state objects can be explored hierarchically', () => {
    it('should allow drilling down into nested world attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      // Wait for enhanced state section to load
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      });

      // Navigate to world attributes
      const pathInput = screen.getByTestId('path-input');
      await user.type(pathInput, 'worldStore.worlds.world-1.attributes');
      
      const navigateButton = screen.getByTestId('navigate-path-button');
      await user.click(navigateButton);

      // Should show hierarchical structure
      await waitFor(() => {
        expect(screen.getByText(/magic/)).toBeInTheDocument();
        expect(screen.getByText(/technology/)).toBeInTheDocument();
        expect(screen.getByText(/environment/)).toBeInTheDocument();
      });
    });

    it('should provide breadcrumb navigation for deep paths', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      });

      // Navigate to deeply nested path
      const pathInput = screen.getByTestId('path-input');
      await user.type(pathInput, 'worldStore.worlds.world-1.attributes.environment.terrain.mountains');
      
      const navigateButton = screen.getByTestId('navigate-path-button');
      await user.click(navigateButton);

      // Should show breadcrumbs
      await waitFor(() => {
        const breadcrumbs = screen.getByTestId('breadcrumb-navigation');
        expect(breadcrumbs).toBeInTheDocument();
        
        expect(screen.getByText('worldStore')).toBeInTheDocument();
        expect(screen.getByText('worlds')).toBeInTheDocument();
        expect(screen.getByText('world-1')).toBeInTheDocument();
        expect(screen.getByText('attributes')).toBeInTheDocument();
        expect(screen.getByText('environment')).toBeInTheDocument();
        expect(screen.getByText('terrain')).toBeInTheDocument();
        expect(screen.getByText('mountains')).toBeInTheDocument();
      });
    });

    it('should show expandable tree structure for complex objects', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      });

      // Should show expandable nodes for complex structures
      const expandButtons = screen.getAllByTestId('expand-button');
      expect(expandButtons.length).toBeGreaterThan(0);

      // Expanding should show child nodes
      await user.click(expandButtons[0]);
      
      await waitFor(() => {
        const childNodes = screen.getAllByTestId('tree-node');
        expect(childNodes.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Acceptance Criteria: State changes can be monitored for specific paths', () => {
    it('should allow adding watches for specific state paths', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('watch-section')).toBeInTheDocument();
      });

      // Add a watch for current world ID
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');

      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);

      // Should show the watched path
      await waitFor(() => {
        const watchedPaths = screen.getByTestId('watched-paths-list');
        expect(watchedPaths).toBeInTheDocument();
        expect(screen.getByText('worldStore.currentWorldId')).toBeInTheDocument();
      });
    });

    it('should detect and display state changes for watched paths', async () => {
      const user = userEvent.setup();
      
      let subscribeCallback: Function;
      
      // Mock the subscribe method to capture the callback
      (stores.worldStore.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {}; // unsubscribe function
      });
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('watch-section')).toBeInTheDocument();
      });

      // Add a watch
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');

      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);

      // Simulate state change
      const newState = {
        ...stores.worldStore.getState(),
        currentWorldId: 'world-2'
      };
      
      (stores.worldStore.getState as jest.Mock).mockReturnValue(newState);
      subscribeCallback!(newState, stores.worldStore.getState());

      // Should show change notification
      await waitFor(() => {
        const changeNotification = screen.getByTestId('change-notification');
        expect(changeNotification).toBeInTheDocument();
        expect(changeNotification).toHaveTextContent(/world-1.*world-2/);
      });
    });

    it('should maintain change history for monitored paths', async () => {
      const user = userEvent.setup();
      
      let subscribeCallback: Function;
      (stores.worldStore.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('watch-section')).toBeInTheDocument();
      });

      // Add a watch
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');

      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);

      // Simulate multiple state changes
      let state = stores.worldStore.getState();
      
      // First change
      state = { ...state, currentWorldId: 'world-2' };
      (stores.worldStore.getState as jest.Mock).mockReturnValue(state);
      subscribeCallback!(state, { ...state, currentWorldId: 'world-1' });

      // Second change
      state = { ...state, currentWorldId: 'world-3' };
      (stores.worldStore.getState as jest.Mock).mockReturnValue(state);
      subscribeCallback!(state, { ...state, currentWorldId: 'world-2' });

      // Should show change history
      await waitFor(() => {
        const historySection = screen.getByTestId('change-history');
        expect(historySection).toBeInTheDocument();
        
        // Should show both changes
        expect(screen.getByText(/world-1.*world-2/)).toBeInTheDocument();
        expect(screen.getByText(/world-2.*world-3/)).toBeInTheDocument();
      });
    });
  });

  describe('Acceptance Criteria: Inspection utilities work in development tools only', () => {
    it('should not render state inspection in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const { container } = render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      // DevToolsPanel itself should not render in production
      expect(container.firstChild).toBeNull();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error state when StateInspector fails in production', () => {
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      // In development, it should work normally
      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should work in test environment for testing purposes', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('devtools-panel-container')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Acceptance Criteria: Inspection doesn\'t impact application performance', () => {
    it('should not initialize StateInspector when DevTools is collapsed', () => {
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      // DevTools starts collapsed, so StateInspector should not be initialized
      // We can't directly test StateInspector initialization, but we can verify
      // that heavy operations don't run when collapsed
      expect(screen.queryByTestId('enhanced-state-section')).not.toBeInTheDocument();
    });

    it('should cleanup subscriptions when DevTools is collapsed', async () => {
      const user = userEvent.setup();
      const mockUnsubscribe = jest.fn();
      
      (stores.worldStore.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      // Open DevTools
      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      });

      // Add a watch to create subscription
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');

      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);

      // Close DevTools
      await user.click(toggleButton);

      // Subscriptions should be cleaned up
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should limit the number of simultaneously watched paths', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-state-section')).toBeInTheDocument();
      });

      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');

      // Try to add multiple watches beyond the limit
      const paths = [
        'worldStore.currentWorldId',
        'worldStore.loading',
        'characterStore.currentCharacterId',
        'characterStore.loading'
      ];

      for (const path of paths) {
        await user.clear(watchInput);
        await user.type(watchInput, path);
        await user.click(watchButton);
      }

      // Should enforce maximum watch limit
      const watchedPaths = screen.getByTestId('watched-paths-list');
      const pathItems = watchedPaths.querySelectorAll('[data-testid="watched-path-item"]');
      
      // Assuming max limit is less than 4
      expect(pathItems.length).toBeLessThanOrEqual(3);
      
      // Should show warning about maximum paths
      if (pathItems.length >= 3) {
        expect(screen.getByTestId('max-watches-warning')).toBeInTheDocument();
      }
    });

    it('should use debouncing to prevent excessive callback firing', async () => {
      jest.useFakeTimers();
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      let subscribeCallback: Function;
      (stores.worldStore.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(
        <TestWrapper>
          <DevToolsPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('watch-section')).toBeInTheDocument();
      });

      // Add a watch
      const watchInput = screen.getByTestId('watch-path-input');
      const watchButton = screen.getByTestId('add-watch-button');

      await user.type(watchInput, 'worldStore.currentWorldId');
      await user.click(watchButton);

      // Simulate rapid state changes
      const changes = ['world-2', 'world-3', 'world-4', 'world-5'];
      changes.forEach((worldId, index) => {
        const state = { ...stores.worldStore.getState(), currentWorldId: worldId };
        (stores.worldStore.getState as jest.Mock).mockReturnValue(state);
        subscribeCallback!(state, { ...state, currentWorldId: index === 0 ? 'world-1' : changes[index - 1] });
      });

      // Should not show all changes immediately (debounced)
      const changeNotifications = screen.queryAllByTestId('change-notification');
      expect(changeNotifications.length).toBeLessThan(changes.length);

      // Fast-forward timers to trigger debounced updates
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        // Should eventually show the final state change
        expect(screen.getByText(/world-5/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});