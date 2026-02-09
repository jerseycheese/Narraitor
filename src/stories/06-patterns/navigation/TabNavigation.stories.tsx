// src/stories/TabNavigation.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TabNavigation } from '@/components/shared/TabNavigation';
import type { TabOption } from '@/components/shared/TabNavigation';

const meta: Meta<typeof TabNavigation> = {
  title: '06-Patterns/navigation/TabNavigation',
  component: TabNavigation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Reusable tab navigation component with consistent styling and behavior. Supports generic types for tab values and flexible options configuration.'
      }
    }
  },
  argTypes: {
    onChange: { action: 'tab-changed' },
    disabled: {
      control: 'boolean',
      description: 'Disable all tabs'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the'
    },
    mobileLayout: {
      control: { type: 'radio' },
      options: ['wrap', 'scroll'],
      description: 'Mobile behavior: wrap allows tabs to wrap to multiple lines, scroll enables horizontal scrolling'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state for stories
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabNavigationWrapper = (args: any) => {
  const [activeValue, setActiveValue] = useState<string>(args.activeValue || args.options[0]?.value || '');

  const handleChange = (value: string) => {
    setActiveValue(value);
    args.onChange?.(value);
  };

  return (
    <div >
      <TabNavigation
        {...args}
        activeValue={activeValue}
        onChange={handleChange}
      />
      <div >
        Active: {activeValue}
      </div>
    </div>
  );
};

export const SmartTemplatesExample: Story = {
  render: TabNavigationWrapper,
  args: {
    options: [
      { value: 'inspired-by', label: 'I want something like...' },
      { value: 'genre-mix', label: 'Genre Mixer' },
      { value: 'surprise-me', label: 'Surprise me!' }
    ],
    activeValue: 'inspired-by'
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world usage example from SmartTemplates component with longer labels'
      }
    }
  }
};

export const DisabledStates: Story = {
  render: TabNavigationWrapper,
  args: {
    options: [
      { value: 'available', label: 'Available' },
      { value: 'disabled', label: 'Disabled', disabled: true },
      { value: 'enabled', label: 'Enabled' }
    ] as TabOption<string>[],
    activeValue: 'available'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates individual tab and component-level disabled states'
      }
    }
  }
};

export const MobileWrap: Story = {
  render: TabNavigationWrapper,
  args: {
    options: [
      { value: 'inspired-by', label: 'I want something like...' },
      { value: 'genre-mix', label: 'Genre Mixer' },
      { value: 'surprise-me', label: 'Surprise me!' }
    ],
    activeValue: 'inspired-by',
    mobileLayout: 'wrap'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-responsive layout with wrapping tabs. Tabs wrap to multiple lines on smaller screens with compact spacing.'
      }
    }
  }
};

export const MobileScroll: Story = {
  render: TabNavigationWrapper,
  args: {
    options: [
      { value: 'inspired-by', label: 'I want something like...' },
      { value: 'genre-mix', label: 'Genre Mixer' },
      { value: 'surprise-me', label: 'Surprise me!' },
      { value: 'advanced', label: 'Advanced Options' },
      { value: 'templates', label: 'Browse Templates' }
    ],
    activeValue: 'inspired-by',
    mobileLayout: 'scroll'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile layout with horizontal scrolling. Tabs remain on a single line and scroll horizontally when they overflow.'
      }
    }
  }
};

export const OverflowHandling: Story = {
  render: TabNavigationWrapper,
  args: {
    options: [
      { value: 'comprehensive', label: 'Comprehensive Character Creation' },
      { value: 'advanced', label: 'Advanced World Building Tools' },
      { value: 'collaborative', label: 'Collaborative Storytelling' },
      { value: 'management', label: 'Campaign Management' }
    ],
    activeValue: 'comprehensive'
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests tab overflow handling with very long labels and multiple tabs'
      }
    }
  }
};