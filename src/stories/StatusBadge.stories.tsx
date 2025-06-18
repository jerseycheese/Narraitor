import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from '@/components/ui/StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A reusable badge component for displaying status information with consistent styling.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['skill-difficulty', 'skill-requirement'],
      description: 'The visual variant of the badge'
    },
    state: {
      control: { type: 'select' },
      options: ['available', 'unavailable', 'easy', 'moderate', 'hard', 'extreme'],
      description: 'The state of the badge'
    },
    label: {
      control: { type: 'text' },
      description: 'The text displayed in the badge'
    },
    description: {
      control: { type: 'text' },
      description: 'Optional description text shown below the badge'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SkillRequirementAvailable: Story = {
  args: {
    variant: 'skill-requirement',
    state: 'available',
    label: '[Intimidation 6+]',
    description: 'Player meets the requirement'
  }
};

export const SkillRequirementUnavailable: Story = {
  args: {
    variant: 'skill-requirement',
    state: 'unavailable',
    label: '[Stealth 8+]',
    description: 'Player does not meet the requirement'
  }
};

export const SkillDifficultyEasy: Story = {
  args: {
    variant: 'skill-difficulty',
    state: 'easy',
    label: 'Easy',
    description: 'Low difficulty level'
  }
};

export const SkillDifficultyModerate: Story = {
  args: {
    variant: 'skill-difficulty',
    state: 'moderate',
    label: 'Moderate',
    description: 'Medium difficulty level'
  }
};

export const SkillDifficultyHard: Story = {
  args: {
    variant: 'skill-difficulty',
    state: 'hard',
    label: 'Hard',
    description: 'High difficulty level'
  }
};

export const SkillDifficultyExtreme: Story = {
  args: {
    variant: 'skill-difficulty',
    state: 'extreme',
    label: 'Extreme',
    description: 'Very high difficulty level'
  }
};