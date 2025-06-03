import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Narraitor/UI/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Enhanced breadcrumbs component with optional next-step guidance. Best tested in the Navigation Flow test harness at /dev/navigation-flow.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicExample: Story = {
  name: 'Basic Example',
  parameters: {
    docs: {
      description: {
        story: 'For full testing of breadcrumbs with different navigation states, use the test harness at /dev/navigation-flow in the running application.',
      },
    },
  },
  args: {
    showNextStep: true,
  },
};