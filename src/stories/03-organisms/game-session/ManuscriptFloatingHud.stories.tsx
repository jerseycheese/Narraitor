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
    characterName: 'The Archivist',
    drawerTriggers: true,
  },
};

export const CharacterPanelOpen: Story = {
  args: {
    ...Default.args,
    characterName: 'The Archivist',
    isCharacterSummaryExpanded: true,
    characterSummaryPanel: (
      <div style={{ padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-drawer)' }}>
        <h4 style={{ fontFamily: 'var(--font-narrative)', fontWeight: 700, marginBottom: '0.5rem' }}>The Archivist</h4>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Level 4 Scholar</div>
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Strength</span><span>8</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Intelligence</span><span>16</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Wisdom</span><span>14</span></div>
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
      <div style={{ padding: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-drawer)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tools</div>
        {['Character Details', 'Inventory', 'Story So Far', 'Choice History', 'Journal Snapshot'].map((label) => (
          <button key={label} type="button" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-interface)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>
    ),
  },
};
