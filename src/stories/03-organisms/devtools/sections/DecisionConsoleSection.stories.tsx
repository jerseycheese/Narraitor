import type { Meta, StoryObj } from '@storybook/react';
import { DecisionConsoleSection } from '@/components/devtools/DecisionConsoleSection';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import type { ChoiceTypePreference } from '@/types/personalization.types';

const meta: Meta<typeof DecisionConsoleSection> = {
  title: '03-Organisms/devtools/sections/DecisionConsoleSection',
  component: DecisionConsoleSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Read-only DevTools console over the playerDecisionTracker records: search, filter by choice type or world, inspect full metadata, view choice-pattern analysis, and export the filtered set as JSON.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof DecisionConsoleSection>;

const seedTracker = (
  decisions: Array<{
    prompt: string;
    choiceText: string;
    choiceType: ChoiceTypePreference;
    worldId?: string;
    location?: string;
  }>
) => {
  playerDecisionTracker.clearDecisions();
  decisions.forEach((decision) => {
    playerDecisionTracker.recordDecision(
      decision.prompt,
      decision.choiceText,
      decision.choiceType,
      'storybook-session',
      decision.worldId || 'storybook-world',
      decision.location ? { location: decision.location } : undefined
    );
  });
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => {
    playerDecisionTracker.clearDecisions();
    return <DecisionConsoleSection />;
  }
};

export const WithDecisions: Story = {
  name: 'With Tracked Decisions',
  render: () => {
    seedTracker([
      {
        prompt: 'A guard blocks the gate and demands papers',
        choiceText: 'Slip him a few coins',
        choiceType: 'chaotic',
        location: 'City gate'
      },
      {
        prompt: 'The merchant offers a suspiciously good deal',
        choiceText: 'Negotiate a fair price instead',
        choiceType: 'diplomatic',
        location: 'Market square'
      },
      {
        prompt: 'A stranger asks for help carrying supplies',
        choiceText: 'Offer to carry the heavier crates',
        choiceType: 'helpful',
        worldId: 'storybook-world-2',
        location: 'Docks'
      },
      {
        prompt: 'Bandits demand your coin purse',
        choiceText: 'Draw your blade',
        choiceType: 'aggressive',
        worldId: 'storybook-world-2',
        location: 'Forest road'
      }
    ]);
    return <DecisionConsoleSection />;
  }
};
