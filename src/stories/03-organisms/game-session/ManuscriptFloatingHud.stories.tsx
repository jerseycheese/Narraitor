import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptFloatingHud } from '@/components/GameSession/ManuscriptFloatingHud';
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
    characterName: 'The Archivist',
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

export const CharacterPanelOpen: Story = {
  args: {
    ...Default.args,
    characterName: 'The Archivist',
    isCharacterSummaryExpanded: true,
    characterSummaryPanel: (
      <div className="p-4 bg-background border rounded-lg shadow-xl">
        <h4 className="font-serif font-bold mb-2">The Archivist</h4>
        <div className="text-sm text-muted-foreground">Level 4 Scholar</div>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between"><span>Strength</span><span>8</span></div>
          <div className="flex justify-between"><span>Intelligence</span><span>16</span></div>
          <div className="flex justify-between"><span>Wisdom</span><span>14</span></div>
        </div>
      </div>
    ),
  },
};

export const ToolsPanelOpen: Story = {
  args: {
    ...Default.args,
    characterName: 'The Archivist',
    isToolsMenuOpen: true,
    toolsMenuPanel: (
      <div className="p-3 bg-background border rounded-lg shadow-xl space-y-1">
        <div className="text-xs font-system text-muted-foreground uppercase tracking-wider mb-2">Tools</div>
        {['Character Details', 'Inventory', 'Story So Far', 'Choice History', 'Journal Snapshot'].map((label) => (
          <button key={label} type="button" className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-accent/10 font-interface">
            {label}
          </button>
        ))}
      </div>
    ),
  },
};
