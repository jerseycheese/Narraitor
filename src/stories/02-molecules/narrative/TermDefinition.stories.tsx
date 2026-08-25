import type { Meta, StoryObj } from '@storybook/react';
import { TermDefinition } from '@/components/Narrative/TermDefinition';
import type { TermDefinitionData } from '@/components/Narrative/useTermDefinitions';

const meta: Meta<typeof TermDefinition> = {
  title: '02-Molecules/narrative/TermDefinition',
  component: TermDefinition,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The definition panel's own design - category badge, term name, type label and description - across the categories it renders for. Where the panel lands on the page is not shown here and can't be: placement depends on the play surface's scroller and prose column, neither of which exists in this canvas. For that, see the NarrativeDisplay story \"With Term Definitions (marginalia)\", and the geometry assertions in tests/visual/manuscript-regression-assertions.spec.ts.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const characterTerm: TermDefinitionData = {
  name: 'Lady Seraphina',
  category: 'characters',
  type: 'protagonist',
  description:
    'A former court mage who turned rogue after discovering the king\'s dark pact with the shadow realm. Known for her silver staff and dry wit.',
  importance: 'high',
};

const locationTerm: TermDefinitionData = {
  name: 'The Northern Tower',
  category: 'locations',
  type: 'fortress',
  description:
    'An ancient watchtower perched on the edge of the Frozen Wastes. Once a beacon of civilization, now home to a reclusive order of scholars.',
};

const eventTerm: TermDefinitionData = {
  name: 'The Great Siege',
  category: 'events',
  description:
    'A month-long assault on the capital city by the combined forces of the northern clans. Ended with the Treaty of Ash.',
  importance: 'medium',
};

export const Character: Story = {
  args: {
    term: characterTerm,
    onDismiss: () => {},
  },
};

export const Location: Story = {
  args: {
    term: locationTerm,
    onDismiss: () => {},
  },
};

export const Event: Story = {
  args: {
    term: eventTerm,
    onDismiss: () => {},
  },
};

export const WithoutType: Story = {
  args: {
    term: {
      name: 'The Shadow Pact',
      category: 'events',
      description: 'A secret agreement between the king and forces from the shadow realm.',
    },
    onDismiss: () => {},
  },
};

export const AllCategories: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TermDefinition
        term={characterTerm}
        onDismiss={() => {}}
      />
      <TermDefinition
        term={locationTerm}
        onDismiss={() => {}}
      />
      <TermDefinition
        term={eventTerm}
        onDismiss={() => {}}
      />
    </div>
  ),
};
