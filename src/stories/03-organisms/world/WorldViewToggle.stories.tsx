import type { Meta, StoryObj } from '@storybook/react';
import { WorldViewToggle } from '@/components/world/WorldViewToggle';
import { useState } from 'react';

const meta = {
  title: '03-Organisms/world/WorldViewToggle',
  component: WorldViewToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['', ''],
      description: 'Current view mode',
    },
    onModeChange: { action: 'modeChanged' },
  },
} satisfies Meta<typeof WorldViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    mode: '',
    onModeChange: () => {},
  },
};

export const TableMode: Story = {
  args: {
    mode: '',
    onModeChange: () => {},
  },
};

// Create a proper React component for the interactive story
const InteractiveViewToggle = () => {
  const [mode, setMode] = useState<'' | ''>('');
  return <WorldViewToggle mode={mode} onModeChange={setMode} />;
};

export const Interactive: Story = {
  args: {
    mode: '',
    onModeChange: () => {},
  },
  render: () => <InteractiveViewToggle />,
};
