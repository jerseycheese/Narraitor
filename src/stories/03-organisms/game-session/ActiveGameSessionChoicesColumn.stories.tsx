import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ActiveGameSessionChoicesColumn from '@/components/GameSession/ActiveGameSessionChoicesColumn';
import { mockDecision } from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/ActiveGameSessionChoicesColumn',
  component: ActiveGameSessionChoicesColumn,
  parameters: {
    layout: 'padded',
  },
  args: {
    onChoiceSelected: fn(),
    onCustomSubmit: fn(),
  },
} satisfies Meta<typeof ActiveGameSessionChoicesColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithChoices: Story = {
  args: {
    currentDecision: mockDecision,
    segmentCount: 5,
    status: 'active',
    isGenerating: false,
    isGeneratingChoices: false,
    isSessionEnded: false,
    worldSkills: [],
    characterSkills: [],
    inventoryItems: [],
  },
};

export const GeneratingChoices: Story = {
  args: {
    currentDecision: null,
    isGenerating: true,
    isGeneratingChoices: true,
    segmentCount: 5,
    status: 'active',
    isSessionEnded: false,
    worldSkills: [],
    characterSkills: [],
    inventoryItems: [],
  },
};

export const Skeleton: Story = {
  args: {
    currentDecision: null,
    segmentCount: 0,
    status: 'active',
    isGenerating: false,
    isGeneratingChoices: false,
    isSessionEnded: false,
    worldSkills: [],
    characterSkills: [],
    inventoryItems: [],
  },
};

