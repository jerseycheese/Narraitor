import type { Meta, StoryObj } from '@storybook/react';
import { WorldSettingsDisplay } from './WorldSettingsDisplay';

const meta = {
  title: 'Narraitor/World/Display/WorldSettingsDisplay',
  component: WorldSettingsDisplay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldSettingsDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 15,
    },
  },
};

export const HighValues: Story = {
  args: {
    settings: {
      maxAttributes: 20,
      maxSkills: 50,
      attributePointPool: 100,
      skillPointPool: 75,
    },
  },
};

export const LowValues: Story = {
  args: {
    settings: {
      maxAttributes: 3,
      maxSkills: 5,
      attributePointPool: 10,
      skillPointPool: 8,
    },
  },
};

export const PartialSettings: Story = {
  args: {
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 15,
    },
  },
};

export const EmptySettings: Story = {
  args: {
    settings: undefined,
  },
};

export const ZeroValues: Story = {
  args: {
    settings: {
      maxAttributes: 0,
      maxSkills: 0,
      attributePointPool: 0,
      skillPointPool: 0,
    },
  },
};

export const MinimalFantasy: Story = {
  args: {
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 12,
    },
  },
};

export const PowerfulFantasy: Story = {
  args: {
    settings: {
      maxAttributes: 8,
      maxSkills: 20,
      attributePointPool: 45,
      skillPointPool: 30,
    },
  },
};

export const SciFiSettings: Story = {
  args: {
    settings: {
      maxAttributes: 4,
      maxSkills: 15,
      attributePointPool: 20,
      skillPointPool: 25,
    },
  },
};

export const SuperheroSettings: Story = {
  args: {
    settings: {
      maxAttributes: 10,
      maxSkills: 25,
      attributePointPool: 60,
      skillPointPool: 40,
    },
  },
};

export const BalancedSettings: Story = {
  args: {
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 15,
    },
  },
};
