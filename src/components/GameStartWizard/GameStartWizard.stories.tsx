import type { Meta, StoryObj } from '@storybook/react';
import { GameStartWizard } from './GameStartWizard';
import { createWizardMockState } from './GameStartWizard.stories.helpers';

const meta: Meta<typeof GameStartWizard> = {
  title: 'Narraitor/Game/Start/GameStartWizard',
  component: GameStartWizard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Unified game start wizard that guides users through world selection, character selection, and game initialization.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-100 p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    initialWorldId: {
      control: 'text',
      description: 'Pre-select a world ID to skip world selection step',
    },
    initialCharacterId: {
      control: 'text',
      description: 'Pre-select a character ID to skip character selection step',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Called when wizard is cancelled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultFlow: Story = {
  name: 'Complete Flow',
  decorators: [createWizardMockState({ hasWorlds: true, hasCharacters: true })],
};

export const NoWorlds: Story = {
  name: 'No Worlds Available',
  decorators: [createWizardMockState({ hasWorlds: false, hasCharacters: false })],
};

export const NoCharacters: Story = {
  name: 'No Characters for World',
  decorators: [createWizardMockState({ hasWorlds: true, hasCharacters: false })],
  args: {
    initialWorldId: 'world-1',
  },
};