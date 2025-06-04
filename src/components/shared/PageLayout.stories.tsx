import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from './PageLayout';

const meta: Meta<typeof PageLayout> = {
  title: 'Narraitor/Shared/PageLayout',
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
        - Configurable container width
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
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '4xl', '6xl', '7xl'],
      description: 'Maximum width of the page content'
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
  <>
    <button className="py-2 px-4 bg-blue-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors">
      Primary Action
    </button>
    <button className="py-2 px-4 bg-purple-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-purple-600 transition-colors">
      Secondary Action
    </button>
  </>
);

const sampleContent = (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Card {i}</h3>
        <p className="text-gray-600">Sample content for card {i}</p>
      </div>
    ))}
  </div>
);

export const Default: Story = {
  args: {
    title: 'My Page',
    description: 'This is a sample page using the PageLayout component.',
    actions: sampleActions,
    children: sampleContent
  }
};

export const NoActions: Story = {
  args: {
    title: 'Simple Page',
    description: 'A page without any action buttons.',
    children: sampleContent
  }
};

export const NoDescription: Story = {
  args: {
    title: 'Title Only',
    actions: sampleActions,
    children: sampleContent
  }
};

export const MinimalPage: Story = {
  args: {
    title: 'Minimal',
    children: (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Empty State</h2>
        <p className="text-gray-600">No content to display yet.</p>
      </div>
    )
  }
};

export const WorldsPageExample: Story = {
  args: {
    title: 'My Worlds',
    description: "Use the 'Make Active' button on a world to set it as your current world, then create characters and start your interactive narrative. You can switch between worlds anytime using the world selector in the navigation bar.",
    actions: (
      <>
        <button className="py-2 px-4 bg-blue-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors">
          Create World
        </button>
        <button className="py-2 px-4 bg-purple-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-purple-600 transition-colors">
          Generate World
        </button>
      </>
    ),
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Fantasy Realm', 'Cyberpunk City', 'Wild West'].map(world => (
          <div key={world} className="bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-blue-300 transition-colors">
            <h3 className="text-lg font-semibold mb-2">{world}</h3>
            <p className="text-gray-600 mb-4">A sample world description...</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                Make Active
              </button>
              <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }
};

export const CharactersPageExample: Story = {
  args: {
    title: 'My Characters',
    description: 'Fantasy Realm • Create unique characters for your interactive narrative adventures. Use the "Make Active" button on a character to set them as your current character for gameplay.',
    actions: (
      <>
        <button className="py-2 px-4 bg-indigo-600 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-indigo-700 transition-colors">
          Start Playing
        </button>
        <button className="py-2 px-4 bg-blue-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors">
          Create Character
        </button>
        <button className="py-2 px-4 bg-purple-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-purple-600 transition-colors">
          Generate Character
        </button>
      </>
    ),
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Aria Starweaver', 'Zane Shadowblade', 'Luna Brightforge'].map(character => (
          <div key={character} className="bg-white rounded-lg shadow p-6 border-2 border-green-500 bg-green-50 relative">
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Active
            </div>
            <h3 className="text-lg font-semibold mb-2">{character}</h3>
            <p className="text-gray-600 mb-4">Level 5 Warrior</p>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                View
              </button>
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                Play
              </button>
              <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }
};

export const DifferentWidths: Story = {
  render: () => (
    <div className="space-y-8">
      <PageLayout
        title="Small Width (sm)"
        maxWidth="sm"
        description="This layout uses max-width: sm"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <p>Content with small max width</p>
        </div>
      </PageLayout>
      
      <PageLayout
        title="Large Width (6xl)"
        maxWidth="6xl"
        description="This layout uses max-width: 6xl"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <p>Content with large max width</p>
        </div>
      </PageLayout>
    </div>
  )
};
