// src/components/CharacterPortrait/CharacterPortrait.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { LoadingState } from '@/components/ui/LoadingState/LoadingState';
// import { SectionError } from '@/components/ui/ErrorDisplay/ErrorDisplay';

const meta: Meta<typeof CharacterPortrait> = {
  title: '03-Organisms/character/portrait/CharacterPortrait',
  component: CharacterPortrait,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    isGenerating: {
      control: { type: 'boolean' },
    },
    error: {
      control: { type: 'text' },
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockPortraitImage = 'https://i.pravatar.cc/200?img=1';

// AI-generated portrait - Primary use case
export const AIGenerated: Story = {
  args: {
    portrait: {
      type: 'ai-generated',
      url: mockPortraitImage,
      generatedAt: '2024-01-15T10:30:00Z',
      prompt: 'A brave warrior with noble bearing and kind eyes',
    },
    characterName: 'Sir Galahad',
    size: 'medium',
  },
};

// Placeholder state - Before generation
export const Placeholder: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Test Character',
    size: 'medium',
  },
};

// Loading state - Using shared LoadingState component
export const Generating: Story = {
  decorators: [
    () => (
      <div className="p-8 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Generating Character Portrait</h3>
        <div className="bg-white p-6 rounded-lg shadow">
          <LoadingState message="Generating character portrait..." />
        </div>
      </div>
    )
  ]
};


// Error state - Component's built-in error display
export const Error: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Failed Character',
    size: 'medium',
    error: 'Failed to generate portrait',
  },
};

// All sizes comparison
export const SizeComparison: Story = {
  decorators: [
    () => (
      <div className="flex items-end gap-4 p-4">
        <div className="text-center">
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="Small Hero"
            size="small"
          />
          <p className="text-xs mt-2">Small</p>
        </div>
        <div className="text-center">
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="Medium Hero"
            size="medium"
          />
          <p className="text-xs mt-2">Medium</p>
        </div>
        <div className="text-center">
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="Large Hero"
            size="large"
          />
          <p className="text-xs mt-2">Large</p>
        </div>
        <div className="text-center">
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="XLarge Hero"
            size="xlarge"
          />
          <p className="text-xs mt-2">XLarge</p>
        </div>
      </div>
    )
  ]
};
