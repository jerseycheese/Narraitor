// src/components/CharacterPortrait/CharacterPortrait.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

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
      <div >
        <h3 >Generating Character Portrait</h3>
        <div >
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
      <div >
        <div >
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="Small Hero"
            size="small"
          />
          <p >Small</p>
        </div>
        <div >
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="Medium Hero"
            size="medium"
          />
          <p >Medium</p>
        </div>
        <div >
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="Large Hero"
            size="large"
          />
          <p >Large</p>
        </div>
        <div >
          <CharacterPortrait
            portrait={{ type: 'placeholder', url: null }}
            characterName="XLarge Hero"
            size="xlarge"
          />
          <p >XLarge</p>
        </div>
      </div>
    )
  ]
};
