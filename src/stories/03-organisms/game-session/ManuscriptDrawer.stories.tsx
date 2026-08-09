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
    <div style={{ padding: '2rem' }}>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <ManuscriptDrawer
        {...props}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
};

export const CharacterSheet: Story = {
  render: (args) => <DrawerHarness {...args} />,
  args: {
    title: 'Character Sheet',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p>This is the character sheet content inside the drawer.</p>
        <div style={{ height: 160, background: 'var(--color-surface-muted, hsl(0 0% 96%))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
          Portrait Placeholder
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontFamily: 'var(--font-narrative)', fontWeight: 700 }}>Attributes</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}><span>Strength</span><span>14</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}><span>Dexterity</span><span>12</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}><span>Intelligence</span><span>16</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}><span>Wisdom</span><span>10</span></div>
          </div>
        </div>
      </div>
    ),
  },
};

export const Inventory: Story = {
  render: (args) => <DrawerHarness {...args} />,
  args: {
    title: 'Inventory',
    side: 'left',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[
          { name: 'Healing Potion', qty: 3, desc: 'Restores 2d4+2 HP' },
          { name: 'Iron Shortsword', qty: 1, desc: 'Melee weapon, 1d6 slashing' },
          { name: 'Torch', qty: 5, desc: 'Provides light for 1 hour' },
          { name: 'Rope (50 ft)', qty: 1, desc: 'Hemp rope, 2 HP' },
          { name: 'Rations', qty: 7, desc: 'One day of food' },
        ].map((item) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{item.desc}</div>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>x{item.qty}</span>
          </div>
        ))}
      </div>
    ),
  },
};

export const LongContent: Story = {
  render: (args) => <DrawerHarness {...args} />,
  args: {
    title: 'World Lore',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
