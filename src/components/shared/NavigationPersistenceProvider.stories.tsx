import type { Meta, StoryObj } from '@storybook/react';
import { NavigationPersistenceProvider } from './NavigationPersistenceProvider';
import { useNavigationStore } from '@/state/navigationStore';
import { useEffect, useState } from 'react';

// Mock the navigation persistence hook
const mockNavigationPersistence = {
  currentPath: '/test-path',
  isHydrated: true,
  navigateWithPersistence: (href: string) => console.log('Navigate to:', href),
  preferences: {
    sidebarCollapsed: false,
    breadcrumbsEnabled: true,
    autoNavigateOnSelect: true,
    showRecentPages: true,
    maxRecentPages: 10,
  },
  setCurrentPath: (path: string) => console.log('Set current path:', path),
  setCurrentFlowStep: (step: string) => console.log('Set flow step:', step),
  setBreadcrumbs: (breadcrumbs: string[]) => console.log('Set breadcrumbs:', breadcrumbs),
};

jest.mock('../../hooks/useNavigationPersistence', () => ({
  useNavigationPersistence: () => mockNavigationPersistence,
}));

const meta: Meta<typeof NavigationPersistenceProvider> = {
  title: 'Navigation/NavigationPersistenceProvider',
  component: NavigationPersistenceProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Provider component that initializes navigation state persistence and ensures proper hydration across sessions.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'Child components that will receive navigation persistence context',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test component to display navigation state
 */
function NavigationStateDisplay() {
  const { currentPath, isHydrated, history, preferences } = useNavigationStore();
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Navigation State</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Current State</h3>
          <p><strong>Current Path:</strong> {currentPath || 'None'}</p>
          <p><strong>Is Hydrated:</strong> {isHydrated ? 'Yes' : 'No'}</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">History ({history.length} items)</h3>
          {history.length > 0 ? (
            <ul className="space-y-1">
              {history.slice(0, 5).map((entry, index) => (
                <li key={index} className="text-sm">
                  {entry.path} - {entry.title || 'No title'}
                </li>
              ))}
              {history.length > 5 && (
                <li className="text-sm text-gray-500">... and {history.length - 5} more</li>
              )}
            </ul>
          ) : (
            <p className="text-gray-500">No history items</p>
          )}
        </div>
        
        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-semibold mb-2">Preferences</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>Sidebar Collapsed: {preferences.sidebarCollapsed ? 'Yes' : 'No'}</p>
            <p>Breadcrumbs: {preferences.breadcrumbsEnabled ? 'Yes' : 'No'}</p>
            <p>Auto Navigate: {preferences.autoNavigateOnSelect ? 'Yes' : 'No'}</p>
            <p>Show Recent: {preferences.showRecentPages ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component that simulates navigation interactions
 */
function NavigationControls() {
  const { setCurrentPath, addToHistory, updatePreferences } = useNavigationStore();
  
  const simulateNavigation = (path: string, title: string) => {
    setCurrentPath(path, title);
    addToHistory({
      path,
      title,
      timestamp: new Date().toISOString(),
    });
  };
  
  return (
    <div className="p-6 border-t">
      <h3 className="font-semibold mb-4">Test Navigation Actions</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => simulateNavigation('/worlds', 'My Worlds')}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Go to Worlds
        </button>
        <button
          onClick={() => simulateNavigation('/characters', 'Characters')}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Go to Characters
        </button>
        <button
          onClick={() => simulateNavigation('/world/fantasy', 'Fantasy World')}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
        >
          Go to Fantasy World
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updatePreferences({ sidebarCollapsed: !useNavigationStore.getState().preferences.sidebarCollapsed })}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Toggle Sidebar
        </button>
        <button
          onClick={() => updatePreferences({ showRecentPages: !useNavigationStore.getState().preferences.showRecentPages })}
          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
        >
          Toggle Recent Pages
        </button>
      </div>
    </div>
  );
}

/**
 * Default story showing initialized navigation state
 */
export const Default: Story = {
  args: {
    children: (
      <>
        <NavigationStateDisplay />
        <NavigationControls />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the NavigationPersistenceProvider with a hydrated navigation state and interactive controls.',
      },
    },
  },
};

/**
 * Loading state simulation
 */
/**
 * Loading state component 
 */
function LoadingStateComponent() {
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Simulate hydration after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationPersistenceProvider>
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Navigation Loading State</h2>
        {!isHydrated ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Initializing navigation...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-green-100 rounded mb-4">
              <p className="text-green-800">✓ Navigation successfully initialized!</p>
            </div>
            <NavigationStateDisplay />
          </>
        )}
      </div>
    </NavigationPersistenceProvider>
  );
}

export const LoadingState: Story = {
  render: () => <LoadingStateComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the loading state while navigation persistence is being initialized. The provider shows a loading message until hydration is complete.',
      },
    },
  },
};


/**
 * Multiple children components
 */
export const WithMultipleChildren: Story = {
  args: {
    children: (
      <>
        <div className="p-4 bg-blue-50">
          <h3 className="font-semibold">Header Component</h3>
          <p>This component can access navigation state through the provider.</p>
        </div>
        <NavigationStateDisplay />
        <div className="p-4 bg-gray-50">
          <h3 className="font-semibold">Sidebar Component</h3>
          <p>Another component that benefits from navigation persistence.</p>
        </div>
        <NavigationControls />
        <div className="p-4 bg-green-50">
          <h3 className="font-semibold">Footer Component</h3>
          <p>All child components have access to the navigation state.</p>
        </div>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the provider works with multiple child components, each having access to the navigation state.',
      },
    },
  },
};

/**
 * Pre-populated data component
 */
function PrePopulatedDataComponent() {
  useEffect(() => {
    // Pre-populate the navigation store with test data
    useNavigationStore.setState({
      currentPath: '/characters/wizard-character',
      previousPath: '/characters',
      isHydrated: true,
      history: [
        {
          path: '/worlds',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          title: 'My Worlds',
        },
        {
          path: '/characters',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          title: 'Character List',
        },
        {
          path: '/world/fantasy-realm',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          title: 'Fantasy Realm',
        },
      ],
      preferences: {
        sidebarCollapsed: true,
        breadcrumbsEnabled: true,
        autoNavigateOnSelect: false,
        showRecentPages: true,
        maxRecentPages: 5,
      },
      modals: {},
      currentFlowStep: 'character',
      breadcrumbs: ['Home', 'Characters', 'Wizard Character'],
    });
  }, []);
  
  return (
    <NavigationPersistenceProvider>
      <NavigationStateDisplay />
      <NavigationControls />
    </NavigationPersistenceProvider>
  );
}

/**
 * Navigation state with pre-populated data
 */
export const WithPrePopulatedData: Story = {
  render: () => <PrePopulatedDataComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Shows the provider with pre-populated navigation data, simulating a state that might be restored from storage.',
      },
    },
  },
};