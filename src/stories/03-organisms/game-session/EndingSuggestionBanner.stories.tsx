import type { Meta, StoryObj } from '@storybook/react';
import { EndingSuggestionBanner } from '@/components/GameSession/EndingSuggestionBanner';
import { fn } from '@storybook/test';

const meta = {
  title: '03-Organisms/Game Session/EndingSuggestionBanner',
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

