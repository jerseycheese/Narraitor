import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptSessionShell } from '@/components/GameSession/ManuscriptSessionShell';
import { ManuscriptActionRail } from '@/components/GameSession/ManuscriptActionRail';
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
      <div className="manuscript-overlay-header-left" style={{ padding: '1rem', pointerEvents: 'auto' }}>
        <div style={{ height: 40, width: 160, background: 'var(--color-surface, hsl(0 0% 98%))', backdropFilter: 'blur(4px)', border: '1px solid var(--color-border, hsl(0 0% 90%))', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-system)' }}>
          HUD PLACEHOLDER
        </div>
      </div>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
        <div style={{ height: 80, background: 'var(--color-surface, hsl(0 0% 98%))', backdropFilter: 'blur(4px)', borderTop: '1px solid var(--color-border, hsl(0 0% 90%))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-system)' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-system)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested</h4>
        {[1, 2, 3].map(i => (
          <button key={i} className="manuscript-suggested-action" style={{ width: '100%', textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
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
        <div style={{ height: 80, background: 'var(--color-surface, hsl(0 0% 98%))', backdropFilter: 'blur(4px)', borderTop: '1px solid var(--color-border, hsl(0 0% 90%))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-system)', color: 'var(--color-accent)' }}>
          GENERATING CONTENT...
        </div>
      </ManuscriptActionRail>
    ),
  },
};

export const WithCharactersRail: Story = {
  args: {
    ...Default.args,
    marginContent: (
      <div className="manuscript-characters-rail-section">
        <p className="manuscript-characters-rail-label">Characters Present</p>
        <div className="manuscript-characters-rail-list">
          {['Elara the Wise', 'Thorne', 'Captain Vex'].map((name) => (
            <span key={name} className="manuscript-character-badge">
              <span className="manuscript-character-name">{name}</span>
            </span>
          ))}
        </div>
      </div>
    ),
  },
};
