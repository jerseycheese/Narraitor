import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EndingScreen } from '@/components/GameSession/EndingScreen';
import { useNarrativeStore } from '@/state/narrativeStore';
import {
  withEndingScreenStores,
  mockStoryEndingTriumphant,
  mockStoryEndingTragic,
} from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/EndingScreen',
  component: EndingScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof EndingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Triumphant: Story = {
  decorators: [withEndingScreenStores(mockStoryEndingTriumphant)],
};

export const Tragic: Story = {
  decorators: [withEndingScreenStores(mockStoryEndingTragic)],
};

export const Bittersweet: Story = {
  decorators: [
    withEndingScreenStores({
      ...mockStoryEndingTriumphant,
      id: 'ending-bittersweet',
      tone: 'mysterious',
      epilogue:
        'The truth, when it finally came, was smaller than expected. Not a revelation but a quiet acknowledgement that some questions were never meant to be answered.',
      achievements: [],
    }),
  ],
};

export const Loading: Story = {
  decorators: [
    (Story: React.FC) => {
      React.useEffect(() => {
        useNarrativeStore.setState({ isGeneratingEnding: true, currentEnding: null });
        return () => {
          useNarrativeStore.setState({ isGeneratingEnding: false });
        };
      }, []);
      return React.createElement(Story);
    },
  ],
};
