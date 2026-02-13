import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptDrawer } from '@/components/GameSession/ManuscriptDrawer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof ManuscriptDrawer> = {
  title: '03-Organisms/Game Session/ManuscriptDrawer',
  component: ManuscriptDrawer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ManuscriptDrawer>;

const DrawerHarness = (props: React.ComponentProps<typeof ManuscriptDrawer>) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <ManuscriptDrawer 
        {...props} 
        open={open} 
        onOpenChange={setOpen}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <DrawerHarness {...args} />,
  args: {
    title: 'Character Sheet',
    children: (
      <div className="space-y-4">
        <p>This is the character sheet content inside the drawer.</p>
        <div className="h-40 bg-zinc-100 rounded-md flex items-center justify-center text-zinc-400">
          Portrait Placeholder
        </div>
        <div className="space-y-2">
          <h4 className="font-serif font-bold">Attributes</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between border-b pb-1"><span>Strength</span><span>14</span></div>
            <div className="flex justify-between border-b pb-1"><span>Dexterity</span><span>12</span></div>
            <div className="flex justify-between border-b pb-1"><span>Intelligence</span><span>16</span></div>
            <div className="flex justify-between border-b pb-1"><span>Wisdom</span><span>10</span></div>
          </div>
        </div>
      </div>
    ),
  },
};

export const LeftSide: Story = {
  render: (args) => <DrawerHarness {...args} />,
  args: {
    ...Default.args,
    title: 'Inventory',
    side: 'left',
  },
};

export const LongContent: Story = {
  render: (args) => <DrawerHarness {...args} />,
  args: {
    title: 'World Lore',
    children: (
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i}>
            Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        ))}
      </div>
    ),
  },
};
