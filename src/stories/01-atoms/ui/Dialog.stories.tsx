import { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Dialog> = {
  title: '01-Atoms/ui/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Open: Story = {
  render: () => (
    <Dialog open>
      <DialogContent className="story-dialog">
        <DialogTitle>Delete this world?</DialogTitle>
        <p>This removes the world and every character in it. This can&apos;t be undone.</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
