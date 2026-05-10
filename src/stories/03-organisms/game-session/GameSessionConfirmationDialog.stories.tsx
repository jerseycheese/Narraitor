import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { GameSessionConfirmationDialog } from '@/components/GameSession/GameSessionConfirmationDialog';

const meta = {
  title: '03-Organisms/Game Session/GameSessionConfirmationDialog',
  component: GameSessionConfirmationDialog,
  parameters: {
    layout: 'padded',
  },
  args: {
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof GameSessionConfirmationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StartNew: Story = {
  args: {
    isOpen: true,
    type: 'start-new',
    currentProgress: 15,
  },
};

export const CharacterSwitch: Story = {
  args: {
    isOpen: true,
    type: 'character-switch',
    characterName: 'Elena the Brave',
    currentProgress: 8,
  },
};

export const WithProgress: Story = {
  args: {
    isOpen: true,
    type: 'start-new',
    currentProgress: 42,
  },
};
