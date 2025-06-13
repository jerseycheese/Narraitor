import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ToneSettingsForm } from './ToneSettingsForm';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';

const meta = {
  title: 'Narraitor/Forms/ToneSettingsForm',
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
    },
    onSave: {
      description: 'Callback fired when save button is clicked',
      action: 'saved'
    },
    showSaveButton: {
      description: 'Whether to show the save button',
      control: 'boolean'
    }
  },
  args: {
    onToneSettingsChange: fn(),
    onSave: fn()
  }
} satisfies Meta<typeof ToneSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toneSettings: DEFAULT_TONE_SETTINGS,
    showSaveButton: true
  }
};

export const WithCustomSettings: Story = {
  args: {
    toneSettings: {
      contentRating: 'PG-13',
      narrativeStyle: 'dramatic',
      languageComplexity: 'advanced',
      customInstructions: 'Focus on character development and emotional depth. Avoid graphic violence.'
    },
    showSaveButton: true
  }
};

export const MatureContent: Story = {
  args: {
    toneSettings: {
      contentRating: 'R',
      narrativeStyle: 'serious',
      languageComplexity: 'literary',
      customInstructions: 'Include mature themes and complex moral dilemmas.'
    },
    showSaveButton: true
  }
};

export const LightAndSimple: Story = {
  args: {
    toneSettings: {
      contentRating: 'G',
      narrativeStyle: 'lighthearted',
      languageComplexity: 'simple',
      customInstructions: 'Keep the tone upbeat and family-friendly.'
    },
    showSaveButton: true
  }
};

export const WithoutSaveButton: Story = {
  args: {
    toneSettings: DEFAULT_TONE_SETTINGS,
    showSaveButton: false
  }
};

export const ActionPacked: Story = {
  args: {
    toneSettings: {
      contentRating: 'PG-13',
      narrativeStyle: 'action-packed',
      languageComplexity: 'moderate',
      customInstructions: 'Include exciting sequences and fast-paced dialogue.'
    },
    showSaveButton: true
  }
};

export const Mysterious: Story = {
  args: {
    toneSettings: {
      contentRating: 'PG',
      narrativeStyle: 'mysterious',
      languageComplexity: 'advanced',
      customInstructions: 'Build suspense and include hidden clues throughout the narrative.'
    },
    showSaveButton: true
  }
};