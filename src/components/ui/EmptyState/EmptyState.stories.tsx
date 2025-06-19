import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof EmptyState> = {
  title: 'Narraitor/UI/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Reusable empty state component for consistent empty state messaging across the application.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title for the empty state'
    },
    description: {
      control: 'text',
      description: 'Optional description text'
    },
    icon: {
      description: 'Optional icon to display'
    },
    action: {
      description: 'Optional action button or element'
    },
    variant: {
      control: 'select',
      options: ['default', 'centered', 'compact'],
      description: 'Visual variant of the empty state'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Journal icon
const JournalIcon = (
  <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
    <svg
      className="w-8 h-8 text-amber-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  </div>
);

export const JournalEmpty: Story = {
  args: {
    title: 'This journal awaits its first entry',
    description: 'Updates will appear here as things unfold',
    icon: JournalIcon,
    variant: 'centered',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state for journal with icon and description.',
      },
    },
  },
};

export const WithAction: Story = {
  args: {
    title: 'No worlds created yet',
    description: 'Create your first world to start your adventure',
    action: (
      <Button>Create World</Button>
    ),
    variant: 'centered',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with action button.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search criteria',
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant for smaller spaces.',
      },
    },
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Nothing to show',
    variant: 'centered',
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple empty state with title only.',
      },
    },
  },
};