import type { Meta, StoryObj } from '@storybook/react';
import { TermDefinition } from '@/components/Narrative/TermDefinition';
import type { TermDefinitionData } from '@/components/Narrative/useTermDefinitions';

const mockAnchorRect = {
  top: 200,
  right: 300,
  bottom: 220,
  left: 100,
  width: 200,
  height: 20,
  x: 100,
  y: 200,
  toJSON: () => ({}),
} as DOMRect;

const meta: Meta<typeof TermDefinition> = {
  title: '02-Molecules/narrative/TermDefinition',
  component: TermDefinition,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', minHeight: 400, padding: '2rem' }}>
        <p style={{ fontFamily: 'var(--font-narrative)', marginBottom: '1rem' }}>
          The narrative text flows here. Below is the term definition panel,
          positioned as it would appear when a player clicks a highlighted term.
        </p>
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
    anchorRect: mockAnchorRect,
    onDismiss: () => {},
  },
};

export const Location: Story = {
  args: {
    term: locationTerm,
    anchorRect: mockAnchorRect,
    onDismiss: () => {},
  },
};

export const Event: Story = {
  args: {
    term: eventTerm,
    anchorRect: mockAnchorRect,
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
    anchorRect: mockAnchorRect,
    onDismiss: () => {},
  },
};

export const AllCategories: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TermDefinition
        term={characterTerm}
        anchorRect={mockAnchorRect}
        onDismiss={() => {}}
      />
      <TermDefinition
        term={locationTerm}
        anchorRect={{ ...mockAnchorRect, bottom: 280 } as DOMRect}
        onDismiss={() => {}}
      />
      <TermDefinition
        term={eventTerm}
        anchorRect={{ ...mockAnchorRect, bottom: 340 } as DOMRect}
        onDismiss={() => {}}
      />
    </div>
  ),
};
