import type { Meta, StoryObj } from '@storybook/react';
import { ActiveStateCard } from './ActiveStateCard';

const meta = {
  title: 'Narraitor/Shared/Cards/ActiveStateCard',
  component: ActiveStateCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the card is in active state',
    },
    activeText: {
      control: 'text',
      description: 'Text to show in the active state indicator',
    },
    showActiveIndicator: {
      control: 'boolean',
      description: 'Whether to show the active state indicator banner',
    },
    hasImage: {
      control: 'boolean',
      description: 'Whether the card has an image at the top',
    },
  },
} satisfies Meta<typeof ActiveStateCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample card content component
const SampleContent = () => (
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2">Sample Card Title</h3>
    <p className="text-gray-600 mb-4">
      This is a sample card content to demonstrate the ActiveStateCard wrapper component.
    </p>
    <div className="flex gap-2">
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Action 1</button>
      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">Action 2</button>
    </div>
  </div>
);

export const Default: Story = {
  args: {
    isActive: false,
    children: <SampleContent />,
  },
};

export const Active: Story = {
  args: {
    isActive: true,
    activeText: 'Currently Active',
    children: <SampleContent />,
  },
};

export const ActiveWithCustomText: Story = {
  args: {
    isActive: true,
    activeText: 'Currently Active World',
    children: <SampleContent />,
  },
};

export const ActiveWithoutIndicator: Story = {
  args: {
    isActive: true,
    showActiveIndicator: false,
    children: <SampleContent />,
  },
};

export const WithCustomStyling: Story = {
  args: {
    isActive: true,
    activeClassName: 'ring-4 ring-blue-500 shadow-2xl border-blue-500 bg-blue-50',
    inactiveClassName: 'hover:shadow-md border-gray-200',
    activeText: 'Primary Selection',
    children: <SampleContent />,
  },
};

export const WithImage: Story = {
  args: {
    isActive: false,
    hasImage: true,
    children: (
      <>
        <div className="h-48 bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center text-white">
          <span className="text-2xl font-bold">Image Placeholder</span>
        </div>
        <SampleContent />
      </>
    ),
  },
};

export const ActiveWithImage: Story = {
  args: {
    isActive: true,
    hasImage: true,
    activeText: 'Featured Item',
    children: (
      <>
        <div className="h-48 bg-gradient-to-b from-green-500 to-teal-600 flex items-center justify-center text-white">
          <span className="text-2xl font-bold">Featured Image</span>
        </div>
        <SampleContent />
      </>
    ),
  },
};

export const Clickable: Story = {
  args: {
    isActive: false,
    onClick: () => alert('Card clicked!'),
    children: (
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">Clickable Card</h3>
        <p className="text-gray-600">Click anywhere on this card to trigger an action.</p>
      </div>
    ),
  },
};

export const Grid: Story = {
  args: {
    isActive: false,
    onClick: () => console.log('Card clicked'),
    children: <div>Default content</div>,
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-4" style={{ width: '800px' }}>
      <ActiveStateCard isActive={true} activeText="Active Item">
        <div className="p-4">
          <h4 className="font-semibold">Card 1</h4>
          <p className="text-sm text-gray-600">This card is active</p>
        </div>
      </ActiveStateCard>
      <ActiveStateCard isActive={false}>
        <div className="p-4">
          <h4 className="font-semibold">Card 2</h4>
          <p className="text-sm text-gray-600">This card is inactive</p>
        </div>
      </ActiveStateCard>
      <ActiveStateCard isActive={false}>
        <div className="p-4">
          <h4 className="font-semibold">Card 3</h4>
          <p className="text-sm text-gray-600">This card is inactive</p>
        </div>
      </ActiveStateCard>
    </div>
  ),
};
