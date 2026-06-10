import type { Meta, StoryObj } from '@storybook/react';
import { DecisionFlowSection } from '@/components/devtools/DecisionFlowSection';
import { useNarrativeStore } from '@/state/narrativeStore';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';

const meta: Meta<typeof DecisionFlowSection> = {
  title: '03-Organisms/devtools/sections/DecisionFlowSection',
  component: DecisionFlowSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Read-only DevTools trace of decision creation: origin segment, AI-generated options with alignments, the player selection, the tracker record, the narrative outcome, and segment-level prompt debug info when capture was on.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof DecisionFlowSection>;

const SESSION_ID = 'storybook-session';

const decision: Decision = {
  id: 'storybook-decision-1',
  prompt: 'A guard blocks the gate and demands papers',
  options: [
    { id: 'option-1', text: 'Slip him a few coins', alignment: 'chaotic' },
    { id: 'option-2', text: 'Present forged documents', alignment: 'neutral', hint: 'Risky if inspected' },
    { id: 'option-3', text: 'Ask politely for an exception', alignment: 'lawful' }
  ],
  selectedOptionId: 'option-1',
  selectedAt: new Date(),
  decisionWeight: 'major',
  narrativeSegmentId: 'storybook-segment-1'
};

const originSegment: NarrativeSegment = {
  id: 'storybook-segment-1',
  sessionId: SESSION_ID,
  content: 'You approach the city gate at dusk. A bored guard straightens up and blocks your path.',
  type: 'scene',
  metadata: { tags: [] },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const outcomeSegment: NarrativeSegment = {
  id: 'storybook-segment-2',
  sessionId: SESSION_ID,
  content: 'The guard pockets the coins with practiced ease and waves you through without a second glance.',
  type: 'action',
  metadata: {
    tags: [],
    causedByDecisionId: 'storybook-decision-1',
    decisionOutcome: 'success',
    debugInfo: {
      fullPrompt:
        'Continue the narrative. The player chose: "Slip him a few coins" at the city gate. Tone: tense. Recent decisions: none.',
      templateName: 'Scene Template',
      modelUsed: 'gemini-2.5-flash',
      tokenUsage: { promptTokens: 412, completionTokens: 96, totalTokens: 508 },
      generatedAt: new Date()
    }
  },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const seedStores = () => {
  playerDecisionTracker.clearDecisions();
  playerDecisionTracker.recordDecision(
    decision.prompt,
    'Slip him a few coins',
    'chaotic',
    SESSION_ID,
    'storybook-world',
    { location: 'City gate' }
  );
  useNarrativeStore.setState({
    decisions: { [decision.id]: decision },
    sessionDecisions: { [SESSION_ID]: [decision.id] },
    segments: {
      [originSegment.id]: originSegment,
      [outcomeSegment.id]: outcomeSegment
    }
  });
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => {
    useNarrativeStore.setState({ decisions: {}, sessionDecisions: {}, segments: {} });
    return <DecisionFlowSection />;
  }
};

export const WithDecisionTrace: Story = {
  name: 'With Decision Trace',
  render: () => {
    seedStores();
    return <DecisionFlowSection />;
  }
};
