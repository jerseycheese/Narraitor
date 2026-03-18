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
      <div className="manuscript-viewport-layer" style={{ background: 'var(--color-surface-muted, hsl(0 0% 96%))', padding: '1rem' }}>
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
        <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>SAVED</div>
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
      <div style={{ padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-drawer)' }}>
        <h4 style={{ fontFamily: 'var(--font-narrative)', fontWeight: 700, marginBottom: '0.5rem' }}>The Archivist</h4>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Level 4 Scholar</div>
      </div>
    ),
  },
};
