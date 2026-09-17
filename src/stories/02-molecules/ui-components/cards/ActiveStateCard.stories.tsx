import type { Meta, StoryObj } from '@storybook/react';
import { ActiveStateCard } from '@/components/shared/cards/ActiveStateCard';

const meta = {
  title: '02-Molecules/ui-components/cards/ActiveStateCard',
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
  <div>
    <h3>Sample Card Title</h3>
    <p>
      This is a sample card content to demonstrate the ActiveStateCard wrapper component.
    </p>
    <div>
      <button>Action 1</button>
      <button>Action 2</button>
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
    children: <SampleContent />,
  },
};

export const WithCustomStyling: Story = {
  args: {
    isActive: true,
    activeClassName: '',
    inactiveClassName: '',
    children: <SampleContent />,
  },
};

export const WithImage: Story = {
  args: {
    isActive: false,
    hasImage: true,
    children: (
      <>
        <div>
          <span>Image Placeholder</span>
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
    children: (
      <>
        <div>
          <span>Featured Image</span>
        </div>
        <SampleContent />
      </>
    ),
  },
};

export const Grid: Story = {
  args: {
    isActive: false,
    children: <div>Default content</div>,
  },
  render: () => (
    <div>
      <ActiveStateCard isActive={true}>
        <div>
          <h4>Card 1</h4>
          <p>This card is active</p>
        </div>
      </ActiveStateCard>
      <ActiveStateCard isActive={false}>
        <div>
          <h4>Card 2</h4>
          <p>This card is inactive</p>
        </div>
      </ActiveStateCard>
      <ActiveStateCard isActive={false}>
        <div>
          <h4>Card 3</h4>
          <p>This card is inactive</p>
        </div>
      </ActiveStateCard>
    </div>
  ),
};
