import type { Meta, StoryObj } from '@storybook/react';
import { ExportImportControls } from '../../components/shared/ExportImportControls';

const meta = {
  title: 'Narraitor/Shared/ExportImportControls',
  component: ExportImportControls,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Export/Import controls for game state backup and restoration.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ExportImportControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default export/import controls showing both export and import functionality.',
      },
    },
  },
};

