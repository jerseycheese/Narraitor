import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ToneSettingsForm } from '@/components/forms/ToneSettingsForm';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';

const meta = {
  title: '02-Molecules/forms/managers/ToneSettingsForm',
  component: ToneSettingsForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A form component for configuring narrative tone settings including content rating, narrative style, and language complexity.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    toneSettings: {
      description: 'Current tone settings configuration',
      control: 'object'
    },
    onToneSettingsChange: {
      description: 'Callback fired when tone settings change',
      action: 'toneSettingsChanged'
    }
  },
  args: {
    onToneSettingsChange: fn()
  }
} satisfies Meta<typeof ToneSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toneSettings: DEFAULT_TONE_SETTINGS
  }
};

export const MatureContent: Story = {
  args: {
    toneSettings: {
      contentRating: 'R',
      narrativeStyle: 'serious',
      languageComplexity: 'literary',
      customInstructions: 'Include mature themes and complex moral dilemmas.'
    }
  }
};

export const LightAndSimple: Story = {
  args: {
    toneSettings: {
      contentRating: 'G',
      narrativeStyle: 'lighthearted',
      languageComplexity: 'simple',
      customInstructions: 'Keep the tone upbeat and family-friendly.'
    }
  }
};
