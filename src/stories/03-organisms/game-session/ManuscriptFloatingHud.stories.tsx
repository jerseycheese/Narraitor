import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptFloatingHud } from '@/components/GameSession/ManuscriptFloatingHud';
import { Button } from '@/components/ui/button';
import { Book, Package, ArrowLeft, RefreshCw } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof ManuscriptFloatingHud> = {
  title: '03-Organisms/Game Session/ManuscriptFloatingHud',
  component: ManuscriptFloatingHud,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="manuscript-viewport-layer bg-zinc-100 p-4">
        <header className="manuscript-overlay-header">
          <Story />
        </header>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManuscriptFloatingHud>;

export const Default: Story = {
  args: {
    onToggleCharacterSummary: () => {},
    isCharacterSummaryExpanded: false,
    onToggleToolsMenu: () => {},
    isToolsMenuOpen: false,
    rightContent: (
      <div className="manuscript-hud-right-controls">
        <div className="text-[10px] font-system text-muted-foreground mr-2">SAVED</div>
        <button type="button" className="manuscript-hud-text-button">
          Reset
        </button>
      </div>
    ),
    drawerTriggers: true,
  },
};

export const Expanded: Story = {
  args: {
    ...Default.args,
    isCharacterSummaryExpanded: true,
    characterSummaryPanel: (
      <div className="p-4 bg-background border rounded-lg shadow-xl">
        <h4 className="font-serif font-bold mb-2">The Archivist</h4>
        <div className="text-sm text-muted-foreground">Level 4 Scholar</div>
      </div>
    ),
  },
};
