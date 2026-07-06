import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from '@/components/shared/PageLayout';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Play } from 'lucide-react';

const meta: Meta<typeof PageLayout> = {
  title: '04-Templates/layouts/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A reusable page layout component that provides consistent structure across all application pages.

**Features:**
- Consistent header with title, description, and actions
- Responsive design with proper spacing
- Fixed 7xl width to match navigation
- Semantic HTML structure
- Built-in action button area`,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The main page title',
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title',
    },
    actions: {
      control: false,
      description: 'React nodes for action buttons',
    },
    children: {
      control: false,
      description: 'Page content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleActions = (
  <ActionButtonGroup
    actions={[
      {
        label: 'Primary Action',
        onClick: () => console.log('Primary clicked'),
        variant: 'primary',
      },
      {
        label: 'Secondary Action',
        onClick: () => console.log('Secondary clicked'),
        variant: 'secondary',
      },
    ]}
  />
);

const sampleContent = (
  <div>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i}>
        <h3>Card {i}</h3>
        <p>Sample content for card {i}</p>
      </div>
    ))}
  </div>
);

export const Default: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    description: 'This is a sample page using the PageLayout component.',
    actions: sampleActions,
    children: sampleContent,
  },
};

export const NoActions: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    description: 'A page without any action buttons.',
    children: sampleContent,
  },
};

export const NoDescription: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    actions: sampleActions,
    children: sampleContent,
  },
};

export const MinimalPage: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    children: (
      <div>
        <h2>Empty State</h2>
        <p>No content to display yet.</p>
      </div>
    ),
  },
};

export const WorldsPageExample: Story = {
  args: {
    title: 'My Worlds',
    description:
      'Create unique story worlds, then manage characters and play through interactive narratives. Your active world is highlighted below.',
    actions: (
      <ActionButtonGroup
        actions={[
          {
            label: 'Create World',
            onClick: () => console.log('Create World clicked'),
            variant: 'primary',
            icon: <Plus aria-hidden="true" />,
          },
          {
            label: 'Generate World',
            onClick: () => console.log('Generate World clicked'),
            variant: 'secondary',
            icon: <Play aria-hidden="true" />,
          },
        ]}
      />
    ),
    children: (
      <div>
        {['Fantasy Realm', 'Cyberpunk City', 'Wild West'].map((world) => (
          <div key={world}>
            <h3>{world}</h3>
            <p>A sample world description...</p>
            <div>
              <Button variant="success" size="sm">
                Make Active
              </Button>
              <Button variant="default" size="sm">
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    ),
  },
};

export const CharactersPageExample: Story = {
  args: {
    title: 'Fantasy Realm Characters',
    description:
      'Create unique characters for your interactive narrative adventures. Use the "Make Active" button on a character to set them as your current character for gameplay.',
    actions: (
      <ActionButtonGroup
        actions={[
          {
            label: 'Create Character',
            onClick: () => console.log('Create Character clicked'),
            variant: 'primary',
            icon: <Plus aria-hidden="true" />,
          },
          {
            label: 'Generate Character',
            onClick: () => console.log('Generate Character clicked'),
            variant: 'secondary',
            icon: <Sparkles aria-hidden="true" />,
          },
          {
            label: 'Start Playing',
            onClick: () => console.log('Start Playing clicked'),
            variant: 'success',
            icon: <Sparkles aria-hidden="true" />,
          },
        ]}
      />
    ),
    children: (
      <div>
        {['Aria Starweaver', 'Zane Shadowblade', 'Luna Brightforge'].map(
          (character) => (
            <div key={character}>
              <div>Active</div>
              <h3>{character}</h3>
              <p>Level 5 Warrior</p>
              <div>
                <Button variant="default" size="sm">
                  View
                </Button>
                <Button variant="default" size="sm">
                  Edit
                </Button>
                <Button variant="success" size="sm">
                  Play
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    ),
  },
};

export const ConsistentWidth: Story = {
  args: {
    title: 'Consistent Width Layout',
    description:
      'All pages now use the same max-width (7xl) to match navigation',
    children: (
      <div>
        <p>
          Content with consistent 7xl max width that matches the navigation bar.
        </p>
        <p>
          This ensures all page content aligns perfectly with the navigation
          structure.
        </p>
      </div>
    ),
  },
};
