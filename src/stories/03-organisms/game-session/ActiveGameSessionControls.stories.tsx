import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ActiveGameSessionControls from '@/components/GameSession/ActiveGameSessionControls';
import {
  mockCharacter,
  STORY_WORLD_ID,
  STORY_SESSION_ID,
  STORY_CHARACTER_ID,
} from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/ActiveGameSessionControls',
  component: ActiveGameSessionControls,
  parameters: {
    layout: 'padded',
  },
  args: {
    onConfirmEndStory: fn(),
    onCloseEndStory: fn(),
    onOpenJournal: fn(),
  },
} satisfies Meta<typeof ActiveGameSessionControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    character: mockCharacter as any,
    characterId: STORY_CHARACTER_ID,
    worldId: STORY_WORLD_ID,
    sessionId: STORY_SESSION_ID,
    showEndConfirmation: false,
  },
};

export const WithEndConfirmation: Story = {
  args: {
    character: mockCharacter as any,
    characterId: STORY_CHARACTER_ID,
    worldId: STORY_WORLD_ID,
    sessionId: STORY_SESSION_ID,
    showEndConfirmation: true,
  },
};

export const ProgressiveDisclosureHidden: Story = {
  args: {
    character: mockCharacter as any,
    characterId: STORY_CHARACTER_ID,
    worldId: STORY_WORLD_ID,
    sessionId: STORY_SESSION_ID,
    showEndConfirmation: false,
    isProgressiveDisclosureEnabled: true,
  },
};
