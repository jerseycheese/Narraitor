import type { Meta, StoryObj } from '@storybook/react';
import { CharacterSnapshot } from '@/components/GameSession/CharacterSnapshot';
import { mockCharacter, WithMockWorldStore } from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/CharacterSnapshot',
  component: CharacterSnapshot,
  parameters: {
    layout: 'padded',
  },
  decorators: [WithMockWorldStore],
} satisfies Meta<typeof CharacterSnapshot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    character: mockCharacter as never,
  },
};

export const NoSkills: Story = {
  args: {
    character: {
      ...mockCharacter,
      skills: [],
    } as never,
  },
};

/** Alignment row + meter appear once a choice has shifted the axis (#468). */
export const WithAlignment: Story = {
  args: {
    character: {
      ...mockCharacter,
      alignment: -42,
    } as never,
  },
};
