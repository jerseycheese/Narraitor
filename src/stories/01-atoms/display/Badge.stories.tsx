// src/components/ui/badge.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: '01-Atoms/display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', '', 'success', 'warning', 'info', 'available', 'unavailable'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div>
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <div>
      <Badge variant="secondary" count={8}>Strength</Badge>
      <Badge variant="secondary" count={6}>Intelligence</Badge>
      <Badge variant="outline" count={9}>Combat</Badge>
      <Badge variant="outline" count={7}>Magic</Badge>
    </div>
  ),
};

export const SkillRequirements: Story = {
  render: () => (
    <div>
      <Badge variant="available">Stealth 6+</Badge>
      <Badge variant="unavailable">Combat 8+</Badge>
      <Badge variant="available">Intelligence 5+</Badge>
    </div>
  ),
};

export const EntityTypes: Story = {
  render: () => (
    <div>
      <Badge variant="info">World</Badge>
      <Badge variant="success">Character</Badge>
      <Badge variant="warning">Item</Badge>
      <Badge variant="default">Location</Badge>
    </div>
  ),
};