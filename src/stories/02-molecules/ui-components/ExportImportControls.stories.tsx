import { Meta, StoryObj } from '@storybook/react';
import { ExportImportControls } from '@/components/shared/ExportImportControls';

const meta: Meta<typeof ExportImportControls> = {
  title: '02-Molecules/ui-components/ExportImportControls',
  component: ExportImportControls,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Export/import controls for game state. The buttons are wired to the storage service; rendered here for visual review.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExportImportControls>;

export const Default: Story = {};
