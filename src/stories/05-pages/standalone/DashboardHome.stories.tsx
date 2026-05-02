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
          'The dashboard home page rendered for returning users. Variants cover the three states the page renders: active session, returning user with no active session, and empty-but-not-first-time (used to QA the empty Recent + full Getting Started checklist without falling through to the first-time wizard).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveSession: Story = {
  name: 'Active Session',
  decorators: [withDashboardScenario('active-session')],
};

export const ReturningNoSession: Story = {
  name: 'Returning, No Active Session',
  decorators: [withDashboardScenario('returning-no-session')],
};

export const EmptyButNotFirstTime: Story = {
  name: 'Empty (bypassing first-time)',
  decorators: [withDashboardScenario('empty-but-not-first-time')],
};
