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
  <div >
    <h3 >Sample Card Title</h3>
    <p >
      This is a sample card content to demonstrate the ActiveStateCard wrapper component.
    </p>
    <div >
      <button >Action 1</button>
      <button >Action 2</button>
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
    activeClassName: '',
    inactiveClassName: '',
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
        <div >
          <span >Image Placeholder</span>
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
        <div >
          <span >Featured Image</span>
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
      <div >
        <h3 >Clickable Card</h3>
        <p >Click anywhere on this card to trigger an action.</p>
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
    <div >
      <ActiveStateCard isActive={true} activeText="Active Item">
        <div >
          <h4 >Card 1</h4>
          <p >This card is active</p>
        </div>
      </ActiveStateCard>
      <ActiveStateCard isActive={false}>
        <div >
          <h4 >Card 2</h4>
          <p >This card is inactive</p>
        </div>
      </ActiveStateCard>
      <ActiveStateCard isActive={false}>
        <div >
          <h4 >Card 3</h4>
          <p >This card is inactive</p>
        </div>
      </ActiveStateCard>
    </div>
  ),
};
