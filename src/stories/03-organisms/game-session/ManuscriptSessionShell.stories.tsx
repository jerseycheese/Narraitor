import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptSessionShell } from '@/components/GameSession/ManuscriptSessionShell';
import { ManuscriptActionRail } from '@/components/GameSession/ManuscriptActionRail';
import { ManuscriptFloatingHud } from '@/components/GameSession/ManuscriptFloatingHud';
import React from 'react';

const meta: Meta<typeof ManuscriptSessionShell> = {
  title: '03-Organisms/Game Session/ManuscriptSessionShell',
  component: ManuscriptSessionShell,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ManuscriptSessionShell>;

export const Default: Story = {
  args: {
    hud: (
      <div className="manuscript-overlay-header-left p-4 pointer-events-auto">
        <div className="h-10 w-40 bg-background/80 backdrop-blur-sm border rounded-full flex items-center justify-center text-xs font-system">
          HUD PLACEHOLDER
        </div>
      </div>
    ),
    children: (
      <div className="space-y-8">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="text-narrative">
            <p>
              Paragraph {i + 1}: The manuscript layout provides a stable reading surface. 
              Each line of text is carefully measured for optimal legibility. 
              As the AI generates more content, this column will grow, but the 
              overall stage remains fixed and steady.
            </p>
          </div>
        ))}
      </div>
    ),
    actionRail: (
      <ManuscriptActionRail>
        <div className="h-20 bg-background/80 backdrop-blur-sm border-t flex items-center justify-center text-xs font-system">
          ACTION RAIL PLACEHOLDER
        </div>
      </ManuscriptActionRail>
    ),
  },
};

export const WithMarginContent: Story = {
  args: {
    ...Default.args,
    marginContent: (
      <div className="space-y-4">
        <h4 className="text-xs font-system text-muted-foreground uppercase tracking-wider">Suggested</h4>
        {[1, 2, 3].map(i => (
          <button key={i} className="manuscript-suggested-action w-full text-left p-3 text-sm rounded-sm border">
            Choice {i}
          </button>
        ))}
      </div>
    ),
  },
};

export const Streaming: Story = {
  args: {
    ...WithMarginContent.args,
    actionRail: (
      <ManuscriptActionRail isStreaming={true}>
        <div className="h-20 bg-background/80 backdrop-blur-sm border-t flex items-center justify-center text-xs font-system text-accent">
          GENERATING CONTENT...
        </div>
      </ManuscriptActionRail>
    ),
  },
};
