import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { SessionBreakPrompt } from '@/components/Narrative/SessionBreakPrompt';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import { useSessionPacing } from '@/components/Narrative/hooks/useSessionPacing';
import { NarrativeSegment } from '@/types/narrative.types';

const meta: Meta = {
  title: '03-Organisms/Narrative/SessionPacing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Demonstrates session pacing features: collapsed history with expand control, milestone toasts, and soft break prompts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const sampleSegments: NarrativeSegment[] = Array.from({ length: 12 }, (_, i) => ({
  id: `segment-${i + 1}`,
  content: `Story beat ${i + 1}. The party continues forward along the winding mountain trail as the fog thickens around them.`,
  type: 'scene',
  metadata: { tags: [] },
  timestamp: new Date(Date.now() - (12 - i) * 60000),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * NarrativeHistory showing 7 of 12 segments collapsed behind an expand button.
 */
export const CollapsedHistory: Story = {
  render: () => {
    return (
      <div style={{ height: '500px', maxWidth: '700px', border: '1px solid var(--color-border)' }}>
        <NarrativeHistory
          segments={sampleSegments}
          maxVisibleSegments={7}
          disableInitialAutoScroll={true}
        />
      </div>
    );
  },
};

/**
 * Soft break prompt modal suggested at a natural stopping point.
 */
export const BreakPromptOpen: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Open Break Prompt
        </button>
        <SessionBreakPrompt
          isOpen={isOpen}
          onDismiss={() => setIsOpen(false)}
          onContinue={() => setIsOpen(false)}
          sessionMetrics={{
            elapsedMinutes: 15,
            segmentCount: 12,
            decisionCount: 3,
          }}
        />
      </div>
    );
  },
};

function MilestonePacingDemo() {
  const [segmentCount, setSegmentCount] = useState(4);
  const pacing = useSessionPacing({
    segmentCount,
    milestoneInterval: 5,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <div>
        <p>Current segment count: <strong>{segmentCount}</strong></p>
        <p>Milestone toast triggers every 5 story beats.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setSegmentCount((prev) => prev + 1)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Add story beat (+1)
        </button>
        <button
          type="button"
          onClick={() => setSegmentCount(10)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Jump to 10 beats
        </button>
      </div>
      <SessionBreakPrompt
        isOpen={pacing.showBreakPrompt}
        onDismiss={pacing.dismissBreakPrompt}
        onContinue={pacing.continueReading}
        sessionMetrics={pacing.metrics}
      />
    </div>
  );
}

/**
 * Demonstrates milestone toasts firing at thresholds (e.g. 5, 10 story beats).
 */
export const MilestoneToasts: Story = {
  render: () => (
    <ToastProvider>
      <Toaster />
      <MilestonePacingDemo />
    </ToastProvider>
  ),
};
