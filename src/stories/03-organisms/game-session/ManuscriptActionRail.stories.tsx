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

const choiceButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: 'var(--font-size-sm)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-interface)',
  background: 'transparent',
  cursor: 'pointer',
};

export const Default: Story = {
  args: {
    children: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)', backdropFilter: 'blur(4px)', borderTop: '1px solid var(--color-border)' }}>
        <button type="button" style={choiceButtonStyle}>
          Investigate the ruins
        </button>
        <button type="button" style={choiceButtonStyle}>
          Talk to the merchant
        </button>
        <button type="button" style={choiceButtonStyle}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)', backdropFilter: 'blur(4px)', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-system)', color: 'var(--color-accent)' }}>Generating narrative...</span>
      </div>
    ),
  },
};
