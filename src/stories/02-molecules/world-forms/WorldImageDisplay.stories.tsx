import { Meta, StoryObj } from '@storybook/react';
import { WorldImageDisplay } from '@/components/world/WorldImageDisplay';

const meta: Meta<typeof WorldImageDisplay> = {
  title: '02-Molecules/world-forms/WorldImageDisplay',
  component: WorldImageDisplay,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WorldImageDisplay>;

export const Default: Story = {
  args: {
    image: {
      type: 'ai-generated',
      url: '/visual-assets/world-cyberpunk.png',
      generatedAt: '2025-01-01T00:00:00Z',
      prompt: 'A sweeping fantasy landscape under a storm-lit sky.',
    },
  },
};
