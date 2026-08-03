import type { Meta, StoryObj } from '@storybook/react';
import { AppSurfaceShell } from '@/components/layout/AppSurfaceShell';
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoadingProvider';
import { PageLayout } from '@/components/shared/PageLayout';
import { withStores } from '../../../../.storybook/decorators/withStores';
import type { World } from '@/types/world.types';

const makeWorld = (id: string, name: string, description: string): World => ({
  id,
  name,
  description,
  genre: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 20,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const WORLDS = {
  'world-1': makeWorld('world-1', 'Realm of Shadows', 'A dark fantasy world'),
  'world-2': makeWorld('world-2', 'Neo-Tokyo 2185', 'Cyberpunk future'),
  'world-3': makeWorld('world-3', 'Dustbowl County', 'Wild west frontier'),
};

const meta: Meta<typeof AppSurfaceShell> = {
  title: '04-Templates/layouts/AppShell',
  component: AppSurfaceShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `The app surface: one header, a conditional breadcrumb band, and a centered content column. Every route outside play renders inside it; play renders on the chrome-free manuscript surface instead (#1655).

The header's contextual CTA has four states, one per story below. Keeping them side by side is what stopped the shell drifting into two chromes the first time.`,
      },
    },
  },
  decorators: [
    (Story) => (
      <NavigationLoadingProvider>
        <Story />
      </NavigationLoadingProvider>
    ),
  ],
  args: {
    children: (
      <PageLayout
        title="Worlds"
        description="Every world you've built, with the characters who live in them."
      >
        <p>Page content sits here, inside the shell&apos;s content column.</p>
      </PageLayout>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoWorlds: Story = {
  decorators: [
    withStores({ world: { worlds: {}, currentWorldId: null } }),
  ],
  parameters: {
    nextjs: { navigation: { pathname: '/dashboard' } },
    docs: {
      description: {
        story: 'Nothing built yet, so the CTA is the accent "Create Your First World".',
      },
    },
  },
};

export const WorldsNoneActive: Story = {
  decorators: [
    withStores({ world: { worlds: WORLDS, currentWorldId: null } }),
  ],
  parameters: {
    nextjs: { navigation: { pathname: '/dashboard' } },
    docs: {
      description: {
        story:
          'Worlds exist but none is active. No CTA — the switcher\'s "Select World" is already the action.',
      },
    },
  },
};

export const ActiveWorld: Story = {
  decorators: [
    withStores({ world: { worlds: WORLDS, currentWorldId: 'world-1' } }),
  ],
  parameters: {
    nextjs: { navigation: { pathname: '/dashboard' } },
    docs: {
      description: {
        story:
          'An active world gives the green Play, the same treatment Play carries on every card and in the mobile drawer.',
      },
    },
  },
};

export const CtaSuppressed: Story = {
  decorators: [
    withStores({ world: { worlds: WORLDS, currentWorldId: 'world-1' } }),
  ],
  parameters: {
    nextjs: { navigation: { pathname: '/worlds/world-1' } },
    docs: {
      description: {
        story:
          'On a route that owns the play action inline, the header CTA is suppressed so the screen ships one Play, not two. The breadcrumb band shows here because /worlds/[id] is not a top-level destination.',
      },
    },
  },
};
