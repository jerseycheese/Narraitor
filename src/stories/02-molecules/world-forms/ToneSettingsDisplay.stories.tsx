import { Meta, StoryObj } from '@storybook/react';
import { ToneSettingsDisplay } from '@/components/world/ToneSettingsDisplay';

const meta: Meta<typeof ToneSettingsDisplay> = {
  title: '02-Molecules/world-forms/ToneSettingsDisplay',
  component: ToneSettingsDisplay,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToneSettingsDisplay>;

export const Default: Story = {
  args: {
    toneSettings: {
      contentRating: 'PG-13',
      narrativeStyle: 'balanced',
      languageComplexity: 'moderate',
    },
  },
};
