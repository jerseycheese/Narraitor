import { Meta, StoryObj } from '@storybook/react';
import { PreviewModal } from '@/components/shared/PreviewModal/PreviewModal';

const meta: Meta<typeof PreviewModal> = {
  title: '02-Molecules/ui-components/PreviewModal',
  component: PreviewModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PreviewModal>;

const world = { name: 'The Shattered Isles', genre: 'Fantasy' };

export const Default: Story = {
  render: () => (
    <PreviewModal<typeof world>
      isOpen
      data={world}
      title="Preview world"
      subtitle="Review before you commit"
      onConfirm={() => {}}
      onCancel={() => {}}
      renderContent={(d) => (
        <div className="story-preview-content">
          <h3>{d.name}</h3>
          <p>{d.genre}</p>
        </div>
      )}
    />
  ),
};
