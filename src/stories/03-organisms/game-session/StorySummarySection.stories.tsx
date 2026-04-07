import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StorySummarySection } from '@/components/GameSession/StorySummarySection';
import { useWorldStore } from '@/state/worldStore';
import { createEmptyWorldState } from '@/types/world-state.types';
import {
  WithMockWorldStore,
  STORY_WORLD_ID,
  STORY_SESSION_ID,
  STORY_CHARACTER_ID,
} from './gameSessionStoryData';

const meta = {
  title: '03-Organisms/Game Session/StorySummarySection',
  component: StorySummarySection,
  parameters: {
    layout: 'padded',
  },
  args: {
    worldId: STORY_WORLD_ID,
    sessionId: STORY_SESSION_ID,
    characterId: STORY_CHARACTER_ID,
  },
  decorators: [WithMockWorldStore],
} satisfies Meta<typeof StorySummarySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

const WithCheckpoints = (Story: React.FC) => {
  useEffect(() => {
    useWorldStore.setState({
      worldStates: {
        [STORY_WORLD_ID]: {
          ...createEmptyWorldState(STORY_WORLD_ID),
          storyCheckpoints: [
            {
              id: 'cp-1',
              sessionId: STORY_SESSION_ID,
              segment:
                'Kael arrived at the storm-battered docks of Thornhaven as the last light faded over the archipelago.',
              createdAt: '2025-06-14T17:00:00Z',
              highlights: [],
              eventIds: [],
            },
            {
              id: 'cp-2',
              sessionId: STORY_SESSION_ID,
              segment:
                'The harbour-master grudgingly allowed passage after Kael mentioned the Old Archive. Inside the inner docks, a weathered ship awaited.',
              createdAt: '2025-06-14T17:05:00Z',
              highlights: [],
              eventIds: [],
            },
          ],
        },
      },
    });
    return () => {
      useWorldStore.setState({ worldStates: {} });
    };
  }, []);
  return React.createElement(Story);
};

export const WithContent: Story = {
  decorators: [WithCheckpoints],
};
