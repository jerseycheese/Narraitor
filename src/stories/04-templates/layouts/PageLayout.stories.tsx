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
        component: `
        A reusable page layout component that provides consistent structure across all application pages.
        
        **Features:**
        - Consistent header with title, description, and actions
        - Responsive design with proper spacing
        - Fixed 7xl container width to match navigation
        - Semantic HTML structure
        - Built-in action button area
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The main page title'
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title'
    },
    actions: {
      control: false,
      description: 'React nodes for action buttons'
    },
    children: {
      control: false,
      description: 'Page content'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleActions = (
  <ActionButtonGroup
    actions={[
      {
        label: 'Primary Action',
        onClick: () => console.log('Primary clicked'),
        variant: 'primary'
      },
      {
        label: 'Secondary Action', 
        onClick: () => console.log('Secondary clicked'),
        variant: 'secondary'
      }
    ]}
  />
);

const sampleContent = (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Card {i}</h3>
        <p className="text-gray-700">Sample content for card {i}</p>
      </div>
    ))}
  </div>
);

export const Default: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    description: 'This is a sample page using the PageLayout component.',
    actions: sampleActions,
    children: sampleContent
  }
};

export const NoActions: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    description: 'A page without any action buttons.',
    children: sampleContent
  }
};

export const NoDescription: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    actions: sampleActions,
    children: sampleContent
  }
};

export const MinimalPage: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    children: (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Empty State</h2>
        <p className="text-gray-700">No content to display yet.</p>
      </div>
    )
  }
};

export const WorldsPageExample: Story = {
  args: {
    title: 'My Worlds',
    description: "Create unique story worlds, then manage characters and play through interactive narratives. Your currently active world appears in the navigation bar.",
    actions: (
      <ActionButtonGroup
        actions={[
          {
            label: 'Create World',
            onClick: () => console.log('Create World clicked'),
            variant: 'primary',
            icon: (<Plus className="w-4 h-4" aria-hidden="true" />)
          },
          {
            label: 'Generate World',
            onClick: () => console.log('Generate World clicked'),
            variant: 'secondary',
            icon: (<Play className="w-4 h-4" aria-hidden="true" />)
          }
        ]}
      />
    ),
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Fantasy Realm', 'Cyberpunk City', 'Wild West'].map(world => (
          <div key={world} className="bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-blue-300 transition-colors">
            <h3 className="text-lg font-semibold mb-2">{world}</h3>
            <p className="text-gray-700 mb-4">A sample world description...</p>
            <div className="flex gap-2">
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
    )
  }
};

export const CharactersPageExample: Story = {
  args: {
    title: 'Fantasy Realm Characters',
    description: 'Create unique characters for your interactive narrative adventures. Use the "Make Active" button on a character to set them as your current character for gameplay.',
    actions: (
      <ActionButtonGroup
        actions={[
          {
            label: 'Create Character',
            onClick: () => console.log('Create Character clicked'),
            variant: 'primary',
            icon: (<Plus className="w-4 h-4" aria-hidden="true" />)
          },
          {
            label: 'Generate Character',
            onClick: () => console.log('Generate Character clicked'),
            variant: 'secondary',
            icon: (<Sparkles className="w-4 h-4" aria-hidden="true" />)
          },
          {
            label: 'Start Playing',
            onClick: () => console.log('Start Playing clicked'),
            variant: 'success',
            icon: (<Sparkles className="w-4 h-4" aria-hidden="true" />)
          }
        ]}
      />
    ),
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Aria Starweaver', 'Zane Shadowblade', 'Luna Brightforge'].map(character => (
          <div key={character} className="bg-white rounded-lg shadow p-6 border-2 border-green-500 bg-green-50 relative">
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Active
            </div>
            <h3 className="text-lg font-semibold mb-2">{character}</h3>
            <p className="text-gray-700 mb-4">Level 5 Warrior</p>
            <div className="flex gap-2 flex-wrap">
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
        ))}
      </div>
    )
  }
};

export const ConsistentWidth: Story = {
  args: {
    title: 'Consistent Width Layout',
    description: 'All pages now use the same max-width (7xl) to match navigation',
    children: (
      <div className="bg-white rounded-lg shadow p-6">
        <p>Content with consistent 7xl max width that matches the navigation bar.</p>
        <p className="mt-2 text-gray-600">This ensures all page content aligns perfectly with the navigation structure.</p>
      </div>
    )
  }
};
