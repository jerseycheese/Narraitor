import type { Meta, StoryObj } from '@storybook/react';
import { DashboardHome } from '@/components/Dashboard/DashboardHome';
import { withDashboardScenario } from '@/components/Dashboard/DashboardHome.stories.helpers';

const meta: Meta<typeof DashboardHome> = {
  title: '05-Pages/standalone/DashboardHome',
  component: DashboardHome,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dashboard home page rendered for returning users. Variants cover the three valid states the page renders: barely-started (1 world, no characters), returning with assets but no active session, and active session (Continue card on top). True-empty users are routed to GuidedFirstTimeExperience by DashboardHome itself and aren’t representable here.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BarelyStarted: Story = {
  name: 'Barely Started (1 world)',
  decorators: [withDashboardScenario('barely-started')],
};

export const ReturningNoSession: Story = {
  name: 'Returning, No Active Session',
  decorators: [withDashboardScenario('returning-no-session')],
};

export const ActiveSession: Story = {
  name: 'Active Session',
  decorators: [withDashboardScenario('active-session')],
};
