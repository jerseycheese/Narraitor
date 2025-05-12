import type { Meta, StoryObj } from '@storybook/react';
import { ContextPreview } from './ContextPreview';
import { createMockWorld, createMockCharacter } from '../__tests__/test-helpers';

export default {
  title: 'Narraitor/Context/ContextPreview',
  component: ContextPreview,
  parameters: {
    docs: {
      description: {
        component: 'Displays AI prompt context with syntax highlighting'
      }
    }
  }
} as Meta<typeof ContextPreview>;

type Story = StoryObj<typeof ContextPreview>;

export const Default: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    tokenLimit: 500,
    showTokenCount: true
  }
};

export const MinimalContext: Story = {
  args: {
    world: { id: 'world-1', name: 'Simple World' },
    character: { id: 'char-1', name: 'Hero' }
  }
};

export const WithRecentEvents: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    recentEvents: [
      'Defeated the goblin king',
      'Found ancient artifact',
      'Entered mysterious cave'
    ]
  }
};

export const TokenLimitExceeded: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    tokenLimit: 50,
    showWarning: true
  }
};
