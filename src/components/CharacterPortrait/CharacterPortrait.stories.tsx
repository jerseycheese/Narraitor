// src/components/CharacterPortrait/CharacterPortrait.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { CharacterPortrait } from './CharacterPortrait';

const meta: Meta<typeof CharacterPortrait> = {
  title: 'Components/CharacterPortrait',
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

// Default placeholder portrait
export const Placeholder: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Elara Moonshadow',
    size: 'medium',
  },
};

// AI-generated portrait - Mage
export const AIGenerated: Story = {
  args: {
    portrait: {
      type: 'ai-generated',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgICA8ZGVmcz4KICAgICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmdHcmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzdjM2FlZCIvPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyNTYzZWIiLz4KICAgICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgICAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImZhY2VHcmFkIiBjeD0iNTAlIiBjeT0iNDAlIiByPSI2MCUiPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjMiLz4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjEiLz4KICAgICAgICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICAgICAgPC9kZWZzPgogICAgICAgIAogICAgICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2JnR3JhZCkiLz4KICAgICAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iMzUiIGZpbGw9InVybCgjZmFjZUdyYWQpIi8+CiAgICAgICAgPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjE2MCIgcng9IjQ1IiByeT0iMzAiIGZpbGw9InVybCgjZmFjZUdyYWQpIi8+CiAgICAgICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNTAiIHI9IjgiIGZpbGw9IiMwNmI2ZDQiIG9wYWNpdHk9IjAuNiIvPgogICAgICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTk1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgb3BhY2l0eT0iMC44Ij5FTTwvdGV4dD4KICAgICAgICA8dGV4dCB4PSIxMDAiIHk9IjE4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjYiPkFJIEdlbmVyYXRlZDwvdGV4dD4KICAgICAgPC9zdmc+',
      generatedAt: new Date().toISOString(),
      prompt: 'A mystical elven mage with silver hair and glowing eyes',
    },
    characterName: 'Elara Moonshadow',
    size: 'medium',
  },
};

// Loading state
export const Loading: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Elara Moonshadow',
    size: 'medium',
    isGenerating: true,
  },
};

// Error state
export const Error: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Elara Moonshadow',
    size: 'medium',
    error: 'Failed to generate portrait',
  },
};

// Size variations
export const SmallSize: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Thorin',
    size: 'small',
  },
};

export const LargeSize: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Gandalf the Grey',
    size: 'large',
  },
};

// Clickable portrait
export const Clickable: Story = {
  args: {
    portrait: {
      type: 'ai-generated',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZmY2NjY2Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmOTkzMyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8ZWxsaXBzZSBjeD0iNTAiIGN5PSI3NSIgcng9IjIwIiByeT0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8dGV4dCB4PSI1MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2xpY2sgTWU8L3RleHQ+Cjwvc3ZnPgo=',
      generatedAt: new Date().toISOString(),
    },
    characterName: 'Ragnar Firebrand',
    size: 'medium',
    onClick: () => alert('Portrait clicked!'),
  },
};

// Short name initials
export const ShortName: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Bob',
    size: 'medium',
  },
};

// Long name with multiple words
export const LongName: Story = {
  args: {
    portrait: {
      type: 'placeholder',
      url: null,
    },
    characterName: 'Sir Reginald Archibald Pemberton III',
    size: 'medium',
  },
};