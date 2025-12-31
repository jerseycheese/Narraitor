import type { Meta, StoryObj } from '@storybook/react';
import SettingsPage from '@/app/settings/page';

const meta: Meta<typeof SettingsPage> = {
  title: '05-Pages/standalone/SettingsPage',
  component: SettingsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Settings page with data management controls for backup and restore functionality.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Settings Page',
  parameters: {
    docs: {
      description: {
        story: 'The complete settings page showing the data management section with export/import controls integrated using shadcn/ui Card components.',
      },
    },
  },
};