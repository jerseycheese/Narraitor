// src/components/CharacterPortrait/CharacterPortrait.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { CharacterPortrait } from './CharacterPortrait';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionError } from '@/components/ui/ErrorDisplay';

const meta: Meta<typeof CharacterPortrait> = {
  title: 'Narraitor/Character/Display/CharacterPortrait',
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

const mockPortraitImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgICA8ZGVmcz4KICAgICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmdHcmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzdjM2FlZCIvPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyNTYzZWIiLz4KICAgICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgICAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImZhY2VHcmFkIiBjeD0iNTAlIiBjeT0iNDAlIiByPSI2MCUiPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjMiLz4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjEiLz4KICAgICAgICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICAgICAgPC9kZWZzPgogICAgICAgIAogICAgICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2JnR3JhZCkiLz4KICAgICAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iMzUiIGZpbGw9InVybCgjZmFjZUdyYWQpIi8+CiAgICAgICAgPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjE2MCIgcng9IjQ1IiByeT0iMzAiIGZpbGw9InVybCgjZmFjZUdyYWQpIi8+CiAgICAgICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNTAiIHI9IjgiIGZpbGw9IiMwNmI2ZDQiIG9wYWNpdHk9IjAuNiIvPgogICAgICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTk1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgb3BhY2l0eT0iMC44Ij5FTTwvdGV4dD4KICAgICAgICA8dGV4dCB4PSIxMDAiIHk9IjE4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjYiPkFJIEdlbmVyYXRlZDwvdGV4dD4KICAgICAgPC9zdmc+';

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