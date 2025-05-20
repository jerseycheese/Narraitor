import type { Meta, StoryObj } from '@storybook/react';
import { GlobalStylesDemo } from './GlobalStylesDemo';

const meta: Meta<typeof GlobalStylesDemo> = {
  title: 'Design System/GlobalStylesDemo',
  component: GlobalStylesDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  // Add a decorator to force text colors in Storybook
  decorators: [
    (Story) => (
      <div className="text-neutral-900 bg-white p-4">
        <style>{`
          /* Storybook-specific overrides to ensure readability */
          #storybook-root {
            background-color: #ffffff;
          }
        `}</style>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlobalStylesDemo>;

export const Default: Story = {
  args: {},
};