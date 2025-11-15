import type { Meta, StoryObj } from '@storybook/react';
import { EndingSuggestionBanner } from './EndingSuggestionBanner';
import { fn } from '@storybook/test';

const meta = {
  title: 'GameSession/EndingSuggestionBanner',
  component: EndingSuggestionBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    reason: {
      control: 'text',
      description: 'AI-generated reason for suggesting the story ending',
    },
    onAccept: {
      description: 'Callback when the player chooses to view the ending',
    },
    onDismiss: {
      description: 'Callback when user clicks Continue Playing',
    },
  },
  args: {
    onAccept: fn(),
    onDismiss: fn(),
  },
} satisfies Meta<typeof EndingSuggestionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    reason:
      "The protagonist has achieved their goal and the main conflict has been resolved. The narrative arc feels complete.",
  },
};

export const ShortReason: Story = {
  args: {
    reason: "The character has achieved their goal and found peace.",
  },
};

export const LongReason: Story = {
  args: {
    reason:
      "The hero has transformed, overcome their fears, and resolved the crisis. The emotional arc feels complete.",
  },
};

export const TragicEnding: Story = {
  args: {
    reason:
      "The sacrifice has been made. The conflict is resolved, though at great cost.",
  },
};

export const TriumphantEnding: Story = {
  args: {
    reason:
      "Victory is yours. The threat is vanquished, and a new era begins.",
  },
};
