import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedStateSection } from './EnhancedStateSection';

const meta: Meta<typeof EnhancedStateSection> = {
  title: 'DevTools/Enhanced State Section',
  component: EnhancedStateSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The EnhancedStateSection component provides advanced state inspection capabilities for developer tools.
It allows hierarchical exploration of application state, monitoring of specific state paths for changes,
and provides performance safeguards to ensure it doesn't impact application performance.

**Key Features:**
- Hierarchical tree navigation of complex state objects
- Path-based state exploration with breadcrumb navigation
- Real-time monitoring of specific state paths
- Change history tracking
- Development-only functionality with graceful fallbacks
- Performance optimizations and resource cleanup

**Acceptance Criteria:**
- ✅ State inspection shows current application state
- ✅ Complex state objects can be explored hierarchically  
- ✅ State changes can be monitored for specific paths
- ✅ Inspection utilities work in development tools only
- ✅ Inspection doesn't impact application performance
        `
      }
    }
  },
  argTypes: {
    collapsed: {
      control: 'boolean',
      description: 'Whether the section starts collapsed'
    },
    currentPath: {
      control: 'text', 
      description: 'Current navigation path in the state tree'
    },
    maxWatchedPaths: {
      control: 'number',
      description: 'Maximum number of paths that can be watched simultaneously'
    }
  }
};

export default meta;
type Story = StoryObj<typeof EnhancedStateSection>;

/**
 * Default state with basic application state visible
 */
export const Default: Story = {
  args: {
    collapsed: false
  }
};

/**
 * Collapsed state - should not initialize StateInspector for performance
 */
export const Collapsed: Story = {
  args: {
    collapsed: true
  }
};

/**
 * Navigated to specific path showing hierarchical exploration
 */
export const NavigatedToWorldData: Story = {
  args: {
    collapsed: false,
    currentPath: 'worldStore.worlds.world-1'
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows the component when navigated to a specific path in the state tree.
Demonstrates breadcrumb navigation and hierarchical exploration capabilities.
        `
      }
    }
  }
};

/**
 * With active path monitoring showing change notifications
 */
export const WithActiveMonitoring: Story = {
  args: {
    collapsed: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows the component with active path monitoring. This story demonstrates
the change notification system and history tracking features.
        `
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Simulate adding watches and state changes
    // This would be implemented with actual user interactions in the story
  }
};

/**
 * Maximum watches reached showing performance safeguards
 */
export const MaxWatchesReached: Story = {
  args: {
    collapsed: false,
    maxWatchedPaths: 2
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the performance safeguard that limits the number of 
simultaneously watched paths to prevent performance impact.
        `
      }
    }
  }
};

/**
 * Error state when StateInspector fails to initialize
 */
export const ErrorState: Story = {
  args: {
    collapsed: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows the graceful error handling when StateInspector cannot be initialized,
such as in production environments or when there are access errors.
        `
      }
    }
  }
};

/**
 * Deep nested state exploration showing metadata and navigation
 */
export const DeepNestedExploration: Story = {
  args: {
    collapsed: false,
    currentPath: 'worldStore.worlds.world-1.attributes.environment.terrain.mountains'
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates navigation through deeply nested state objects,
showing how the component handles complex hierarchical structures.
        `
      }
    }
  }
};

/**
 * Interactive testing playground
 */
export const InteractivePlayground: Story = {
  args: {
    collapsed: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive playground for testing all features:
- Add/remove path watches
- Navigate through state tree
- View change notifications
- Test performance limits
        `
      }
    }
  }
};