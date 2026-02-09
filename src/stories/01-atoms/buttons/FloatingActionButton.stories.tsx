import type { Meta, StoryObj } from '@storybook/react';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton/FloatingActionButton';

const meta: Meta<typeof FloatingActionButton> = {
  title: '01-Atoms/buttons/FloatingActionButton',
  component: FloatingActionButton,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reusable floating action button component with customizable position, size, and variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Callback when button is clicked',
    },
    icon: {
      description: 'Icon to display in the button',
    },
    label: {
      control: 'text',
      description: 'Accessibility label and tooltip text',
    },
    position: {
      control: 'select',
      options: ['', '', '', ''],
      description: 'Position of the floating button',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'amber'],
      description: 'Color variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Journal book icon
const JournalIcon = (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

// Plus icon
const PlusIcon = (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

export const JournalButton: Story = {
  args: {
    icon: JournalIcon,
    label: 'Open journal (J)',
    variant: 'amber',
    position: '',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Journal floating action button with amber variant.',
      },
    },
  },
};

export const AddButton: Story = {
  args: {
    icon: PlusIcon,
    label: 'Add new item',
    variant: 'primary',
    position: '',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Add button with primary variant.',
      },
    },
  },
};

export const Positions: Story = {
  args: {
    onClick: () => {},
    icon: PlusIcon,
    label: 'Test position',
    variant: 'secondary',
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates different position options.',
      },
    },
  },
  render: (args) => (
    <div>
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        size={args.size}
        position="top-left"
      />
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        size={args.size}
        position="top-right"
      />
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        size={args.size}
        position="bottom-left"
      />
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        size={args.size}
        position="bottom-right"
      />
    </div>
  ),
};

export const Sizes: Story = {
  args: {
    onClick: () => {},
    icon: JournalIcon,
    label: 'Test sizes',
    variant: 'amber',
    position: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates different size options.',
      },
    },
  },
  render: (args) => (
    <div>
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        position={args.position}
        size="sm"
      />
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        position={args.position}
        size="md"
      />
      <FloatingActionButton
        onClick={args.onClick}
        icon={args.icon}
        label={args.label}
        variant={args.variant}
        position={args.position}
        size="lg"
      />
    </div>
  ),
};
