import { Meta, StoryObj } from '@storybook/react';
import { SkipLinks } from '@/components/shared/SkipLinks';

const meta: Meta<typeof SkipLinks> = {
  title: '01-Atoms/navigation/SkipLinks',
  component: SkipLinks,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Accessibility skip links — visually hidden until focused. Tab into the frame to reveal them.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="story-skiplinks">
        <Story />
        <main id="main-content" tabIndex={-1} style={{ padding: 'var(--space-4)' }}>
          Press Tab to reveal the skip links above.
        </main>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SkipLinks>;

export const Default: Story = {};
