import type { Meta, StoryObj } from '@storybook/react';
import WorldSettingsForm from '@/components/forms/WorldSettingsForm';
import { WorldSettings } from '@/types/world.types';

const mockSettings: WorldSettings = {
  maxAttributes: 10,
  maxSkills: 20,
  attributePointPool: 25,
  skillPointPool: 30,
};

const meta: Meta<typeof WorldSettingsForm> = {
  title: 'Narraitor/World/Forms/WorldSettingsForm',
  component: WorldSettingsForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form for configuring world settings including limits and point pools',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof WorldSettingsForm>;

export const Default: Story = {
  args: {
    settings: mockSettings,
  },
};

export const MinimalSettings: Story = {
  args: {
    settings: {
      maxAttributes: 1,
      maxSkills: 1,
      attributePointPool: 1,
      skillPointPool: 1,
    },
  },
};

export const HighLimits: Story = {
  args: {
    settings: {
      maxAttributes: 50,
      maxSkills: 100,
      attributePointPool: 200,
      skillPointPool: 500,
    },
  },
};

export const BalancedSettings: Story = {
  args: {
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 40,
    },
  },
};
