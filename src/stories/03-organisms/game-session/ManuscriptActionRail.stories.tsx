import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptActionRail } from '@/components/GameSession/ManuscriptActionRail';
import React from 'react';

const meta: Meta<typeof ManuscriptActionRail> = {
  title: '03-Organisms/Game Session/ManuscriptActionRail',
  component: ManuscriptActionRail,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="manuscript-viewport-layer" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManuscriptActionRail>;

export const Default: Story = {
  args: {
    children: (
      <div className="flex items-center justify-center gap-3 p-4 bg-background/80 backdrop-blur-sm border-t">
        <button type="button" className="px-4 py-2 text-sm border rounded-md font-interface hover:bg-accent/10">
          Investigate the ruins
        </button>
        <button type="button" className="px-4 py-2 text-sm border rounded-md font-interface hover:bg-accent/10">
          Talk to the merchant
        </button>
        <button type="button" className="px-4 py-2 text-sm border rounded-md font-interface hover:bg-accent/10">
          Rest at the camp
        </button>
      </div>
    ),
  },
};

export const Streaming: Story = {
  args: {
    isStreaming: true,
    children: (
      <div className="flex items-center justify-center gap-2 p-4 bg-background/80 backdrop-blur-sm border-t">
        <span className="text-xs font-system text-accent animate-pulse">Generating narrative...</span>
      </div>
    ),
  },
};
