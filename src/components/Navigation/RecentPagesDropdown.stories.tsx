import type { Meta, StoryObj } from '@storybook/react';
import { RecentPagesDropdown } from './RecentPagesDropdown';
import { useNavigationStore } from '@/state/navigationStore';
import { useEffect } from 'react';

// Mock the navigation loading context
const mockNavigationLoadingContext = {
  navigateWithLoading: (href: string, message?: string) => {
    console.log('Navigate with loading:', href, message);
  },
};

jest.mock('@/components/shared/NavigationLoadingProvider', () => ({
  useNavigationLoadingContext: () => mockNavigationLoadingContext,
}));

const meta: Meta<typeof RecentPagesDropdown> = {
  title: 'Navigation/RecentPagesDropdown',
  component: RecentPagesDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A dropdown component that displays recently visited pages with navigation history functionality.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-4 rounded">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes for styling',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story decorator to set up navigation store state
 */
interface NavigationStateContext {
  parameters?: {
    navigationState?: {
      history?: Array<{
        path: string;
        timestamp: string;
        title?: string;
        params?: Record<string, string>;
      }>;
      preferences?: Record<string, unknown>;
    };
  };
}

function withNavigationState(storyFn: () => React.JSX.Element, context: NavigationStateContext) {
  const StoryWithState = () => {
    useEffect(() => {
      const { history = [], preferences = {} } = context.parameters?.navigationState || {};
      
      // Set up navigation store with test data
      useNavigationStore.setState({
        currentPath: '/current-page',
        history,
        preferences: {
          sidebarCollapsed: false,
          breadcrumbsEnabled: true,
          autoNavigateOnSelect: true,
          showRecentPages: true,
          maxRecentPages: 10,
          ...preferences,
        },
        modals: {},
        currentFlowStep: null,
        breadcrumbs: [],
        isHydrated: true,
      });
    }, []);

    return storyFn();
  };

  return <StoryWithState />;
}

/**
 * Default story with sample recent pages
 */
export const Default: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/worlds',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          title: 'My Worlds',
        },
        {
          path: '/characters',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
          title: 'Character List',
        },
        {
          path: '/world/fantasy-realm',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          title: 'Fantasy Realm - World Details',
        },
        {
          path: '/characters/create',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          title: 'Create Character',
        },
      ],
    },
    docs: {
      description: {
        story: 'The default dropdown showing recent pages with timestamps and navigation options.',
      },
    },
  },
};

/**
 * Empty state when no recent pages exist
 */
export const EmptyState: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [],
    },
    docs: {
      description: {
        story: 'When there are no recent pages to display, the dropdown does not render.',
      },
    },
  },
};

/**
 * Disabled state when showRecentPages is false
 */
export const DisabledInPreferences: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/worlds',
          timestamp: new Date().toISOString(),
          title: 'My Worlds',
        },
      ],
      preferences: {
        showRecentPages: false,
      },
    },
    docs: {
      description: {
        story: 'When showRecentPages is disabled in preferences, the dropdown does not render even with history.',
      },
    },
  },
};

/**
 * Long page titles and paths
 */
export const LongTitlesAndPaths: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/world/very-long-world-name-that-should-be-truncated',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          title: 'A Very Long World Name That Should Be Truncated in the Display',
        },
        {
          path: '/characters/create-character-with-very-detailed-configuration',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          title: 'Create Character with Very Detailed Configuration and Multiple Steps',
        },
        {
          path: '/some/deeply/nested/path/that/goes/on/and/on',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          title: 'Deeply Nested Page with Multiple Levels of Navigation',
        },
      ],
    },
    docs: {
      description: {
        story: 'Demonstrates how the dropdown handles long titles and paths with proper truncation.',
      },
    },
  },
};

/**
 * Many recent pages testing scrolling
 */
export const ManyRecentPages: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: Array.from({ length: 15 }, (_, i) => ({
        path: `/page-${i + 1}`,
        timestamp: new Date(Date.now() - (i + 1) * 5 * 60 * 1000).toISOString(),
        title: `Page ${i + 1}`,
      })),
      preferences: {
        maxRecentPages: 12,
      },
    },
    docs: {
      description: {
        story: 'Shows the dropdown with many recent pages, testing the scrollable area and max items limit.',
      },
    },
  },
};

/**
 * Recent timestamps variations
 */
export const VariousTimestamps: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/just-now',
          timestamp: new Date().toISOString(),
          title: 'Just Now',
        },
        {
          path: '/few-minutes-ago',
          timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          title: 'Few Minutes Ago',
        },
        {
          path: '/an-hour-ago',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          title: 'An Hour Ago',
        },
        {
          path: '/yesterday',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          title: 'Yesterday',
        },
        {
          path: '/last-week',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          title: 'Last Week',
        },
        {
          path: '/last-month',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          title: 'Last Month',
        },
      ],
    },
    docs: {
      description: {
        story: 'Demonstrates how different timestamps are formatted (just now, minutes ago, hours ago, days ago, etc.).',
      },
    },
  },
};

/**
 * Pages without titles (fallback to path-based titles)
 */
export const PagesWithoutTitles: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          path: '/worlds',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          path: '/characters/create',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          path: '/world/fantasy-realm',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    docs: {
      description: {
        story: 'Shows how the dropdown generates titles from paths when no title is provided.',
      },
    },
  },
};

/**
 * Custom styling with className
 */
export const CustomStyling: Story = {
  args: {
    className: 'custom-dropdown-styling',
  },
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/worlds',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          title: 'My Worlds',
        },
        {
          path: '/characters',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          title: 'Character List',
        },
      ],
    },
    docs: {
      description: {
        story: 'Demonstrates how custom CSS classes can be applied to the dropdown.',
      },
    },
  },
};

/**
 * Interactive demo for testing user interactions
 */
export const InteractiveDemo: Story = {
  args: {},
  decorators: [withNavigationState],
  parameters: {
    navigationState: {
      history: [
        {
          path: '/worlds',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          title: 'My Worlds',
        },
        {
          path: '/characters',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          title: 'Character List',
        },
        {
          path: '/world/fantasy-realm',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          title: 'Fantasy Realm',
        },
      ],
    },
    docs: {
      description: {
        story: 'An interactive demo for testing dropdown opening, navigation clicks, and remove functionality. Check the Actions panel for logged interactions.',
      },
    },
  },
  play: async () => {
    // This story is for manual interaction testing
    console.log('Interactive demo ready. Try clicking the Recent button and interacting with the dropdown.');
  },
};